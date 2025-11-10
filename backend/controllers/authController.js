const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const SME = require('../models/SME');
const Corporate = require('../models/Corporate');

// Generate JWT Token
const generateToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate unique IDs
const generateUserId = (userType) => {
  const timestamp = Date.now();
  const prefix = userType === 'SME' ? 'sme' : 'corp';
  return `usr_${prefix}_${timestamp}`;
};

const generateSMEId = () => {
  const timestamp = Date.now();
  return `sme_${timestamp}`;
};

const generateCorporateId = () => {
  const timestamp = Date.now();
  return `corp_${timestamp}`;
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, user_type, full_name, phone_number, company_details } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user_id = generateUserId(user_type);
    const user = new User({
      user_id,
      email,
      password_hash: password, // Will be hashed by pre-save middleware
      user_type,
      full_name,
      phone_number,
      is_verified: true // Auto-verify for demo
    });

    await user.save();

    // Create SME or Corporate profile based on user type
    if (user_type === 'SME') {
      const sme = new SME({
        sme_id: generateSMEId(),
        user_id,
        company_name: company_details.company_name,
        registration_number: company_details.registration_number,
        industry_sector: company_details.industry_sector,
        year_established: company_details.year_established,
        annual_revenue: company_details.annual_revenue,
        employee_count: company_details.employee_count,
        address: company_details.address,
        city: company_details.city,
        state: company_details.state,
        country: company_details.country || 'India',
        website_url: company_details.website_url,
        credit_score: 75, // Default score
        esg_score: 70,
        trust_score: 72
      });
      await sme.save();
    } else if (user_type === 'CORPORATE') {
      const corporate = new Corporate({
        corporate_id: generateCorporateId(),
        user_id,
        corporation_name: company_details.corporation_name,
        registration_number: company_details.registration_number,
        total_treasury_funds: company_details.total_treasury_funds || 0,
        allocated_funds: 0,
        available_funds: company_details.total_treasury_funds || 0
      });
      await corporate.save();
    }

    // Generate token
    const token = generateToken(user_id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          user_type: user.user_type,
          full_name: user.full_name
        },
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
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
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          user_type: user.user_type,
          full_name: user.full_name
        },
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
    
    // Get additional profile data based on user type
    let profileData = null;
    if (user.user_type === 'SME') {
      profileData = await SME.findOne({ user_id: user.user_id });
    } else if (user.user_type === 'CORPORATE') {
      profileData = await Corporate.findOne({ user_id: user.user_id });
    }

    res.json({
      success: true,
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          user_type: user.user_type,
          full_name: user.full_name,
          phone_number: user.phone_number,
          is_verified: user.is_verified
        },
        profile: profileData
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