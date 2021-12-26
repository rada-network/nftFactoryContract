const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { addresses: minterAddresses } = require('../NftFactoryContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];
  const minterAddress = minterAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With PrlNftContract address:", contractAddress);

  const nftContract = await ethers.getContractAt("PrlNftContract",contractAddress);
  await nftContract.setMintFactory(minterAddress);

  console.log("setMintFactory changed");

  const URL_BASE = "https://nft.1alo.com/prl/v1/";
  await nftContract.updateBaseURI(URL_BASE);

  console.log("updateBaseURI changed");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });