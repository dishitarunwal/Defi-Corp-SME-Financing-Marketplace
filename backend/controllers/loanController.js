const { validationResult } = require('express-validator');
const LoanApplication = require('../models/LoanApplication');
const LoanDetails = require('../models/LoanDetails');
const SME = require('../models/SME');
const Corporate = require('../models/Corporate');
const { uniqueId } = require('../utils/ids');
const { assessApplication, monthlyPaymentFor } = require('../services/riskEngine');
const chain = require('../services/blockchainSimulator');

const DAY_MS = 24 * 60 * 60 * 1000;
const SME_FIELDS = 'sme_id user_id company_name industry_sector credit_score esg_score trust_score city state year_established annual_revenue employee_count documents_verified';

const round2 = (value) => Math.round(value * 100) / 100;

const sendValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json({
    success: false,
    message: errors.array()[0].msg,
    errors: errors.array()
  });
  return true;
};

const getSMEProfile = (req) => SME.findOne({ user_id: req.user.user_id });
const getCorporateProfile = (req) => Corporate.findOne({ user_id: req.user.user_id });

// Loads a loan and checks that the logged-in user is a party to it
const loadLoanForUser = async (req, loanId) => {
  const loan = await LoanDetails.findOne({ loan_id: loanId })
    .populate({ path: 'sme', select: SME_FIELDS })
    .populate({ path: 'corporate', select: 'corporate_id user_id corporation_name' })
    .populate({ path: 'application', select: 'loan_purpose collateral_description collateral_value monthly_revenue business_description submitted_at' });

  if (!loan) return { status: 404, message: 'Loan not found' };

  const profile = req.user.user_type === 'SME' ? await getSMEProfile(req) : await getCorporateProfile(req);
  const hasAccess = profile && (req.user.user_type === 'SME'
    ? loan.sme_id === profile.sme_id
    : loan.corporate_id === profile.corporate_id);

  if (!hasAccess) return { status: 403, message: 'Access denied to this loan' };

  return { loan, profile };
};

// @desc    Preview risk grade, rate and repayment for a prospective loan (SME)
// @route   POST /api/loan/quote
// @access  Private (SME only)
const getQuote = async (req, res) => {
  try {
    const sme = await getSMEProfile(req);
    if (!sme) {
      return res.status(404).json({ success: false, message: 'SME profile not found' });
    }

    const requested_amount = Number(req.body.requested_amount) || 0;
    const collateral_value = Number(req.body.collateral_value) || 0;
    const loan_term_months = Number(req.body.loan_term_months) || 12;

    const assessment = assessApplication(sme, { requested_amount, collateral_value });
    const monthly_payment = requested_amount > 0
      ? monthlyPaymentFor(requested_amount, assessment.proposed_interest_rate, loan_term_months)
      : 0;

    res.json({
      success: true,
      data: {
        ...assessment,
        loan_term_months,
        monthly_payment: round2(monthly_payment),
        total_repayable: round2(monthly_payment * loan_term_months),
        total_interest: round2(monthly_payment * loan_term_months - requested_amount)
      }
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ success: false, message: 'Server error generating quote' });
  }
};

// @desc    Submit loan application (SME)
// @route   POST /api/loan/apply
// @access  Private (SME only)
const applyForLoan = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const sme = await getSMEProfile(req);
    if (!sme) {
      return res.status(404).json({
        success: false,
        message: 'SME profile not found'
      });
    }

    const {
      requested_amount,
      loan_purpose,
      loan_term_months,
      collateral_description,
      collateral_value,
      monthly_revenue,
      business_description
    } = req.body;

    const { risk_grade, proposed_interest_rate } = assessApplication(sme, {
      requested_amount: Number(requested_amount),
      collateral_value: Number(collateral_value)
    });

    const application = await LoanApplication.create({
      application_id: uniqueId(`app_${sme.sme_id}`),
      sme_id: sme.sme_id,
      requested_amount,
      loan_purpose,
      loan_term_months,
      proposed_interest_rate,
      collateral_description,
      collateral_value,
      monthly_revenue: monthly_revenue || null,
      business_description: business_description || null,
      risk_grade
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Apply for loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during loan application'
    });
  }
};

// @desc    Get loan applications (Corporate)
// @route   GET /api/loan/applications
// @access  Private (Corporate only)
const getLoanApplications = async (req, res) => {
  try {
    const { status, risk_grade } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = {};
    if (status) filter.application_status = status;
    if (risk_grade) filter.risk_grade = risk_grade;

    const [applications, total] = await Promise.all([
      LoanApplication.find(filter)
        .populate({ path: 'sme', select: SME_FIELDS })
        .populate({ path: 'reviewer', select: 'corporate_id corporation_name' })
        .sort({ submitted_at: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      LoanApplication.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current_page: page,
          total_pages: Math.max(1, Math.ceil(total / limit)),
          total_applications: total
        }
      }
    });

  } catch (error) {
    console.error('Get loan applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching loan applications'
    });
  }
};

// @desc    Approve loan application (Corporate)
// @route   PATCH /api/loan/:id/approve
// @access  Private (Corporate only)
const approveLoan = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const { id } = req.params;
    const { final_amount, final_interest_rate, final_term_months } = req.body;

    const corporate = await getCorporateProfile(req);
    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: 'Corporate profile not found'
      });
    }

    const application = await LoanApplication.findOne({ application_id: id });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    if (!['pending', 'under_review'].includes(application.application_status)) {
      return res.status(400).json({
        success: false,
        message: 'Application has already been processed'
      });
    }

    const loanAmount = Number(final_amount) || application.requested_amount;
    if (corporate.available_funds < loanAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds: ₹${corporate.available_funds.toLocaleString('en-IN')} available, ₹${loanAmount.toLocaleString('en-IN')} required`
      });
    }

    // Claim the application atomically so two lenders can't approve it at the same time
    const claimed = await LoanApplication.findOneAndUpdate(
      { application_id: id, application_status: { $in: ['pending', 'under_review'] } },
      { application_status: 'approved', reviewed_by: corporate.corporate_id, reviewed_at: new Date() },
      { new: true }
    );
    if (!claimed) {
      return res.status(409).json({
        success: false,
        message: 'Application was just processed by another lender'
      });
    }

    let loanDetails;
    try {
      const loan_id = uniqueId(`loan_${application.sme_id}`);
      const contract = chain.deployLoanContract(loan_id);
      const borrower = await SME.findOne({ sme_id: application.sme_id }).select('user_id');
      const disbursement = chain.recordTransaction({
        type: 'disbursement',
        from: contract.contract_address,
        to: chain.walletAddressFor(borrower ? borrower.user_id : application.sme_id),
        amount: loanAmount,
        reference: loan_id
      });

      const { deployment, ...blockchain } = contract;

      loanDetails = await LoanDetails.create({
        loan_id,
        application_id: application.application_id,
        sme_id: application.sme_id,
        corporate_id: corporate.corporate_id,
        principal_amount: loanAmount,
        interest_rate: Number(final_interest_rate) || application.proposed_interest_rate,
        loan_term_months: Number(final_term_months) || application.loan_term_months,
        risk_grade: application.risk_grade,
        collateral_held: application.collateral_description,
        blockchain,
        transactions: [{ ...deployment, amount: loanAmount }, disbursement],
        messages: [{
          sender_type: 'SYSTEM',
          sender_name: 'DeFiCorp',
          message: `Loan agreement deployed at ${blockchain.contract_address} and ₹${loanAmount.toLocaleString('en-IN')} disbursed to the borrower.`
        }]
      });
    } catch (creationError) {
      // Roll the application back so it can be approved again
      await LoanApplication.updateOne(
        { application_id: id },
        { application_status: application.application_status, reviewed_by: null, reviewed_at: null }
      );
      throw creationError;
    }

    claimed.loan_id = loanDetails.loan_id;
    await claimed.save();

    corporate.allocated_funds += loanAmount;
    corporate.active_loans_count += 1;
    corporate.total_disbursed += loanAmount;
    await corporate.save();

    res.json({
      success: true,
      message: 'Loan approved and funds disbursed',
      data: {
        application: claimed,
        loan_details: loanDetails
      }
    });

  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during loan approval'
    });
  }
};

// @desc    Reject loan application (Corporate)
// @route   PATCH /api/loan/:id/reject
// @access  Private (Corporate only)
const rejectLoan = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const { id } = req.params;
    const { rejection_reason } = req.body;

    const corporate = await getCorporateProfile(req);
    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: 'Corporate profile not found'
      });
    }

    const application = await LoanApplication.findOneAndUpdate(
      { application_id: id, application_status: { $in: ['pending', 'under_review'] } },
      {
        application_status: 'rejected',
        rejection_reason,
        reviewed_by: corporate.corporate_id,
        reviewed_at: new Date()
      },
      { new: true }
    );

    if (!application) {
      const exists = await LoanApplication.exists({ application_id: id });
      return res.status(exists ? 400 : 404).json({
        success: false,
        message: exists ? 'Application has already been processed' : 'Loan application not found'
      });
    }

    res.json({
      success: true,
      message: 'Loan application rejected',
      data: application
    });

  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during loan rejection'
    });
  }
};

// @desc    Get loan details
// @route   GET /api/loan/details/:id
// @access  Private (borrower or lender of the loan)
const getLoanDetails = async (req, res) => {
  try {
    const result = await loadLoanForUser(req, req.params.id);
    if (!result.loan) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    res.json({
      success: true,
      data: result.loan
    });

  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching loan details'
    });
  }
};

// @desc    Get SME's loan applications and active loans
// @route   GET /api/loan/my-loans
// @access  Private (SME only)
const getMyLoans = async (req, res) => {
  try {
    const sme = await getSMEProfile(req);
    if (!sme) {
      return res.status(404).json({
        success: false,
        message: 'SME profile not found'
      });
    }

    const [applications, loans] = await Promise.all([
      LoanApplication.find({ sme_id: sme.sme_id })
        .populate({ path: 'reviewer', select: 'corporate_id corporation_name' })
        .sort({ submitted_at: -1 }),
      LoanDetails.find({ sme_id: sme.sme_id })
        .populate({ path: 'corporate', select: 'corporate_id corporation_name' })
        .populate({ path: 'sme', select: SME_FIELDS })
        .sort({ created_at: -1 })
    ]);

    res.json({
      success: true,
      data: {
        profile: sme,
        applications,
        active_loans: loans
      }
    });

  } catch (error) {
    console.error('Get my loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching loans'
    });
  }
};

// @desc    Make a repayment on a loan (SME)
// @route   POST /api/loan/details/:id/repay
// @access  Private (SME borrower only)
const repayLoan = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const result = await loadLoanForUser(req, req.params.id);
    if (!result.loan) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    const { loan } = result;

    if (loan.loan_status === 'completed') {
      return res.status(400).json({ success: false, message: 'This loan is already fully repaid' });
    }

    const remaining = round2(loan.amount_remaining);
    const amount = round2(Math.min(Number(req.body.amount) || loan.monthly_payment, remaining));
    if (!(amount > 0)) {
      return res.status(400).json({ success: false, message: 'Repayment amount must be greater than zero' });
    }

    const repayment = chain.recordTransaction({
      type: 'repayment',
      from: chain.walletAddressFor(loan.sme?.user_id || loan.sme_id),
      to: loan.blockchain?.contract_address,
      amount,
      reference: loan.loan_id
    });

    loan.amount_paid = round2(loan.amount_paid + amount);
    loan.amount_remaining = round2(Math.max(0, loan.total_repayable - loan.amount_paid));
    loan.payments_made = Math.min(loan.loan_term_months, Math.floor((loan.amount_paid + 0.01) / loan.monthly_payment));
    loan.next_payment_date = new Date(loan.disbursement_date.getTime() + (loan.payments_made + 1) * 30 * DAY_MS);
    loan.transactions.push(repayment);
    loan.messages.push({
      sender_type: 'SYSTEM',
      sender_name: 'DeFiCorp',
      message: `Repayment of ₹${amount.toLocaleString('en-IN')} confirmed in block #${repayment.block_number.toLocaleString('en-US')}.`
    });

    const completed = loan.amount_remaining <= 0.5;
    if (completed) {
      loan.amount_remaining = 0;
      loan.loan_status = 'completed';
      loan.completed_at = new Date();
      loan.next_payment_date = null;
      loan.transactions.push(chain.recordTransaction({
        type: 'completion',
        from: loan.blockchain?.contract_address,
        to: chain.walletAddressFor(loan.corporate?.user_id || loan.corporate_id),
        amount: 0,
        reference: loan.loan_id
      }));
      loan.messages.push({
        sender_type: 'SYSTEM',
        sender_name: 'DeFiCorp',
        message: 'Loan fully repaid. Collateral released and the contract has been closed.'
      });
    }

    await loan.save();

    // Principal flows back into the lender's available funds; interest is added as earnings
    const corporate = await Corporate.findOne({ corporate_id: loan.corporate_id });
    if (corporate) {
      const principalShare = round2(amount * (loan.principal_amount / loan.total_repayable));
      corporate.allocated_funds = Math.max(0, round2(corporate.allocated_funds - principalShare));
      corporate.total_treasury_funds = round2(corporate.total_treasury_funds + (amount - principalShare));
      corporate.total_repaid = round2(corporate.total_repaid + amount);
      if (completed) corporate.active_loans_count = Math.max(0, corporate.active_loans_count - 1);
      await corporate.save();
    }

    res.json({
      success: true,
      message: completed ? 'Loan fully repaid' : 'Repayment recorded',
      data: { loan, transaction: repayment }
    });
  } catch (error) {
    console.error('Repay loan error:', error);
    res.status(500).json({ success: false, message: 'Server error processing repayment' });
  }
};

// @desc    Post a message on a loan's communication thread
// @route   POST /api/loan/details/:id/messages
// @access  Private (borrower or lender of the loan)
const addLoanMessage = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const result = await loadLoanForUser(req, req.params.id);
    if (!result.loan) {
      return res.status(result.status).json({ success: false, message: result.message });
    }

    const { loan, profile } = result;
    loan.messages.push({
      sender_type: req.user.user_type,
      sender_name: req.user.user_type === 'SME' ? profile.company_name : profile.corporation_name,
      message: req.body.message
    });
    await loan.save();

    res.status(201).json({
      success: true,
      data: loan.messages
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ success: false, message: 'Server error sending message' });
  }
};

const monthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

// @desc    Corporate portfolio with analytics
// @route   GET /api/loan/portfolio
// @access  Private (Corporate only)
const getPortfolio = async (req, res) => {
  try {
    const corporate = await getCorporateProfile(req);
    if (!corporate) {
      return res.status(404).json({ success: false, message: 'Corporate profile not found' });
    }

    const [loans, pendingApplications] = await Promise.all([
      LoanDetails.find({ corporate_id: corporate.corporate_id })
        .select('-messages')
        .populate({ path: 'sme', select: SME_FIELDS })
        .sort({ created_at: -1 }),
      LoanApplication.countDocuments({ application_status: { $in: ['pending', 'under_review'] } })
    ]);

    const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
    const weightedRate = loans.reduce((sum, loan) => sum + loan.principal_amount * loan.interest_rate, 0);
    const activeLoans = loans.filter((loan) => loan.loan_status !== 'completed');

    const interestEarned = loans.reduce((sum, loan) => {
      const interestShare = 1 - loan.principal_amount / loan.total_repayable;
      return sum + loan.amount_paid * interestShare;
    }, 0);

    const esgScores = loans.map((loan) => loan.sme?.esg_score).filter((score) => typeof score === 'number');

    const risk_distribution = ['A', 'B', 'C', 'D'].map((grade) => {
      const gradeLoans = loans.filter((loan) => loan.risk_grade === grade);
      const amount = gradeLoans.reduce((sum, loan) => sum + loan.principal_amount, 0);
      return {
        grade,
        count: gradeLoans.length,
        amount,
        value: totalPrincipal ? Math.round((amount / totalPrincipal) * 100) : 0
      };
    });

    // Last 6 months of disbursements and repayments
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: monthKey(date),
        month: date.toLocaleString('en-US', { month: 'short' }),
        disbursed: 0,
        repaid: 0
      });
    }
    const monthIndex = Object.fromEntries(months.map((m, i) => [m.key, i]));
    loans.forEach((loan) => {
      loan.transactions.forEach((tx) => {
        const index = monthIndex[monthKey(new Date(tx.timestamp))];
        if (index === undefined) return;
        if (tx.type === 'disbursement') months[index].disbursed += tx.amount;
        if (tx.type === 'repayment') months[index].repaid += tx.amount;
      });
    });

    const industries = {};
    loans.forEach((loan) => {
      const industry = loan.sme?.industry_sector || 'Other';
      if (!industries[industry]) industries[industry] = { industry, amount: 0, loans: 0, esgTotal: 0 };
      industries[industry].amount += loan.principal_amount;
      industries[industry].loans += 1;
      industries[industry].esgTotal += loan.sme?.esg_score || 0;
    });

    res.json({
      success: true,
      data: {
        corporate,
        wallet_address: chain.walletAddressFor(req.user.user_id),
        network: chain.NETWORK,
        loans,
        stats: {
          total_treasury_funds: corporate.total_treasury_funds,
          available_funds: corporate.available_funds,
          allocated_funds: corporate.allocated_funds,
          total_disbursed: corporate.total_disbursed,
          total_repaid: corporate.total_repaid,
          interest_earned: round2(interestEarned),
          active_loans: activeLoans.length,
          completed_loans: loans.length - activeLoans.length,
          portfolio_yield: totalPrincipal ? round2(weightedRate / totalPrincipal) : 0,
          average_esg: esgScores.length ? Math.round(esgScores.reduce((a, b) => a + b, 0) / esgScores.length) : 0,
          pending_applications: pendingApplications
        },
        risk_distribution,
        monthly_activity: months.map(({ key, disbursed, repaid, ...rest }) => ({ ...rest, disbursed: round2(disbursed), repaid: round2(repaid) })),
        industry_breakdown: Object.values(industries).map(({ esgTotal, ...rest }) => ({
          ...rest,
          esg: rest.loans ? Math.round(esgTotal / rest.loans) : 0
        }))
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching portfolio' });
  }
};

// @desc    Add funds to the corporate treasury pool
// @route   POST /api/loan/treasury/deposit
// @access  Private (Corporate only)
const depositFunds = async (req, res) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const corporate = await getCorporateProfile(req);
    if (!corporate) {
      return res.status(404).json({ success: false, message: 'Corporate profile not found' });
    }

    const amount = Number(req.body.amount);
    corporate.total_treasury_funds = round2(corporate.total_treasury_funds + amount);
    await corporate.save();

    const transaction = chain.recordTransaction({
      type: 'deposit',
      from: chain.walletAddressFor(req.user.user_id),
      to: chain.POOL_ADDRESS,
      amount,
      reference: corporate.corporate_id
    });

    res.json({
      success: true,
      message: 'Funds deposited into the lending pool',
      data: { corporate, transaction }
    });
  } catch (error) {
    console.error('Deposit funds error:', error);
    res.status(500).json({ success: false, message: 'Server error depositing funds' });
  }
};

// @desc    Corporate lender leaderboard
// @route   GET /api/loan/leaderboard
// @access  Private (Corporate only)
const getLeaderboard = async (req, res) => {
  try {
    const me = await getCorporateProfile(req);

    const [corporates, yields] = await Promise.all([
      Corporate.find().sort({ total_disbursed: -1 }).limit(10),
      LoanDetails.aggregate([
        {
          $group: {
            _id: '$corporate_id',
            principal: { $sum: '$principal_amount' },
            weighted: { $sum: { $multiply: ['$principal_amount', '$interest_rate'] } },
            loans: { $sum: 1 }
          }
        }
      ])
    ]);

    const yieldMap = Object.fromEntries(yields.map((y) => [y._id, y]));
    const badgeFor = (amount) => {
      if (amount >= 20000000) return 'Platinum';
      if (amount >= 5000000) return 'Gold';
      if (amount >= 1000000) return 'Silver';
      return 'Bronze';
    };

    const leaderboard = corporates.map((corp, index) => {
      const stats = yieldMap[corp.corporate_id];
      return {
        rank: index + 1,
        corporate_id: corp.corporate_id,
        company: corp.corporation_name,
        totalLent: corp.total_disbursed,
        loans: stats?.loans || 0,
        yield: stats?.principal ? round2(stats.weighted / stats.principal) : 0,
        badge: badgeFor(corp.total_disbursed),
        is_you: me ? corp.corporate_id === me.corporate_id : false
      };
    });

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
  }
};

module.exports = {
  getQuote,
  applyForLoan,
  getLoanApplications,
  approveLoan,
  rejectLoan,
  getLoanDetails,
  getMyLoans,
  repayLoan,
  addLoanMessage,
  getPortfolio,
  depositFunds,
  getLeaderboard
};
