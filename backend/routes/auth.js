const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('user_type')
    .isIn(['SME', 'CORPORATE'])
    .withMessage('User type must be either SME or CORPORATE'),
  body('full_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  body('phone_number')
    .trim()
    .matches(/^\+?[0-9][0-9\s-]{6,18}[0-9]$/)
    .withMessage('Please provide a valid phone number'),
  body('company_details')
    .isObject()
    .withMessage('Company details are required')
], signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, getMe);

module.exports = router;