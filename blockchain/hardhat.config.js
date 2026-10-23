require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ALCHEMY_URL, PRIVATE_KEY } = process.env;

const networks = {
  hardhat: {
    chainId: 31337,
  },
};

// Sepolia is only configured when credentials are provided, so compiling
// and running locally works without a .env file.
if (ALCHEMY_URL && PRIVATE_KEY) {
  networks.sepolia = {
    url: ALCHEMY_URL,
    accounts: [PRIVATE_KEY],
  };
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
  networks,
};
