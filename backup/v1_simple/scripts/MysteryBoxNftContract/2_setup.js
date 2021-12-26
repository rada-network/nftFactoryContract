const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { addresses: factoryAddresses } = require('../NftFactoryContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];
  const factoryAddress = factoryAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With MysteryBoxNftContract address:", contractAddress);

  const nftContract = await ethers.getContractAt("MysteryBoxNftContract",contractAddress);
  await nftContract.setMintFactory(factoryAddress);

  console.log("setMintFactory changed");

  const URL_BASE = "https://nft.1alo.com/box/v1/";
  await nftContract.updateBaseURI(URL_BASE);

  console.log("updateBaseURI changed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });