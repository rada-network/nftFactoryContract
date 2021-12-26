const {
  ethers,
  upgrades,
  hardhatArguments
} = require('hardhat');
const {
  addresses: contractAddresses
} = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("With NftFactoryContract address:", contractAddress);

  const nftFactoryContract = await ethers.getContractAt("NftFactoryContract", contractAddress);

  // Set start time
  await nftFactoryContract.setStartTime(1640451600); // Sunday, December 26, 2021 12:00:00 AM GMT+07:00
  console.log("setStartTime success");

  await nftFactoryContract.setEndTime(1640710740); // Tuesday, December 28, 2021 11:59:00 PM GMT+07:00
  console.log("setEndTime success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });