const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { pe,fe,fu,pu } = require('../utils');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With NftFactoriesContract address:", contractAddress);
  const beforeDeploy = fe(await deployer.getBalance());

  const nftFactoriesContract = await ethers.getContractAt("NftFactoriesContract",contractAddress);

  // TODO: Fill your campaignId
  const campaignId = 0;
  const startTime = 1640451600; // Sunday, December 26, 2021 12:00:00 AM GMT+07:00
  const endTime = 1640710740; // Tuesday, December 28, 2021 11:59:00 PM GMT+07:00
  const locked = false;
  const priceBox = pe("100");
  const maxBuyBoxPerAddress = 1;
  const requireWhitelist = true;

  await nftFactoriesContract.updateCampaign(campaignId, startTime, endTime, locked, priceBox, maxBuyBoxPerAddress, requireWhitelist);

  console.log("updateCampaign success");

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost spent:", (beforeDeploy-afterDeploy));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });