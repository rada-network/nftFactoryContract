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

  // TODO: add real whitelist
  const whitelist = [
    "0x1334e18C74D983692647C7ad029E595B1D9b1699"
  ];

  const campaignId = fu(await nftFactoriesContract.campaignCount()) - 1;

  await nftFactoriesContract.setWhitelist(campaignId, whitelist,true);

  console.log("setWhitelist success");

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost spent:", (beforeDeploy-afterDeploy));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });