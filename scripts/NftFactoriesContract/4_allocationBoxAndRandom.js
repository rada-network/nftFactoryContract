const { ethers, hardhatArguments } = require('hardhat');
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

  // TODO: Create first campaign with index 0
  const campaignId = 0;
  // Mint 100 Boxes
  var boxes = []
  for (var i = 10001; i <= 10100; i++) {
    boxes.push(i)
  }

  // Set Boxes for sell
  await nftFactoriesContract.setAllocationNFT(campaignId, boxes, true);
  console.log("Set Box NFT success");

  // Mint 100 PRL NFT
  var nfts = [];
  for (var i = 10101; i <= 10200; i++) {
    nfts.push(i);
  }

  // Set random NFT for open Box
  const shuffledArr = array => array.sort(() => 0.5 - Math.random());
  var randomNFTs = shuffledArr(nfts);
  await nftFactoriesContract.setAllocationNFT(campaignId, randomNFTs, false);
  console.log("Set Random NFT success");

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost spent:", (beforeDeploy-afterDeploy));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });