const test = require('node:test');
const assert = require('node:assert');
const { scoreSMEProfile, assessApplication, monthlyPaymentFor } = require('../services/riskEngine');
const chain = require('../services/blockchainSimulator');

test('established, high-revenue SMEs score higher than new ones', () => {
  const mature = scoreSMEProfile({ year_established: 2008, annual_revenue: 60000000, employee_count: 150, industry_sector: 'Healthcare' });
  const startup = scoreSMEProfile({ year_established: new Date().getFullYear(), annual_revenue: 500000, employee_count: 2, industry_sector: 'Retail' });
  assert.ok(mature.credit_score > startup.credit_score);
  assert.ok(mature.credit_score <= 96 && startup.credit_score >= 40);
});

test('collateral coverage and leverage move the risk grade', () => {
  const sme = { credit_score: 80, esg_score: 80, annual_revenue: 20000000 };
  const safe = assessApplication(sme, { requested_amount: 1000000, collateral_value: 1500000 });
  const risky = assessApplication(sme, { requested_amount: 15000000, collateral_value: 1000000 });
  assert.ok(safe.risk_grade < risky.risk_grade, `${safe.risk_grade} should be better than ${risky.risk_grade}`);
  assert.ok(safe.proposed_interest_rate < risky.proposed_interest_rate);
});

test('monthly payment matches the standard amortisation formula', () => {
  assert.strictEqual(Math.round(monthlyPaymentFor(100000, 12, 12)), 8885);
  assert.strictEqual(monthlyPaymentFor(12000, 0, 12), 1000);
});

test('simulated contracts and transactions look like chain records', () => {
  const contract = chain.deployLoanContract('loan_test');
  assert.match(contract.contract_address, /^0x[0-9a-f]{40}$/);
  assert.match(contract.deployment_tx, /^0x[0-9a-f]{64}$/);
  assert.ok(contract.block_number > 18500000);

  const tx = chain.recordTransaction({ type: 'repayment', from: '0x1', to: '0x2', amount: 500 });
  assert.strictEqual(tx.status, 'confirmed');
  assert.ok(tx.gas_used >= 48000 && tx.gas_used < 56000);
  assert.strictEqual(chain.walletAddressFor('usr_1'), chain.walletAddressFor('usr_1'));
});
