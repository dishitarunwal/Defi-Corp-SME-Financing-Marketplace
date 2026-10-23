// Rule-based credit scoring used for SME profiles and loan applications

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const SECTOR_ESG = {
  'Renewable Energy': 92,
  'Agriculture & Technology': 84,
  Healthcare: 82,
  Technology: 76,
  Services: 74,
  'Food & Beverage': 72,
  Retail: 70,
  Finance: 70,
  'Real Estate': 66,
  Transportation: 64,
  Construction: 62,
  Manufacturing: 63
};

const RATE_BY_GRADE = { A: 8.5, B: 10.0, C: 12.5, D: 15.0 };

// Initial scores for a newly registered SME
const scoreSMEProfile = ({ year_established, annual_revenue = 0, employee_count = 0, industry_sector }) => {
  const years = Math.max(0, new Date().getFullYear() - (year_established || new Date().getFullYear()));

  let revenueScore = 2;
  if (annual_revenue >= 50000000) revenueScore = 15;
  else if (annual_revenue >= 10000000) revenueScore = 10;
  else if (annual_revenue >= 2500000) revenueScore = 6;

  let employeeScore = 1;
  if (employee_count >= 100) employeeScore = 8;
  else if (employee_count >= 25) employeeScore = 5;
  else if (employee_count >= 5) employeeScore = 3;

  const credit_score = Math.round(clamp(45 + Math.min(years, 20) * 1.2 + revenueScore + employeeScore, 40, 96));
  const esg_score = SECTOR_ESG[industry_sector] || 70;
  const trust_score = Math.round((credit_score + esg_score) / 2);

  return { credit_score, esg_score, trust_score };
};

// Risk grade + rate for a specific loan request
const assessApplication = (sme, { requested_amount, collateral_value = 0 }) => {
  let points = (sme.credit_score || 0) * 0.7 + (sme.esg_score || 0) * 0.3;

  const coverage = requested_amount > 0 ? collateral_value / requested_amount : 0;
  if (coverage >= 1.2) points += 5;
  else if (coverage >= 0.8) points += 2;
  else if (coverage < 0.5) points -= 8;

  if (sme.annual_revenue > 0) {
    const leverage = requested_amount / sme.annual_revenue;
    if (leverage > 0.5) points -= 10;
    else if (leverage < 0.2) points += 3;
  }

  let risk_grade = 'D';
  if (points >= 88) risk_grade = 'A';
  else if (points >= 80) risk_grade = 'B';
  else if (points >= 70) risk_grade = 'C';

  return {
    risk_grade,
    proposed_interest_rate: RATE_BY_GRADE[risk_grade],
    risk_points: Math.round(points),
    collateral_coverage: Math.round(coverage * 100) / 100
  };
};

const monthlyPaymentFor = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  if (!monthlyRate) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

module.exports = { scoreSMEProfile, assessApplication, monthlyPaymentFor, RATE_BY_GRADE };
