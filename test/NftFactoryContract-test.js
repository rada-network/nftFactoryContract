// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

describe("NFT Contract", function () {

  let contractNftFactory;
  let contractMysteryBoxNFT;
  let contractPrlNft;
  let bUSDToken;
  let saltNonce = Math.floor(Math.random() * 9999999) + 1000000;;
  const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
  const URL_BASE_BOX = "https://nft.1alo.com/v1/hero/";
  const URL_BASE_PRL = "https://nft.1alo.com/v1/prl/";

  // Utils
  const pe = (num) => ethers.utils.parseEther(num) // parseEther
  const fe = (num) => ethers.utils.formatEther(num) // formatEther
  const pu = (num, decimals=0) => ethers.utils.parseUnits(num, decimals) // parseUnits
  const fu = (num, decimals=0) => ethers.utils.formatUnits(num, decimals) // formatEther

  beforeEach(async function () {

    [owner, approvalUser, minterUser, withdrawUser, buyerUser, buyerUser2, ...addrs] = await ethers.getSigners();

    const MysteryBoxNftContract = await ethers.getContractFactory("MysteryBoxNftContract");
    contractMysteryBoxNFT = await MysteryBoxNftContract.deploy();
    const PrlNftContract = await ethers.getContractFactory("PrlNftContract");
    contractPrlNft = await PrlNftContract.deploy();

    const BUSDToken = await ethers.getContractFactory("BUSDToken");
    bUSDToken = await BUSDToken.deploy();

    // Get the ContractFactory
    const NftFactoryContract = await ethers.getContractFactory("NftFactoryContract");
    contractNftFactory = await upgrades.deployProxy(NftFactoryContract, [bUSDToken.address, contractMysteryBoxNFT.address, contractPrlNft.address], { kind: 'uups' });

    /* NFT */
    // Set updateBaseURI
    await contractMysteryBoxNFT.updateBaseURI(URL_BASE_BOX);
    await contractPrlNft.updateBaseURI(URL_BASE_PRL);

    // Set approval
    await contractMysteryBoxNFT.addApprovalWhitelist(approvalUser.address);

    // Set minterFactory for NFT
    await contractMysteryBoxNFT.setMintFactory(contractNftFactory.address);
    await contractPrlNft.setMintFactory(contractNftFactory.address);

    /* NftFactoryContract */
    // Set minter
    await contractNftFactory.setAdmin(minterUser.address, true);

    // Mint 100 Boxes
    var boxes = []
    for(var i=1001;i<=1100;i++) {
      boxes.push(i)
    }
    // await contractNftFactory.mintToContract(contractMysteryBoxNFT.address, boxes);

    // Set Boxes for sell
    await contractNftFactory.setBoxesForSell(boxes);

    // Mint 100 PRL NFT
    var nfts = [];
    for(var i=100001;i<=100100;i++) {
      nfts.push(i);
    }
    // await contractNftFactory.mintToContract(contractPrlNft.address, nfts);

    // Set random NFT for open Box
    const shuffledArr = array => array.sort(() => 0.5 - Math.random());
    var randomNFTs = shuffledArr(nfts);
    await contractNftFactory.setRandomNFT(randomNFTs);

  });

  it('Deploy v1 and should set right minterFactory address, right minter address', async function () {
    expect(await contractMysteryBoxNFT.hasRole(MINTER_ROLE, contractNftFactory.address)).to.equal(true);
    expect(await contractPrlNft.hasRole(MINTER_ROLE, contractNftFactory.address)).to.equal(true);
    expect(await contractNftFactory.admins(minterUser.address)).to.equal(true);
  });


  /* it('Should contractMysteryBoxNFT got an NFTs', async function () {
    // Owner
    expect(await contractMysteryBoxNFT.ownerOf(1005)).to.equal(contractNftFactory.address);
  }); */

  /* it('Should lock an NFT', async function () {
    const tokenId = 1006;

    await contractMysteryBoxNFT.connect(approvalUser).lock(tokenId);
    expect(await contractMysteryBoxNFT.lockedTokens(tokenId)).to.equal(true);
    await expect(contractMysteryBoxNFT["safeTransferFrom(address,address,uint256)"](contractNftFactory.address, buyerUser.address, tokenId)).to.be.reverted;

  }); */
  it('Should the owner set withdraw address and can withdraw all funds', async function () {

    // Admin top up payable token to contract
    await bUSDToken.transfer(contractNftFactory.address, pe("2000"));
    const balanceFund = await bUSDToken.balanceOf(contractNftFactory.address);

    // Set withdraw address
    await contractNftFactory.setWithdrawAddress(withdrawUser.address);

    // Withdraw
    await contractNftFactory.withdrawAllFund(bUSDToken.address);
    expect(await bUSDToken.balanceOf(withdrawUser.address)).to.equal(balanceFund.toString());

  });

  /* it('Should the owner set withdraw address and can withdraw NFTs', async function () {
    const tokenIds = [1006,1007,1008];

    // Set withdraw address
    await contractNftFactory.setWithdrawAddress(withdrawUser.address);

    // Withdraw
    await contractNftFactory.withdrawNft(contractMysteryBoxNFT.address, tokenIds);

    // Check
    for (var i=0;i<tokenIds.length;i++) {
      expect(await contractMysteryBoxNFT.ownerOf(tokenIds[i])).to.equal(withdrawUser.address);
    }
  }); */

  it('Should buy Box successfully - whitelist', async function () {
    // Set white list
    await contractNftFactory.setWhitelist([buyerUser.address],true);

    // Set limit buy
    await contractNftFactory.setMaxBuyPerAddress(2);
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactory.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("50"));

    // Should reverted because not enough BUSD
    await expect(contractNftFactory.connect(buyerUser).buyBox(saltNonce)).to.be.reverted;

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("150"));

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);


    expect(await bUSDToken.balanceOf(buyerUser.address)).to.equal(pe("0"));
    expect(await contractMysteryBoxNFT.tokenOfOwnerByIndex(buyerUser.address, 0)).to.equal(pu("1001"));
    expect(await contractMysteryBoxNFT.tokenOfOwnerByIndex(buyerUser.address, 1)).to.equal(pu("1002"));
  });

  it('Should revert buy Box if not in white list - whitelist', async function () {

    // Not in white list should revert
    await bUSDToken.transfer(buyerUser2.address, pe("100"));
    await bUSDToken.connect(buyerUser2).approve(contractNftFactory.address, pe("100"));
    await expect(contractNftFactory.connect(buyerUser2).buyBox(saltNonce)).to.be.reverted;

  });


  it('Should buy Box successfully - public', async function () {
    // Set white list
    await contractNftFactory.setRequireWhitelist(false);

    // Set limit buy
    await contractNftFactory.setMaxBuyPerAddress(2);
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactory.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("200"));

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await expect(contractNftFactory.connect(buyerUser).buyBox(saltNonce)).to.be.reverted;


    expect(await bUSDToken.balanceOf(buyerUser.address)).to.equal(pe("0"));
    expect(await contractMysteryBoxNFT.tokenOfOwnerByIndex(buyerUser.address, 0)).to.equal(pu("1001"));
    expect(await contractMysteryBoxNFT.tokenOfOwnerByIndex(buyerUser.address, 1)).to.equal(pu("1002"));
  });

  it('Should buy Box successfully and reverted over max buy allow - whitelist', async function () {
    // Set white list
    await contractNftFactory.setWhitelist([buyerUser.address],true);

    // Set limit buy
    // await contractNftFactory.setMaxBuyPerAddress(1); // 1 is default
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactory.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("200"));
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Should reverted
    await expect(contractNftFactory.connect(buyerUser).buyBox(saltNonce)).to.be.reverted;
  });

  it('Should buy all Boxes successfully and sold out - whitelist', async function () {
    // Set white list
    await contractNftFactory.setWhitelist([buyerUser.address],true);
    // Set limit buy
    await contractNftFactory.setMaxBuyPerAddress(1000);

    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactory.address, pe("11000"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("11000"));

    for(var i=1001;i<=1100;i++) {
      // Buy box
      saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
      await contractNftFactory.connect(buyerUser).buyBox(saltNonce)
    }

    // Should reverted
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await expect(contractNftFactory.connect(buyerUser).buyBox(saltNonce)).to.be.reverted;
    expect(await contractMysteryBoxNFT.balanceOf(buyerUser.address)).to.equal(pu("100"));
  });

  it('Should buy Box and open box successfully - whitelist', async function () {
    // Set white list
    await contractNftFactory.setWhitelist([buyerUser.address],true);

    // Approve & top up BUSD
    await bUSDToken.connect(buyerUser).approve(contractNftFactory.address, pe("100"));
    await bUSDToken.transfer(buyerUser.address, pe("100"));

    // Buy box
    await contractNftFactory.connect(buyerUser).buyBox(saltNonce);

    const boxTokenId = await contractMysteryBoxNFT.tokenOfOwnerByIndex(buyerUser.address, 0);
    // Approve Box for the Factory
    await contractMysteryBoxNFT.connect(buyerUser).approve(contractNftFactory.address, boxTokenId);
    // Open box
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await contractNftFactory.connect(buyerUser).openBox(boxTokenId, saltNonce);
    expect(await contractPrlNft.tokenOfOwnerByIndex(buyerUser.address, 0)).to.not.equal(0);

    /* const nftTokenId = await contractPrlNft.tokenOfOwnerByIndex(buyerUser.address, 0);
    console.log(fu(nftTokenId)) */

  });
});
