require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const alchemyUrl = process.env.ALCHEMY_URL;
  const privateKey = process.env.PRIVATE_KEY;

  console.log("🔹 Loaded Alchemy URL:", alchemyUrl ? "OK" : "❌ Missing");
  console.log("🔹 Loaded Private Key:", privateKey ? "OK" : "❌ Missing");

  if (!alchemyUrl || !privateKey) {
    console.log("⚠️ Missing .env values. Please check your .env file.");
    return;
  }

  try {
    const provider = new hre.ethers.JsonRpcProvider(alchemyUrl);
    const wallet = new hre.ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    console.log("\n✅ Deployer address:", wallet.address);
    console.log("💰 Sepolia ETH balance:", hre.ethers.formatEther(balance), "ETH\n");
  } catch (error) {
    console.error("❌ Error connecting to network:", error);
  }
}

main();