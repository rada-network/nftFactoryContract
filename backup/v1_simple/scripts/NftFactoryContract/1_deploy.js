const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: boxAddresses } = require('../MysteryBoxNftContract/proxyAddresses');
const { addresses: ticketAddresses } = require('../PrlNftContract/proxyAddresses');

const { addresses: busdAddresses } = require('../BUSDAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hardhatArguments.network;

  const fe = (num) => ethers.utils.formatEther(num) // formatEther

  console.log("Deploying contracts with the account:", deployer.address);
  const beforeDeploy = fe(await deployer.getBalance());

  const NftFactoryContract = await ethers.getContractFactory("NftFactoryContract");

  const proxyContract = await upgrades.deployProxy(NftFactoryContract, [busdAddresses[network], boxAddresses[network], ticketAddresses[network]], { kind: 'uups' });
  console.log("Contract address:", proxyContract.address);

  const afterDeploy = fe(await deployer.getBalance());
  console.log("Cost deploy:", (beforeDeploy-afterDeploy));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });