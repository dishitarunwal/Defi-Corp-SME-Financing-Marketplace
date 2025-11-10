const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema({
  application_id: {
    type: String,
    required: true,
    unique: true
  },
  sme_id: {
    type: String,
    required: true,
    ref: 'SME'
  },
  requested_amount: {
    type: Number,
    required: true,
    min: 5000,
    max: 50000000
  },
  loan_purpose: {
    type: String,
    required: true,
    minlength: 50
  },
  loan_term_months: {
    type: Number,
    required: true,
    min: 6,
    max: 60
  },
  proposed_interest_rate: {
    type: Number,
    required: true
  },
  collateral_description: {
    type: String,
    required: true
  },
  collateral_value: {
    type: Number,
    required: true
  },
  risk_grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    default: 'C'
  },
  application_status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  rejection_reason: {
    type: String,
    default: null
  },
  reviewed_by: {
    type: String,
    ref: 'Corporate',
    default: null
  },
  reviewed_at: {
    type: Date,
    default: null
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
});

// Generate application ID before saving
loanApplicationSchema.pre('save', function(next) {
  if (!this.application_id) {
    const timestamp = Date.now();
    this.application_id = `app_${this.sme_id}_${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);