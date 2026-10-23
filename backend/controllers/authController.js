const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const SME = require('../models/SME');
const Corporate = require('../models/Corporate');
const { uniqueId } = require('../utils/ids');
const { scoreSMEProfile } = require('../services/riskEngine');
const { walletAddressFor } = require('../services/blockchainSimulator');

// Generate JWT Token
const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return NaN;
  return Number(value);
};

const serializeUser = (user) => ({
  user_id: user.user_id,
  email: user.email,
  user_type: user.user_type,
  full_name: user.full_name,
  phone_number: user.phone_number,
  is_verified: user.is_verified,
  wallet_address: walletAddressFor(user.user_id)
});

const getProfile = (user) => {
  if (user.user_type === 'SME') return SME.findOne({ user_id: user.user_id });
  if (user.user_type === 'CORPORATE') return Corporate.findOne({ user_id: user.user_id });
  return null;
};

// Returns a list of human-readable problems with the company details, or [] if valid
const validateCompanyDetails = (user_type, details = {}) => {
  const problems = [];
  const currentYear = new Date().getFullYear();

  if (!details.registration_number || !String(details.registration_number).trim()) {
    problems.push('Registration number is required');
  }

  if (user_type === 'SME') {
    if (!details.company_name || !String(details.company_name).trim()) problems.push('Company name is required');
    if (!details.industry_sector) problems.push('Industry sector is required');
    const year = toNumber(details.year_established);
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) problems.push('Year established must be between 1900 and the current year');
    if (!(toNumber(details.annual_revenue) >= 0)) problems.push('Annual revenue must be a positive number');
    if (!(toNumber(details.employee_count) >= 1)) problems.push('Employee count must be at least 1');
    if (!details.city || !String(details.city).trim()) problems.push('City is required');
    if (!details.state || !String(details.state).trim()) problems.push('State is required');
  } else {
    const name = details.corporation_name || details.company_name;
    if (!name || !String(name).trim()) problems.push('Corporation name is required');
    if (!(toNumber(details.total_treasury_funds) >= 0)) problems.push('Total treasury funds must be a positive number');
  }

  return problems;
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  let createdUser = null;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password, user_type, full_name, phone_number, company_details = {} } = req.body;

    const problems = validateCompanyDetails(user_type, company_details);
    if (problems.length > 0) {
      return res.status(400).json({
        success: false,
        message: problems[0],
        errors: problems.map((msg) => ({ msg }))
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account already exists with this email'
      });
    }

    const registration_number = String(company_details.registration_number).trim();
    const ProfileModel = user_type === 'SME' ? SME : Corporate;
    if (await ProfileModel.findOne({ registration_number })) {
      return res.status(400).json({
        success: false,
        message: 'A company with this registration number is already registered'
      });
    }

    // Create user
    const user_id = uniqueId(user_type === 'SME' ? 'usr_sme' : 'usr_corp');
    createdUser = new User({
      user_id,
      email,
      password_hash: password, // Will be hashed by pre-save middleware
      user_type,
      full_name,
      phone_number,
      is_verified: true // Auto-verify for demo
    });

    await createdUser.save();

    // Create SME or Corporate profile based on user type
    if (user_type === 'SME') {
      const profile = {
        year_established: toNumber(company_details.year_established),
        annual_revenue: toNumber(company_details.annual_revenue),
        employee_count: toNumber(company_details.employee_count),
        industry_sector: company_details.industry_sector
      };

      await SME.create({
        sme_id: uniqueId('sme'),
        user_id,
        company_name: String(company_details.company_name).trim(),
        registration_number,
        address: company_details.address,
        city: company_details.city,
        state: company_details.state,
        country: company_details.country || 'India',
        website_url: company_details.website_url,
        ...profile,
        ...scoreSMEProfile(profile)
      });
    } else {
      const treasury = toNumber(company_details.total_treasury_funds);
      await Corporate.create({
        corporate_id: uniqueId('corp'),
        user_id,
        corporation_name: String(company_details.corporation_name || company_details.company_name).trim(),
        registration_number,
        total_treasury_funds: treasury,
        allocated_funds: 0,
        available_funds: treasury
      });
    }

    const token = generateToken(user_id);
    const profile = await getProfile(createdUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: serializeUser(createdUser),
        profile,
        token,
        redirect_to: user_type === 'SME' ? '/SMEDashboard' : '/CorporateDashboard'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);

    // Don't leave a user without a profile behind if the profile step failed
    if (createdUser) {
      await User.deleteOne({ user_id: createdUser.user_id }).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with these details already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.user_id);
    const profile = await getProfile(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        profile,
        token,
        redirect_to: user.user_type === 'SME' ? '/SMEDashboard' : '/CorporateDashboard'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;
    const profile = await getProfile(user);

    res.json({
      success: true,
      data: {
        user: serializeUser(user),
        profile
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  signup,
  login,
  getMe
};
