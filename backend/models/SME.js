const mongoose = require('mongoose');

const smeSchema = new mongoose.Schema({
  sme_id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  company_name: {
    type: String,
    required: true
  },
  registration_number: {
    type: String,
    required: true,
    unique: true
  },
  industry_sector: {
    type: String,
    required: true
  },
  year_established: {
    type: Number,
    required: true
  },
  annual_revenue: {
    type: Number,
    required: true
  },
  employee_count: {
    type: Number,
    required: true
  },
  credit_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  esg_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  trust_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  address: {
    type: String,
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'India'
  },
  website_url: {
    type: String
  },
  documents_verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SME', smeSchema);