const mongoose = require('mongoose');
const { uniqueId } = require('../utils/ids');

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
  monthly_revenue: {
    type: Number,
    default: null
  },
  business_description: {
    type: String,
    default: null
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
  loan_id: {
    type: String,
    default: null
  },
  submitted_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate application ID before validation (required fields are checked during validation)
loanApplicationSchema.pre('validate', function(next) {
  if (!this.application_id) {
    this.application_id = uniqueId(`app_${this.sme_id}`);
  }
  next();
});

// sme_id / reviewed_by are business IDs (strings), not ObjectIds, so relations use virtuals
loanApplicationSchema.virtual('sme', {
  ref: 'SME',
  localField: 'sme_id',
  foreignField: 'sme_id',
  justOne: true
});

loanApplicationSchema.virtual('reviewer', {
  ref: 'Corporate',
  localField: 'reviewed_by',
  foreignField: 'corporate_id',
  justOne: true
});

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
