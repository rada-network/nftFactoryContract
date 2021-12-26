// We import Chai to use its asserting functions here.
const {
  expect
} = require("chai");
const {
  ethers,
  upgrades
} = require('hardhat');
const {
  BN,
  constants,
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

describe("NFT Contract", function () {

  let contractNftFactories;
  let contractRadaNFT;
  let bUSDToken;
  let campaignId;
  let saltNonce = Math.floor(Math.random() * 9999999) + 1000000;;
  const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
  const URL_BASE = "https://nft.1alo.com/v1/rada/";

  // Utils
  const pe = (num) => ethers.utils.parseEther(num) // parseEther
  const fe = (num) => ethers.utils.formatEther(num) // formatEther
  const pu = (num, decimals = 0) => ethers.utils.parseUnits(num, decimals) // parseUnits
  const fu = (num, decimals = 0) => ethers.utils.formatUnits(num, decimals) // formatEther

  beforeEach(async function () {

    [owner, approvalUser, minterUser, withdrawUser, buyerUser, buyerUser2, ...addrs] = await ethers.getSigners();

    const RadaNftContract = await ethers.getContractFactory("RadaNftContract");
    contractRadaNFT = await RadaNftContract.deploy();

    const BUSDToken = await ethers.getContractFactory("BUSDToken");
    bUSDToken = await BUSDToken.deploy();

    // Get the ContractFactory
    const NftFactoriesContract = await ethers.getContractFactory("NftFactoriesContract");
    contractNftFactories = await upgrades.deployProxy(NftFactoriesContract, [bUSDToken.address, contractRadaNFT.address], {
      kind: 'uups'
    });

    /* NFT */
    // Set updateBaseURI
    await contractRadaNFT.updateBaseURI(URL_BASE);

    // Set approval
    await contractRadaNFT.addApprovalWhitelist(approvalUser.address);

    // Set minterFactory for NFT
    await contractRadaNFT.setMintFactory(contractNftFactories.address);

    /* NftFactoriesContract */
    // Set minter
    await contractNftFactories.setAdmin(minterUser.address, true);

    // Add campaign
    await contractNftFactories.createCampaign();
    campaignId = fu(await contractNftFactories.campaignCount()) - 1;
    await contractNftFactories.updateCampaign(campaignId, 1640398360, 1640710740, false, pe("100"),1,true);
    // Mint 100 Boxes
    var boxes = []
    for (var i = 10001; i <= 10100; i++) {
      boxes.push(i)
    }

    // Set Boxes for sell
    await contractNftFactories.setAllocationNFT(campaignId, boxes, true);

    // Mint 100 PRL NFT
    var nfts = [];
    for (var i = 10101; i <= 10200; i++) {
      nfts.push(i);
    }

    // Set random NFT for open Box
    const shuffledArr = array => array.sort(() => 0.5 - Math.random());
    var randomNFTs = shuffledArr(nfts);
    await contractNftFactories.setAllocationNFT(campaignId, randomNFTs, false);

  });

  it('Deploy v1 and should set right minterFactory address, right minter address', async function () {
    expect(await contractRadaNFT.hasRole(MINTER_ROLE, contractNftFactories.address)).to.equal(true);
    expect(await contractNftFactories.admins(minterUser.address)).to.equal(true);
  });

  it('Should the owner set withdraw address and can withdraw all funds', async function () {

    // Admin top up payable token to contract
    await bUSDToken.transfer(contractNftFactories.address, pe("2000"));
    const balanceFund = await bUSDToken.balanceOf(contractNftFactories.address);

    // Set withdraw address
    await contractNftFactories.setWithdrawAddress(withdrawUser.address);

    // Withdraw
    await contractNftFactories.withdrawAllFund(bUSDToken.address);
    expect(await bUSDToken.balanceOf(withdrawUser.address)).to.equal(balanceFund.toString());

  });

  it('Should buy Box successfully - whitelist', async function () {
    // Set white list
    await contractNftFactories.setWhitelist(campaignId, [buyerUser.address], true);

    // Set maxBuyBoxPerAddress
    const campaign = await contractNftFactories.campaigns(campaignId)
    await contractNftFactories.updateCampaign(campaignId, campaign.startTime, campaign.endTime, campaign.locked, campaign.priceBox, 2, campaign.requireWhitelist);
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("50"));

    // Should reverted because not enough BUSD
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("150"));

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);

    expect(await bUSDToken.balanceOf(buyerUser.address)).to.equal(pe("0"));
    expect(await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 0)).to.equal(pu("10001"));
    expect(await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 1)).to.equal(pu("10002"));
  });

  it('Should revert buy Box if not in white list - whitelist', async function () {

    // Not in white list should revert
    await bUSDToken.transfer(buyerUser2.address, pe("100"));
    await bUSDToken.connect(buyerUser2).approve(contractNftFactories.address, pe("100"));
    await expect(contractNftFactories.connect(buyerUser2).buyBox(campaignId, saltNonce)).to.be.reverted;

  });


  it('Should buy Box successfully - public', async function () {
    // Set white list
    const campaign = await contractNftFactories.campaigns(campaignId)
    await contractNftFactories.updateCampaign(campaignId, campaign.startTime, campaign.endTime, campaign.locked, campaign.priceBox, 2, false);
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("200"));

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;


    expect(await bUSDToken.balanceOf(buyerUser.address)).to.equal(pe("0"));
    expect(await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 0)).to.equal(pu("10001"));
    expect(await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 1)).to.equal(pu("10002"));
  });

  it('Should buy Box successfully and reverted over max buy allow - whitelist', async function () {
    // Set white list
    await contractNftFactories.setWhitelist(campaignId, [buyerUser.address], true);

    // Set limit buy
    // await contractNftFactories.setMaxBuyPerAddress(1); // 1 is default
    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("200"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("200"));
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);

    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    // Should reverted
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;
  });

  it('Should buy all Boxes successfully and sold out - whitelist', async function () {
    // Set white list
    await contractNftFactories.setWhitelist(campaignId, [buyerUser.address], true);
    // Set limit buy
    const campaign = await contractNftFactories.campaigns(campaignId)
    await contractNftFactories.updateCampaign(campaignId, campaign.startTime, campaign.endTime, campaign.locked, campaign.priceBox, 1000, campaign.requireWhitelist);

    // Approve allowance
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("11000"));

    // Admin top up payable token to user
    await bUSDToken.transfer(buyerUser.address, pe("11000"));

    for (var i = 1001; i <= 1100; i++) {
      // Buy box
      saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
      await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)
    }

    // Should reverted
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;
    expect(await contractRadaNFT.balanceOf(buyerUser.address)).to.equal(pu("100"));
  });

  it('Should buy Box and open box successfully - whitelist', async function () {
    // Set white list
    await contractNftFactories.setWhitelist(campaignId, [buyerUser.address], true);

    // Approve & top up BUSD
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("100"));
    await bUSDToken.transfer(buyerUser.address, pe("100"));

    // Buy box
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);

    const boxTokenId = await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 0);
    // Approve Box for the Factory
    //await contractRadaNFT.connect(buyerUser).approve(contractNftFactories.address, boxTokenId);
    // Open box
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await contractNftFactories.connect(buyerUser).openBox(boxTokenId, saltNonce);
    expect(await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 0)).to.not.equal(0);

    /* const nftTokenId = await contractRadaNFT.tokenOfOwnerByIndex(buyerUser.address, 0);
    console.log(fu(nftTokenId)) */

  });

  it('Should reverted buy Box when campaign has been not start or expired - whitelist', async function () {
    // Approve & top up BUSD
    await bUSDToken.connect(buyerUser).approve(contractNftFactories.address, pe("100"));
    await bUSDToken.transfer(buyerUser.address, pe("100"));

    // Set white list
    await contractNftFactories.setWhitelist(campaignId, [buyerUser.address], true);
    const campaign = await contractNftFactories.campaigns(campaignId)
    const timeNotStart = Math.round(new Date().getTime()/1000) + 86400*2;
    await contractNftFactories.updateCampaign(campaignId, timeNotStart, campaign.endTime, campaign.locked, campaign.priceBox, 2, campaign.requireWhitelist);
    // Today plus 2 days

    // Should reverted
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;

    await contractNftFactories.updateCampaign(campaignId, 1640398360, campaign.endTime, campaign.locked, campaign.priceBox, 2, campaign.requireWhitelist);
    // Now
    // Bought success
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce);

    const START_TIME = Math.floor(Date.now() / 1000);
    const increaseDays = 600;
    const increaseTime = parseInt(START_TIME) - Math.floor(Date.now() / 1000) + 86400 * (increaseDays - 1);

    await ethers.provider.send("evm_increaseTime", [increaseTime]);
    await ethers.provider.send("evm_mine", []) // force mine the next block

    // Should reverted
    saltNonce = Math.floor(Math.random() * 9999999) + 1000000; // Random nonce
    await expect(contractNftFactories.connect(buyerUser).buyBox(campaignId, saltNonce)).to.be.reverted;

  });
});