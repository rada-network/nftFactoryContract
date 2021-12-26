const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With NftFactoryContract address:", contractAddress);

  const nftFactoryContract = await ethers.getContractAt("NftFactoryContract",contractAddress);

  // TODO:
  const whitelist = [
    "0xAE51701F3eB7b897eB6EE5ecdf35c4fEE29BFAe6", // Quang
    "0x16DA4c7B28dc30BCE9e2B384E17a7b0078Fb97AE", // Quang
    "0x300298961D74311c643B7956d1c01f0E1a3668aa", // Quang
    "0xF5F7972B78DBaa99d3b24Df51ed5C2ca71d1E1cF", // Quang
    "0x24607dEF8E035584d6B174A9FA969d9e2C5890d2", // Quang
    "0xE8AE51B507CeB672712E99588a8b3Aa991A05420", // Lu Nguyen
    "0x575B0e1F8739A09c1C4C014212fB40A9393ffB32", // anh Khanh Le
    "0xA8f68bB8d525f5874df9202c63C1f02eeC3dFE1f", // Tan
    "0xd21400d5EE27DfF4B058ff4b7176599d4038466b", // Alex
    "0x3e11F3295b0af76C3AFAF545206b3d65F85eA82b",
    "0x1334e18C74D983692647C7ad029E595B1D9b1699",
    "0x36Ab1192Ac6532aE1D4A691cC1D361372276cA4f",
    "0xd21400d5EE27DfF4B058ff4b7176599d4038466b",
    "0x58E78124fe7cc061E1A9c05118379E72f0ed0621",
    "0x82a0c5334F177649C48f1cC04245F57f4540148E",
    "0xbc1c3cC9C8ca7B2AB5252CF47566a5FA51893F42",
    "0x567f7A998Ea079619a7948dAad06416b5F4e166f",
    "0xf17C51A31F74517B94Fb4F3ceE932338bc0dC11D",
    "0xC8F7D67c47B2f6a53a514aC18bE2ff32Fb184150",
    "0xF5e2BE3Cc5d32Fa1C53274C6e3bA266964097e17",
    "0x1861233D1Ab84dD59F8ce798BDEe7B164117e8f2",
    "0xa97F7521D6A1Cf4dB598e3Adc28588edafb2b97B",
    "0x8B62DC632A1793F65adeDc38f4531F403a038d66"
  ];

  await nftFactoryContract.setWhitelist(whitelist,true);

  console.log("setWhitelist success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });