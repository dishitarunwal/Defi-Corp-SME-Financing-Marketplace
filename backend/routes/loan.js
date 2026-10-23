const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/loanController');
const { auth, requireSME, requireCorporate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/loan/quote
// @desc    Preview risk grade and repayment for a prospective loan (SME only)
// @access  Private
router.post('/quote', auth, requireSME, getQuote);

// @route   POST /api/loan/apply
// @desc    Submit loan application (SME only)
// @access  Private
router.post('/apply', [
  auth,
  requireSME,
  body('requested_amount')
    .isFloat({ min: 5000, max: 50000000 })
    .withMessage('Loan amount must be between ₹5,000 and ₹5,00,00,000'),
  body('loan_purpose')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Loan purpose must be at least 50 characters'),
  body('loan_term_months')
    .isInt({ min: 6, max: 60 })
    .withMessage('Loan term must be between 6 and 60 months'),
  body('collateral_description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Collateral description must be at least 10 characters'),
  body('collateral_value')
    .isFloat({ min: 1000 })
    .withMessage('Collateral value must be at least ₹1,000'),
  body('monthly_revenue')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Monthly revenue must be a positive number'),
  body('business_description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Business description is too long')
], applyForLoan);

// @route   GET /api/loan/applications
// @desc    Get all loan applications (Corporate only)
// @access  Private
router.get('/applications', auth, requireCorporate, getLoanApplications);

// @route   GET /api/loan/portfolio
// @desc    Corporate portfolio, loans and analytics (Corporate only)
// @access  Private
router.get('/portfolio', auth, requireCorporate, getPortfolio);

// @route   GET /api/loan/leaderboard
// @desc    Corporate lender leaderboard (Corporate only)
// @access  Private
router.get('/leaderboard', auth, requireCorporate, getLeaderboard);

// @route   POST /api/loan/treasury/deposit
// @desc    Add funds to the treasury pool (Corporate only)
// @access  Private
router.post('/treasury/deposit', [
  auth,
  requireCorporate,
  body('amount')
    .isFloat({ min: 1000, max: 1000000000 })
    .withMessage('Deposit amount must be between ₹1,000 and ₹100,00,00,000')
], depositFunds);

// @route   PATCH /api/loan/:id/approve
// @desc    Approve loan application (Corporate only)
// @access  Private
router.patch('/:id/approve', [
  auth,
  requireCorporate,
  body('final_amount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 5000, max: 50000000 })
    .withMessage('Final amount must be between ₹5,000 and ₹5,00,00,000'),
  body('final_interest_rate')
    .optional({ values: 'falsy' })
    .isFloat({ min: 5, max: 25 })
    .withMessage('Interest rate must be between 5% and 25%'),
  body('final_term_months')
    .optional({ values: 'falsy' })
    .isInt({ min: 6, max: 60 })
    .withMessage('Loan term must be between 6 and 60 months')
], approveLoan);

// @route   PATCH /api/loan/:id/reject
// @desc    Reject loan application (Corporate only)
// @access  Private
router.patch('/:id/reject', [
  auth,
  requireCorporate,
  body('rejection_reason')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Rejection reason must be at least 10 characters')
], rejectLoan);

// @route   GET /api/loan/details/:id
// @desc    Get loan details
// @access  Private
router.get('/details/:id', auth, getLoanDetails);

// @route   POST /api/loan/details/:id/repay
// @desc    Make a repayment (SME borrower only)
// @access  Private
router.post('/details/:id/repay', [
  auth,
  requireSME,
  body('amount')
    .optional({ values: 'falsy' })
    .isFloat({ min: 1 })
    .withMessage('Repayment amount must be a positive number')
], repayLoan);

// @route   POST /api/loan/details/:id/messages
// @desc    Send a message on the loan thread
// @access  Private
router.post('/details/:id/messages', [
  auth,
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
], addLoanMessage);

// @route   GET /api/loan/my-loans
// @desc    Get SME's loan applications and active loans
// @access  Private
router.get('/my-loans', auth, requireSME, getMyLoans);

module.exports = router;
