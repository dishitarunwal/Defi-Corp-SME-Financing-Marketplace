const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);

  // Log deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");

  // 1️⃣ Deploy MockStableToken
  const MockStable = await ethers.getContractFactory("MockStableToken");
  const stable = await MockStable.deploy(
    "MockUSD",
    "mUSD",
    ethers.parseEther("1000000")
  );
  await stable.waitForDeployment();
  const stableAddr = await stable.getAddress();
  console.log("✅ MockStableToken deployed at:", stableAddr);

  // 2️⃣ Deploy MockPriceFeed
  const MockFeed = await ethers.getContractFactory("MockPriceFeed");
  const priceDecimals = 8;
  const initialPrice = 2000n * 10n ** BigInt(priceDecimals);
  const feed = await MockFeed.deploy(initialPrice, priceDecimals);
  await feed.waitForDeployment();
  const feedAddr = await feed.getAddress();
  console.log("✅ MockPriceFeed deployed at:", feedAddr);

  // 3️⃣ Deploy DefiCorpLendingPool
  const Pool = await ethers.getContractFactory("DefiCorpLendingPool");
  const pool = await Pool.deploy(stableAddr, feedAddr);
  await pool.waitForDeployment();
  const poolAddr = await pool.getAddress();
  console.log("✅ DefiCorpLendingPool deployed at:", poolAddr);

  // 4️⃣ Fund the pool
  const fundAmount = ethers.parseUnits("50000", 18);
  const tx = await stable.transfer(poolAddr, fundAmount);
  await tx.wait();
  console.log("💸 Funded pool with:", fundAmount.toString(), "mUSD");

  console.log("\n🎯 All contracts deployed successfully!");
  console.log("📦 Addresses:");
  console.log("MockStableToken:", stableAddr);
  console.log("MockPriceFeed:", feedAddr);
  console.log("DefiCorpLendingPool:", poolAddr);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});