const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: BUSDAddresses } = require('../BUSDAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const pe = (num) => ethers.utils.parseEther(num) // parseEther

  const network = hardhatArguments.network;
  const BUSDAddress = BUSDAddresses[network];

  console.log("With the account:", deployer.address);
  console.log("Top up", BUSDAddress);

  const bUsdContract = await ethers.getContractAt("BUSDToken",BUSDAddress);

  // TODO: add list
  const topUpList = [
    "0x1334e18C74D983692647C7ad029E595B1D9b1699"
  ];

  for (const addr of topUpList) {
    await deployer.sendTransaction({
      to: addr,
      value: ethers.utils.parseEther("0.02") // 0.02 bnb
    })
    // await bUsdContract.transfer(addr,pe("100"))
    console.log("Send BNB to "+addr);
  }

  console.log("Top up success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });