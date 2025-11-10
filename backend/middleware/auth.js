const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ user_id: decoded.user_id });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check if user is SME
const requireSME = (req, res, next) => {
  if (req.user.user_type !== 'SME') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. SME role required.'
    });
  }
  next();
};

// Middleware to check if user is Corporate
const requireCorporate = (req, res, next) => {
  if (req.user.user_type !== 'CORPORATE') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Corporate role required.'
    });
  }
  next();
};

module.exports = { auth, requireSME, requireCorporate };