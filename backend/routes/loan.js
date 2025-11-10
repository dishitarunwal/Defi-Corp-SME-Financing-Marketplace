const express = require('express');
const { body } = require('express-validator');
const {
  applyForLoan,
  getLoanApplications,
  approveLoan,
  rejectLoan,
  getLoanDetails,
  getMyLoans
} = require('../controllers/loanController');
const { auth, requireSME, requireCorporate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/loan/apply
// @desc    Submit loan application (SME only)
// @access  Private
router.post('/apply', [
  auth,
  requireSME,
  body('requested_amount')
    .isNumeric()
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
    .isNumeric()
    .isFloat({ min: 1000 })
    .withMessage('Collateral value must be at least ₹1,000')
], applyForLoan);

// @route   GET /api/loan/applications
// @desc    Get all loan applications (Corporate only)
// @access  Private
router.get('/applications', auth, requireCorporate, getLoanApplications);

// @route   PATCH /api/loan/:id/approve
// @desc    Approve loan application (Corporate only)
// @access  Private
router.patch('/:id/approve', [
  auth,
  requireCorporate,
  body('final_amount')
    .optional()
    .isNumeric()
    .isFloat({ min: 5000, max: 50000000 })
    .withMessage('Final amount must be between ₹5,000 and ₹5,00,00,000'),
  body('final_interest_rate')
    .optional()
    .isNumeric()
    .isFloat({ min: 5, max: 25 })
    .withMessage('Interest rate must be between 5% and 25%'),
  body('final_term_months')
    .optional()
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

// @route   GET /api/loan/my-loans
// @desc    Get SME's loan applications and active loans
// @access  Private
router.get('/my-loans', auth, requireSME, getMyLoans);

module.exports = router;