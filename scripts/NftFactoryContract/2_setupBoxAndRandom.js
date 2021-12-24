const { ethers, hardhatArguments } = require('hardhat');
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

  // Mint 100 Boxes
  var boxes = []
  for(var i=1001;i<=1100;i++) {
    boxes.push(i)
  }
  // await nftFactoryContract.mintToContract(boxNftAddresses[network], boxes);
  console.log("Generate ID Boxes success");
  // Set Boxes for sell
  await nftFactoryContract.setBoxesForSell(boxes);

  // Mint 100 PRL NFT
  var nfts = [];
  for(var i=100001;i<=100100;i++) {
    nfts.push(i);
  }
  // await nftFactoryContract.mintToContract(prlNftAddresses[network], nfts);
  console.log("Generate ID NFTs success");
  // Set random NFT for open Box
  const shuffledArr = array => array.sort(() => 0.5 - Math.random());
  var randomNFTs = shuffledArr(nfts);

  // If any box opened, please do not update this randomNFT
  await nftFactoryContract.setRandomNFT(randomNFTs);
  console.log("Set Random NFT success");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });