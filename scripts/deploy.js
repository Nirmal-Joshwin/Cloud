const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting ExamVault deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const ExamVault = await hre.ethers.getContractFactory("ExamVault");
  const examVault = await ExamVault.deploy();
  await examVault.waitForDeployment();

  const contractAddress = await examVault.getAddress();
  console.log("ExamVault successfully deployed to:", contractAddress);

  // Save the address and artifact to frontend directory
  const contractsDir = path.join(__dirname, "..", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  // Write address json
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ ExamVault: contractAddress }, null, 2)
  );

  // Write contract artifact (ABI)
  const ExamVaultArtifact = await hre.artifacts.readArtifact("ExamVault");
  fs.writeFileSync(
    path.join(contractsDir, "ExamVault.json"),
    JSON.stringify(ExamVaultArtifact, null, 2)
  );

  console.log("Contract address and ABI exported to src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

