const mongoose = require('mongoose');

const corporateSchema = new mongoose.Schema({
  corporate_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  corporation_name: {
    type: String,
    required: true
  },
  registration_number: {
    type: String,
    required: true,
    unique: true
  },
  total_treasury_funds: {
    type: Number,
    required: true,
    default: 0
  },
  allocated_funds: {
    type: Number,
    default: 0
  },
  available_funds: {
    type: Number,
    default: 0
  },
  active_loans_count: {
    type: Number,
    default: 0
  },
  total_disbursed: {
    type: Number,
    default: 0
  },
  total_repaid: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Calculate available funds before saving
corporateSchema.pre('save', function(next) {
  this.available_funds = this.total_treasury_funds - this.allocated_funds;
  next();
});

module.exports = mongoose.model('Corporate', corporateSchema);