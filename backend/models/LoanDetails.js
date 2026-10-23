const mongoose = require('mongoose');
const { uniqueId } = require('../utils/ids');
const { monthlyPaymentFor } = require('../services/riskEngine');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deploy', 'disbursement', 'repayment', 'completion'],
    required: true
  },
  tx_hash: { type: String, required: true },
  block_number: Number,
  gas_used: Number,
  amount: { type: Number, default: 0 },
  from: String,
  to: String,
  status: { type: String, default: 'confirmed' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender_type: {
    type: String,
    enum: ['SME', 'CORPORATE', 'SYSTEM'],
    required: true
  },
  sender_name: String,
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

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
    required: true
  },
  interest_rate: {
    type: Number,
    required: true
  },
  loan_term_months: {
    type: Number,
    required: true
  },
  total_repayable: Number,
  amount_paid: {
    type: Number,
    default: 0
  },
  amount_remaining: Number,
  payments_made: {
    type: Number,
    default: 0
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
  collateral_held: String,
  monthly_payment: Number,
  next_payment_date: Date,
  disbursement_date: {
    type: Date,
    default: Date.now
  },
  blockchain: {
    network: String,
    chain_id: Number,
    mode: String,
    contract_address: String,
    pool_address: String,
    token_address: String,
    deployment_tx: String,
    block_number: Number,
    gas_used: Number,
    deployed_at: Date,
    status: String
  },
  transactions: [transactionSchema],
  messages: [messageSchema],
  created_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date,
    default: null
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// IDs and repayment figures are derived before validation so required checks pass
loanDetailsSchema.pre('validate', function(next) {
  if (!this.loan_id) {
    this.loan_id = uniqueId(`loan_${this.sme_id}`);
  }

  if (this.isNew && this.principal_amount && this.loan_term_months) {
    const payment = monthlyPaymentFor(this.principal_amount, this.interest_rate, this.loan_term_months);
    this.monthly_payment = Math.round(payment * 100) / 100;
    this.total_repayable = Math.round(payment * this.loan_term_months * 100) / 100;
    this.amount_remaining = this.total_repayable - (this.amount_paid || 0);

    if (!this.next_payment_date && this.loan_status !== 'completed') {
      const start = this.disbursement_date || new Date();
      this.next_payment_date = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

loanDetailsSchema.virtual('sme', {
  ref: 'SME',
  localField: 'sme_id',
  foreignField: 'sme_id',
  justOne: true
});

loanDetailsSchema.virtual('corporate', {
  ref: 'Corporate',
  localField: 'corporate_id',
  foreignField: 'corporate_id',
  justOne: true
});

loanDetailsSchema.virtual('application', {
  ref: 'LoanApplication',
  localField: 'application_id',
  foreignField: 'application_id',
  justOne: true
});

module.exports = mongoose.model('LoanDetails', loanDetailsSchema);
