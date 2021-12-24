const { ethers, upgrades, hardhatArguments } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  // const network = hardhatArguments.network;

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  const MysteryBoxNftContract = await ethers.getContractFactory("MysteryBoxNftContract");

  const proxyContract = await MysteryBoxNftContract.deploy();
  console.log("Contract address:", proxyContract.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });