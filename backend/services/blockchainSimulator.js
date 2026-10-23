const crypto = require('crypto');

/**
 * Simulated blockchain layer.
 *
 * The Solidity contracts in /blockchain describe the on-chain design
 * (DefiCorpLendingPool + MockStableToken + MockPriceFeed). Until they are
 * deployed to a live network, this module produces the same kind of records
 * a real deployment would (contract addresses, transaction hashes, block
 * numbers, gas usage) so the rest of the platform can be demonstrated end to end.
 */

const NETWORK = {
  name: process.env.BLOCKCHAIN_NETWORK_NAME || 'DeFiCorp Testnet',
  chain_id: parseInt(process.env.BLOCKCHAIN_CHAIN_ID, 10) || 31337,
  mode: 'simulated',
  currency: 'mINR'
};

// Block height that grows roughly every 12 seconds, like Ethereum
const GENESIS_TIME = Date.UTC(2024, 0, 1);
const GENESIS_BLOCK = 18500000;

const GAS_RANGES = {
  deploy: [1180000, 1420000],
  disbursement: [61000, 72000],
  repayment: [48000, 56000],
  completion: [38000, 44000],
  deposit: [45000, 52000]
};

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const randomBetween = (min, max) => Math.floor(min + Math.random() * (max - min));

const currentBlock = () => GENESIS_BLOCK + Math.floor((Date.now() - GENESIS_TIME) / 12000);

// Deterministic address for an entity (user, pool, token)
const addressFor = (seed) => `0x${sha256(`deficorp:address:${seed}`).slice(0, 40)}`;

const txHash = (seed) => `0x${sha256(`${seed}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`)}`;

const POOL_ADDRESS = addressFor('DefiCorpLendingPool');
const TOKEN_ADDRESS = addressFor('MockStableToken');

const recordTransaction = ({ type, from, to, amount = 0, reference = '' }) => {
  const [minGas, maxGas] = GAS_RANGES[type] || [21000, 30000];
  return {
    type,
    tx_hash: txHash(`${type}:${reference}`),
    block_number: currentBlock(),
    gas_used: randomBetween(minGas, maxGas),
    amount,
    from,
    to,
    status: 'confirmed',
    timestamp: new Date()
  };
};

// "Deploys" a loan agreement contract and returns its on-chain metadata
const deployLoanContract = (loanId) => {
  const deployment = recordTransaction({
    type: 'deploy',
    from: POOL_ADDRESS,
    to: null,
    reference: loanId
  });

  return {
    network: NETWORK.name,
    chain_id: NETWORK.chain_id,
    mode: NETWORK.mode,
    contract_address: addressFor(`loan:${loanId}`),
    pool_address: POOL_ADDRESS,
    token_address: TOKEN_ADDRESS,
    deployment_tx: deployment.tx_hash,
    block_number: deployment.block_number,
    gas_used: deployment.gas_used,
    deployed_at: deployment.timestamp,
    status: 'deployed',
    deployment
  };
};

const walletAddressFor = (userId) => addressFor(`wallet:${userId}`);

module.exports = {
  NETWORK,
  POOL_ADDRESS,
  TOKEN_ADDRESS,
  currentBlock,
  recordTransaction,
  deployLoanContract,
  walletAddressFor
};
