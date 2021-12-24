const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { addresses: boxNftAddresses } = require('../MysteryBoxNftContract/proxyAddresses');
const { addresses: prlNftAddresses } = require('../PrlNftContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With NftFactoryContract address:", contractAddress);

  const nftFactoryContract = await ethers.getContractAt("NftFactoryContract",contractAddress);

  console.log("set nftsAddress success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });