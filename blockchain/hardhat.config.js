require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ALCHEMY_URL, PRIVATE_KEY } = process.env;

if (!ALCHEMY_URL || !PRIVATE_KEY) {
  console.error("❌ Missing ALCHEMY_URL or PRIVATE_KEY in .env");
  process.exit(1);
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: ALCHEMY_URL,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      chainId: 1337,
    },
  },
};