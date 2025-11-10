const { validationResult } = require('express-validator');
const LoanApplication = require('../models/LoanApplication');
const LoanDetails = require('../models/LoanDetails');
const SME = require('../models/SME');
const Corporate = require('../models/Corporate');

// Generate unique application ID
const generateApplicationId = (smeId) => {
  const timestamp = Date.now();
  return `app_${smeId}_${timestamp}`;
};

// @desc    Submit loan application (SME)
// @route   POST /api/loan/apply
// @access  Private (SME only)
const applyForLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Get SME profile
    const sme = await SME.findOne({ user_id: req.user.user_id });
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
      collateral_value
    } = req.body;

    // Calculate risk grade based on SME profile
    let risk_grade = 'C'; // Default
    if (sme.credit_score >= 85 && sme.esg_score >= 80) risk_grade = 'A';
    else if (sme.credit_score >= 75 && sme.esg_score >= 70) risk_grade = 'B';
    else if (sme.credit_score >= 65) risk_grade = 'C';
    else risk_grade = 'D';

    // Calculate proposed interest rate based on risk grade
    const rateMap = { 'A': 8.5, 'B': 10.0, 'C': 12.5, 'D': 15.0 };
    const proposed_interest_rate = rateMap[risk_grade];

    const application = new LoanApplication({
      application_id: generateApplicationId(sme.sme_id),
      sme_id: sme.sme_id,
      requested_amount,
      loan_purpose,
      loan_term_months,
      proposed_interest_rate,
      collateral_description,
      collateral_value,
      risk_grade
    });

    await application.save();

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

// @desc    Get all loan applications (Corporate)
// @route   GET /api/loan/applications
// @access  Private (Corporate only)
const getLoanApplications = async (req, res) => {
  try {
    const { status, risk_grade, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.application_status = status;
    if (risk_grade) filter.risk_grade = risk_grade;

    const applications = await LoanApplication.find(filter)
      .populate({
        path: 'sme_id',
        model: 'SME',
        select: 'company_name industry_sector credit_score esg_score trust_score'
      })
      .sort({ submitted_at: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LoanApplication.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
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
    const { id } = req.params;
    const { final_amount, final_interest_rate, final_term_months } = req.body;

    // Get corporate profile
    const corporate = await Corporate.findOne({ user_id: req.user.user_id });
    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: 'Corporate profile not found'
      });
    }

    // Find application
    const application = await LoanApplication.findOne({ application_id: id });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    if (application.application_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been processed'
      });
    }

    // Check if corporate has sufficient funds
    const loanAmount = final_amount || application.requested_amount;
    if (corporate.available_funds < loanAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds available for this loan'
      });
    }

    // Update application status
    application.application_status = 'approved';
    application.reviewed_by = corporate.corporate_id;
    application.reviewed_at = new Date();
    await application.save();

    // Create loan details
    const loanDetails = new LoanDetails({
      application_id: application.application_id,
      sme_id: application.sme_id,
      corporate_id: corporate.corporate_id,
      principal_amount: loanAmount,
      interest_rate: final_interest_rate || application.proposed_interest_rate,
      loan_term_months: final_term_months || application.loan_term_months,
      risk_grade: application.risk_grade,
      collateral_held: application.collateral_description
    });

    await loanDetails.save();

    // Update corporate funds
    corporate.allocated_funds += loanAmount;
    corporate.active_loans_count += 1;
    corporate.total_disbursed += loanAmount;
    await corporate.save();

    res.json({
      success: true,
      message: 'Loan approved successfully',
      data: {
        application,
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
    const { id } = req.params;
    const { rejection_reason } = req.body;

    // Get corporate profile
    const corporate = await Corporate.findOne({ user_id: req.user.user_id });
    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: 'Corporate profile not found'
      });
    }

    // Find application
    const application = await LoanApplication.findOne({ application_id: id });
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    if (application.application_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been processed'
      });
    }

    // Update application status
    application.application_status = 'rejected';
    application.rejection_reason = rejection_reason;
    application.reviewed_by = corporate.corporate_id;
    application.reviewed_at = new Date();
    await application.save();

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
// @access  Private
const getLoanDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const loanDetails = await LoanDetails.findOne({ loan_id: id })
      .populate({
        path: 'sme_id',
        model: 'SME',
        select: 'company_name industry_sector credit_score esg_score trust_score'
      })
      .populate({
        path: 'corporate_id',
        model: 'Corporate',
        select: 'corporation_name'
      });

    if (!loanDetails) {
      return res.status(404).json({
        success: false,
        message: 'Loan details not found'
      });
    }

    // Check if user has access to this loan
    const userProfile = req.user.user_type === 'SME' 
      ? await SME.findOne({ user_id: req.user.user_id })
      : await Corporate.findOne({ user_id: req.user.user_id });

    const hasAccess = req.user.user_type === 'SME' 
      ? loanDetails.sme_id === userProfile.sme_id
      : loanDetails.corporate_id === userProfile.corporate_id;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    res.json({
      success: true,
      data: loanDetails
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
    // Get SME profile
    const sme = await SME.findOne({ user_id: req.user.user_id });
    if (!sme) {
      return res.status(404).json({
        success: false,
        message: 'SME profile not found'
      });
    }

    // Get applications
    const applications = await LoanApplication.find({ sme_id: sme.sme_id })
      .sort({ submitted_at: -1 });

    // Get active loans
    const activeLoans = await LoanDetails.find({ sme_id: sme.sme_id })
      .populate({
        path: 'corporate_id',
        model: 'Corporate',
        select: 'corporation_name'
      })
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: {
        applications,
        active_loans: activeLoans
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

module.exports = {
  applyForLoan,
  getLoanApplications,
  approveLoan,
  rejectLoan,
  getLoanDetails,
  getMyLoans
};