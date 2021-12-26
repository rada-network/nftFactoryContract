const { ethers, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { addresses: boxNftAddresses } = require('../MysteryBoxNftContract/proxyAddresses');
const { addresses: prlNftAddresses } = require('../PrlNftContract/proxyAddresses');

async function main() {
  const fe = (num) => ethers.utils.formatEther(num) // formatEther
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With NftFactoryContract address:", contractAddress);
  const beforeDeploy = fe(await deployer.getBalance());

  const nftFactoryContract = await ethers.getContractAt("NftFactoryContract",contractAddress);

  // Set start time
  await nftFactoryContract.setStartTime(1640451600); // Sunday, December 26, 2021 12:00:00 AM GMT+07:00
  await nftFactoryContract.setEndTime(1640710740); // Tuesday, December 28, 2021 11:59:00 PM GMT+07:00

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

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost spent:", (beforeDeploy-afterDeploy));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });