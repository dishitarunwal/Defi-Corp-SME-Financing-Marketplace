const User = require('../models/User');
const SME = require('../models/SME');
const Corporate = require('../models/Corporate');
const LoanApplication = require('../models/LoanApplication');
const LoanDetails = require('../models/LoanDetails');
const { uniqueId } = require('./ids');
const { scoreSMEProfile, assessApplication } = require('../services/riskEngine');
const chain = require('../services/blockchainSimulator');

// Demo accounts shown on the login screen
const DEMO_PASSWORD = 'password123';
const DEMO_SME_EMAIL = 'daksh.mishra@techventures.com';
const DEMO_CORPORATE_EMAIL = 'dhiti.wadhwa@financecorp.com';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const round2 = (value) => Math.round(value * 100) / 100;

const corporatesSeed = [
  { key: 'financecorp', email: DEMO_CORPORATE_EMAIL, full_name: 'Dhiti Wadhwa', phone: '+91-9810011223', name: 'FinanceCorp Ltd', reg: 'L65910MH2009PLC190001', treasury: 50000000 },
  { key: 'apex', email: 'treasury@apexpartners.in', full_name: 'Rohan Mehta', phone: '+91-9820034455', name: 'Apex Treasury Partners', reg: 'L67120DL2011PLC220002', treasury: 80000000 },
  { key: 'meridian', email: 'cfo@meridiancapital.in', full_name: 'Ananya Iyer', phone: '+91-9845056677', name: 'Meridian Capital Holdings', reg: 'L65999KA2014PLC330003', treasury: 30000000 }
];

const smesSeed = [
  { key: 'techventures', email: DEMO_SME_EMAIL, full_name: 'Daksh Mishra', phone: '+91-9876543210', name: 'TechVentures Pvt Ltd', reg: 'U72200KA2016PTC100001', industry: 'Technology', year: 2016, revenue: 24000000, employees: 45, city: 'Bengaluru', state: 'Karnataka' },
  { key: 'greenleaf', email: 'founder@greenleafsolar.in', full_name: 'Meera Kulkarni', phone: '+91-9890012345', name: 'GreenLeaf Solar Systems', reg: 'U40106MH2015PTC100002', industry: 'Renewable Energy', year: 2015, revenue: 38000000, employees: 62, city: 'Pune', state: 'Maharashtra' },
  { key: 'medicare', email: 'admin@medicareplus.in', full_name: 'Dr. Arjun Rao', phone: '+91-9849023456', name: 'MediCare Plus Clinics', reg: 'U85110TG2012PTC100003', industry: 'Healthcare', year: 2012, revenue: 56000000, employees: 120, city: 'Hyderabad', state: 'Telangana' },
  { key: 'agronext', email: 'hello@agronext.in', full_name: 'Kavya Patil', phone: '+91-9822034567', name: 'AgroNext Solutions', reg: 'U01403MH2019PTC100004', industry: 'Agriculture & Technology', year: 2019, revenue: 9500000, employees: 18, city: 'Nashik', state: 'Maharashtra' },
  { key: 'urbanbite', email: 'ops@urbanbite.in', full_name: 'Sameer Khan', phone: '+91-9819045678', name: 'UrbanBite Foods', reg: 'U15400MH2017PTC100005', industry: 'Food & Beverage', year: 2017, revenue: 14000000, employees: 30, city: 'Mumbai', state: 'Maharashtra' }
];

const applicationsSeed = [
  {
    sme: 'techventures', amount: 1500000, term: 24, daysAgo: 160, collateral: 1800000,
    purpose: 'Purchase of cloud infrastructure and developer workstations to support three new enterprise SaaS contracts signed this quarter.',
    collateralDesc: 'Hypothecation of office IT equipment and receivables from signed enterprise contracts',
    loan: { lender: 'financecorp', sme: 'Thank you for the quick approval! The new servers are already live for our enterprise clients.', corp: 'Great to hear. Please share the quarterly revenue update when it is ready.' }
  },
  {
    sme: 'techventures', amount: 800000, term: 12, daysAgo: 3, collateral: 900000,
    purpose: 'Working capital to hire four engineers for a new AI analytics product line ahead of a pilot launch with two retail customers.',
    collateralDesc: 'Fixed deposit of ₹9,00,000 held with HDFC Bank'
  },
  {
    sme: 'greenleaf', amount: 2500000, term: 36, daysAgo: 128, collateral: 3200000,
    purpose: 'Expansion of rooftop solar installation capacity with two new installation crews and inventory of high-efficiency panels.',
    collateralDesc: 'Solar panel inventory and installation equipment valued at ₹32 lakh',
    loan: { lender: 'financecorp', sme: 'We have completed 14 new installations with the expanded crew this month.', corp: 'Excellent progress. The ESG impact numbers look strong.' }
  },
  {
    sme: 'medicare', amount: 4000000, term: 48, daysAgo: 95, collateral: 5500000,
    purpose: 'Setting up a new diagnostic centre with digital X-ray and pathology equipment to serve the growing patient base in Hyderabad.',
    collateralDesc: 'Medical diagnostic equipment and clinic leasehold rights',
    loan: { lender: 'apex' }
  },
  {
    sme: 'urbanbite', amount: 300000, term: 6, daysAgo: 200, collateral: 450000,
    purpose: 'Seasonal working capital for festive season inventory, packaging materials and additional delivery staff for cloud kitchens.',
    collateralDesc: 'Kitchen equipment and delivery vehicles',
    loan: { lender: 'financecorp' }
  },
  {
    sme: 'urbanbite', amount: 600000, term: 18, daysAgo: 40, collateral: 700000,
    purpose: 'Opening a second cloud kitchen in Thane, including kitchen fit-out, refrigeration and initial raw material stock.',
    collateralDesc: 'Commercial refrigeration units and kitchen fit-out',
    loan: { lender: 'meridian' }
  },
  {
    sme: 'agronext', amount: 1200000, term: 24, daysAgo: 6, collateral: 1500000,
    purpose: 'Deploying IoT soil sensors and drip irrigation controllers for 120 partner farms in the Nashik grape belt this season.',
    collateralDesc: 'IoT sensor inventory and irrigation controller stock'
  },
  {
    sme: 'medicare', amount: 900000, term: 12, daysAgo: 2, collateral: 1100000,
    purpose: 'Upgrading the hospital management software and telemedicine platform across all three clinic branches in the city.',
    collateralDesc: 'Receivables from corporate health check-up contracts'
  },
  {
    sme: 'agronext', amount: 5000000, term: 60, daysAgo: 70, collateral: 1200000,
    purpose: 'Building a cold storage facility for partner farmers to reduce post-harvest losses and improve export-grade produce quality.',
    collateralDesc: 'Land lease agreement for the cold storage site',
    rejected: { lender: 'meridian', reason: 'Requested amount is too high relative to annual revenue and collateral coverage.' }
  }
];

const createUser = (type, seed) => new User({
  user_id: uniqueId(type === 'SME' ? 'usr_sme' : 'usr_corp'),
  email: seed.email,
  password_hash: DEMO_PASSWORD,
  user_type: type,
  full_name: seed.full_name,
  phone_number: seed.phone,
  is_verified: true
}).save();

// Creates a back-dated loan with repayment history and simulated chain records
const createLoan = async ({ application, corporate, corporateUser, sme, smeUser, disbursedAt, messages }) => {
  const loan_id = uniqueId(`loan_${sme.sme_id}`);
  const contract = chain.deployLoanContract(loan_id);
  const { deployment, ...blockchain } = contract;
  const ageBlocks = Math.floor((Date.now() - disbursedAt.getTime()) / 12000);

  blockchain.block_number -= ageBlocks;
  blockchain.deployed_at = disbursedAt;
  deployment.block_number = blockchain.block_number;
  deployment.timestamp = disbursedAt;
  deployment.amount = application.requested_amount;

  const disbursement = chain.recordTransaction({
    type: 'disbursement',
    from: blockchain.contract_address,
    to: chain.walletAddressFor(smeUser.user_id),
    amount: application.requested_amount,
    reference: loan_id
  });
  disbursement.block_number = blockchain.block_number + 2;
  disbursement.timestamp = new Date(disbursedAt.getTime() + 60000);

  const loan = new LoanDetails({
    loan_id,
    application_id: application.application_id,
    sme_id: sme.sme_id,
    corporate_id: corporate.corporate_id,
    principal_amount: application.requested_amount,
    interest_rate: application.proposed_interest_rate,
    loan_term_months: application.loan_term_months,
    risk_grade: application.risk_grade,
    collateral_held: application.collateral_description,
    disbursement_date: disbursedAt,
    created_at: disbursedAt,
    blockchain,
    transactions: [deployment, disbursement],
    messages: [{
      sender_type: 'SYSTEM',
      sender_name: 'DeFiCorp',
      message: `Loan agreement deployed at ${blockchain.contract_address} and ₹${application.requested_amount.toLocaleString('en-IN')} disbursed to the borrower.`,
      created_at: disbursedAt
    }]
  });
  await loan.validate();

  // Borrower has paid every installment that has fallen due so far
  const payments = Math.min(loan.loan_term_months, Math.floor((Date.now() - disbursedAt.getTime()) / (30 * DAY_MS)));

  for (let i = 1; i <= payments; i += 1) {
    const paidAt = new Date(disbursedAt.getTime() + i * 30 * DAY_MS);
    const amount = i === loan.loan_term_months
      ? round2(loan.total_repayable - loan.amount_paid)
      : loan.monthly_payment;
    const tx = chain.recordTransaction({
      type: 'repayment',
      from: chain.walletAddressFor(smeUser.user_id),
      to: blockchain.contract_address,
      amount,
      reference: loan_id
    });
    tx.timestamp = paidAt;
    tx.block_number = blockchain.block_number + Math.floor((paidAt - disbursedAt) / 12000);
    loan.transactions.push(tx);
    loan.amount_paid = round2(loan.amount_paid + amount);
  }

  loan.payments_made = payments;
  loan.amount_remaining = round2(Math.max(0, loan.total_repayable - loan.amount_paid));
  loan.next_payment_date = new Date(disbursedAt.getTime() + (payments + 1) * 30 * DAY_MS);

  if (payments >= loan.loan_term_months) {
    const completedAt = new Date(disbursedAt.getTime() + payments * 30 * DAY_MS);
    loan.loan_status = 'completed';
    loan.amount_remaining = 0;
    loan.completed_at = completedAt;
    loan.next_payment_date = null;
    const tx = chain.recordTransaction({
      type: 'completion',
      from: blockchain.contract_address,
      to: chain.walletAddressFor(corporateUser.user_id),
      reference: loan_id
    });
    tx.timestamp = completedAt;
    loan.transactions.push(tx);
    loan.messages.push({
      sender_type: 'SYSTEM',
      sender_name: 'DeFiCorp',
      message: 'Loan fully repaid. Collateral released and the contract has been closed.',
      created_at: completedAt
    });
  }

  (messages || []).forEach((msg) => loan.messages.push(msg));
  await loan.save();

  const principalRepaid = round2(loan.amount_paid * (loan.principal_amount / loan.total_repayable));
  corporate.allocated_funds = round2(corporate.allocated_funds + loan.principal_amount - principalRepaid);
  corporate.total_treasury_funds = round2(corporate.total_treasury_funds + (loan.amount_paid - principalRepaid));
  corporate.total_disbursed += loan.principal_amount;
  corporate.total_repaid = round2(corporate.total_repaid + loan.amount_paid);
  if (loan.loan_status !== 'completed') corporate.active_loans_count += 1;

  return loan;
};

const ensureDemoData = async () => {
  const existing = await User.exists({ email: { $in: [DEMO_SME_EMAIL, DEMO_CORPORATE_EMAIL] } });
  if (existing) return false;

  console.log('🌱 Seeding demo data...');

  const corporates = {};
  for (const seed of corporatesSeed) {
    const user = await createUser('CORPORATE', seed);
    const corporate = await Corporate.create({
      corporate_id: uniqueId('corp'),
      user_id: user.user_id,
      corporation_name: seed.name,
      registration_number: seed.reg,
      total_treasury_funds: seed.treasury
    });
    corporates[seed.key] = { user, corporate };
  }

  const smes = {};
  for (const seed of smesSeed) {
    const user = await createUser('SME', seed);
    const profile = {
      industry_sector: seed.industry,
      year_established: seed.year,
      annual_revenue: seed.revenue,
      employee_count: seed.employees
    };
    const sme = await SME.create({
      sme_id: uniqueId('sme'),
      user_id: user.user_id,
      company_name: seed.name,
      registration_number: seed.reg,
      city: seed.city,
      state: seed.state,
      country: 'India',
      documents_verified: true,
      ...profile,
      ...scoreSMEProfile(profile)
    });
    smes[seed.key] = { user, sme };
  }

  for (const seed of applicationsSeed) {
    const { sme, user: smeUser } = smes[seed.sme];
    const submittedAt = daysAgo(seed.daysAgo);
    const { risk_grade, proposed_interest_rate } = assessApplication(sme, {
      requested_amount: seed.amount,
      collateral_value: seed.collateral
    });

    const application = await LoanApplication.create({
      application_id: uniqueId(`app_${sme.sme_id}`),
      sme_id: sme.sme_id,
      requested_amount: seed.amount,
      loan_purpose: seed.purpose,
      loan_term_months: seed.term,
      proposed_interest_rate,
      collateral_description: seed.collateralDesc,
      collateral_value: seed.collateral,
      monthly_revenue: Math.round(sme.annual_revenue / 12),
      risk_grade,
      submitted_at: submittedAt
    });

    if (seed.rejected) {
      application.application_status = 'rejected';
      application.rejection_reason = seed.rejected.reason;
      application.reviewed_by = corporates[seed.rejected.lender].corporate.corporate_id;
      application.reviewed_at = new Date(submittedAt.getTime() + 2 * DAY_MS);
      await application.save();
    }

    if (seed.loan) {
      const { corporate, user: corporateUser } = corporates[seed.loan.lender];
      const reviewedAt = new Date(submittedAt.getTime() + DAY_MS);
      const messages = [];
      if (seed.loan.sme) {
        messages.push({ sender_type: 'SME', sender_name: sme.company_name, message: seed.loan.sme, created_at: new Date(reviewedAt.getTime() + 3 * DAY_MS) });
      }
      if (seed.loan.corp) {
        messages.push({ sender_type: 'CORPORATE', sender_name: corporate.corporation_name, message: seed.loan.corp, created_at: new Date(reviewedAt.getTime() + 4 * DAY_MS) });
      }

      const loan = await createLoan({
        application,
        corporate,
        corporateUser,
        sme,
        smeUser,
        disbursedAt: reviewedAt,
        messages
      });

      application.application_status = 'approved';
      application.reviewed_by = corporate.corporate_id;
      application.reviewed_at = reviewedAt;
      application.loan_id = loan.loan_id;
      await application.save();
    }
  }

  for (const { corporate } of Object.values(corporates)) {
    await corporate.save();
  }

  console.log(`🌱 Demo data ready. Log in with ${DEMO_SME_EMAIL} or ${DEMO_CORPORATE_EMAIL} / ${DEMO_PASSWORD}`);
  return true;
};

module.exports = { ensureDemoData, DEMO_PASSWORD, DEMO_SME_EMAIL, DEMO_CORPORATE_EMAIL };
