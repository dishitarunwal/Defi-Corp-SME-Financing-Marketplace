const mongoose = require('mongoose');

const loanDetailsSchema = new mongoose.Schema({
  loan_id: {
    type: String,
    required: true,
    unique: true
  },
  application_id: {
    type: String,
    required: true,
    ref: 'LoanApplication'
  },
  sme_id: {
    type: String,
    required: true,
    ref: 'SME'
  },
  corporate_id: {
    type: String,
    required: true,
    ref: 'Corporate'
  },
  principal_amount: {
    type: Number,

  },
  interest_rate: {
    type: Number,

  },
  loan_term_months: {
    type: Number,

  },
  total_repayable: {
    type: Number,

  },
  amount_paid: {
    type: Number,
    default: 0
  },
  amount_remaining: {
    type: Number,

  },
  loan_status: {
    type: String,
    enum: ['active', 'completed', 'overdue', 'defaulted'],
    default: 'active'
  },
  risk_grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },
  collateral_held: {
    type: String,

  },
  monthly_payment: {
    type: Number,
  },
  next_payment_date: {
    type: Date,

  },
  disbursement_date: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  }
});

// Calculate loan details before saving
loanDetailsSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate total repayable amount
    const monthlyRate = this.interest_rate / 100 / 12;
    const numPayments = this.loan_term_months;
    
    // Calculate monthly payment using loan formula
    this.monthly_payment = this.principal_amount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    this.total_repayable = this.monthly_payment * this.loan_term_months;
    this.amount_remaining = this.total_repayable;
    
    // Set next payment date (30 days from disbursement)
    this.next_payment_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Generate loan ID before saving
loanDetailsSchema.pre('save', function(next) {
  if (!this.loan_id) {
    const timestamp = Date.now();
    this.loan_id = `loan_${this.sme_id}_${timestamp}`;
  }
  next();
});

module.exports = mongoose.model('LoanDetails', loanDetailsSchema);