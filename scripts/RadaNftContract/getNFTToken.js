const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: contractAddresses } = require('./proxyAddresses');
const { pe,fe,fu,pu } = require('../utils');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const contractAddress = contractAddresses[network];

  console.log("With the account:", deployer.address);

  const nftContract = await ethers.getContractAt("RadaNftContract",contractAddress);

  // TODO: add list
  const topUpList = [
  ];

  var prize = '';
  for (const addr of topUpList) {
    const totalNFT = fu(await nftContract.balanceOf(addr));
    if (totalNFT>=2) {
      const tokenId = fu(await nftContract.tokenOfOwnerByIndex(addr,1));
      if (tokenId>=10101 && tokenId<=10110)
        prize = 'Diamond';
      else if (tokenId>=10111 && tokenId<=10190)
        prize = 'Gold';
      else if (tokenId>=10191 && tokenId<=10200)
        prize = 'Jackpot';
      console.log(tokenId+' | '+prize);
    } else if (totalNFT>=1) {
      console.log(addr + " not open box");
    } else console.log(addr + " not buy box");
  }

  console.log("Top up success");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });