// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

interface IMintableERC721 is IERC721Upgradeable {
    function safeMint(address to, uint256 tokenId) external;
}

// ERC721HolderUpgradeable
contract NftFactoriesContract is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // NFT contract
    IMintableERC721 public radaNft;
    IERC20Upgradeable busdToken;

    /**
        DATA Structure
     */
    struct CAMPAIGN_INFO {
        uint16 maxBuyBoxPerAddress; // Allow user buy max box
        uint256 startTime;
        uint256 endTime;
        uint256 priceBox;
        bool locked; // if locked, cannot update campaign / mint / open
        bool requireWhitelist;
        uint64 totalSoldNFT; // total NFT in this campaign
        uint64 totalSoldBox; // total Box in this campaign
        uint64 totalOpenBoxes; // total opened Box in this campaign
    }

    struct ITEM_NFT {
        uint16 campaignId;
        bool used;
        bool isBox;
    }

    CAMPAIGN_INFO[] public campaigns;

    // Allocation Box & NFT
    mapping(uint16 => uint256[]) public allocationBoxes; // campaignId => tokenId[]
    mapping(uint16 => uint256[]) private allocationNFTs; // campaignId => tokenId[]

    mapping(uint256 => ITEM_NFT) public itemsNFT; // Data of NFTs

    // Operation
    mapping(address => bool) public admins;
    address public WITHDRAW_ADDRESS;

    // Whitelist by campaign
    mapping(uint16 => mapping(address => bool)) public whitelistAddresses; // campaignId => buyer => whitelist

    // Buyer record
    mapping(uint16 => mapping(address => uint16)) public buyersBoxTotal; // campaignId => buyer => total

    // Pause
    bool public paused;
    // Anti double call from user
    mapping(address => mapping(uint256 => bool)) seenNonces;

    event BuyBox(
        address buyerAddress,
        uint16 indexed campaignId,
        uint256 indexed tokenId
    );
    event OpenBox(
        address buyerAddress,
        uint16 indexed campaignId,
        uint256 indexed tokenId,
        uint256 indexed nftTokenId
    );

    function initialize(address _busdAddress, address _radaNftAddress)
        public
        initializer
    {
        __Ownable_init();

        busdToken = IERC20Upgradeable(_busdAddress);
        radaNft = IMintableERC721(_radaNftAddress);

        paused = false;
        // Default grant the admin role to a specified account
        admins[owner()] = true;
        // Default grant the withdraw to owner
        WITHDRAW_ADDRESS = owner();
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
        Modifiers
     */
    modifier onlyAdmin() {
        require(
            _msgSender() == owner() || admins[_msgSender()] == true,
            "Caller is not an admin"
        );
        _;
    }

    modifier whenNotPaused() {
        require(paused == false, "Program paused");
        _;
    }

    /**
     * @dev mint function to buy box NFT
     */
    function buyBox(uint16 _campaignId, uint256 _nonce) external whenNotPaused {
        require(!seenNonces[_msgSender()][_nonce], "Please try again");

        CAMPAIGN_INFO memory campaign = campaigns[_campaignId];
        // require campaign is open
        require(block.timestamp >= campaign.startTime, "Not Started"); // The campaign have not started
        require(block.timestamp <= campaign.endTime, "Expired"); // The campaign expired

        require(
            !campaign.requireWhitelist ||
                whitelistAddresses[_campaignId][_msgSender()],
            "Caller is not in whitelist"
        );

        uint64 totalSold = campaigns[_campaignId].totalSoldBox;

        // Check balance BUSD
        require(
            campaign.priceBox <= busdToken.balanceOf(_msgSender()),
            "Not enough Token"
        );

        uint256 allowToPayAmount = busdToken.allowance(
            _msgSender(),
            address(this)
        );
        require(
            allowToPayAmount >= campaign.priceBox,
            "Invalid token allowance"
        );
        require(allocationBoxes[_campaignId].length >= totalSold, "Sold out");
        require(
            campaign.maxBuyBoxPerAddress >
                buyersBoxTotal[_campaignId][_msgSender()],
            "Got limited"
        );

        uint256 tokenId = allocationBoxes[_campaignId][totalSold];

        // Mint the Box
        mintToUser(_campaignId, tokenId, true);
        /* radaNft.safeMint(_msgSender(), tokenId);

        ITEM_NFT memory item;
        item.campaignId = _campaignId;
        item.isBox = true;
        itemsNFT[tokenId] = item; */

        // transfer BUSD
        busdToken.safeTransferFrom(
            _msgSender(),
            address(this),
            campaign.priceBox
        );

        // Update Stats
        campaigns[_campaignId].totalSoldBox++;
        buyersBoxTotal[_campaignId][_msgSender()]++;

        seenNonces[_msgSender()][_nonce] = true;
        emit BuyBox(_msgSender(), _campaignId, tokenId);
    }

    /**
     * @dev mint function to open box NFT
     */
    function openBox(uint256 _tokenId, uint256 _nonce) external whenNotPaused {
        ITEM_NFT memory item = itemsNFT[_tokenId];
        uint16 campaignId = item.campaignId;
        CAMPAIGN_INFO memory campaign = campaigns[campaignId];
        require(!campaign.locked, "Campaign locked");
        require(
            !campaign.requireWhitelist ||
                whitelistAddresses[campaignId][_msgSender()],
            "Caller is not in whitelist"
        );
        // Check owner of NFT;
        require(radaNft.ownerOf(_tokenId) == _msgSender(), "Need owner NFT");
        require(!seenNonces[_msgSender()][_nonce], "Please try again");

        require(item.isBox == true, "This is not the Box");
        require(item.used == false, "This box opened");

        itemsNFT[_tokenId].used = true;

        uint256 nftTokenId = allocationNFTs[campaignId][
            campaigns[campaignId].totalOpenBoxes
        ];

        // Lucky draw
        if (nftTokenId > 0) {
            // Win NFT
            mintToUser(campaignId, nftTokenId, false);
            /* radaNft.safeMint(_msgSender(), nftTokenId);
            ITEM_NFT memory itemSave;
            itemSave.campaignId = _campaignId;
            itemsNFT[nftTokenId] = itemSave; */
        }
        campaigns[campaignId].totalOpenBoxes++;
        seenNonces[_msgSender()][_nonce] = true;
        emit OpenBox(_msgSender(), campaignId, _tokenId, nftTokenId);
    }

    /**
     * @dev function mint NFT
     */
    function mintToUser(
        uint16 _campaignId,
        uint256 _tokenId,
        bool _isBox
    ) internal {
        radaNft.safeMint(_msgSender(), _tokenId);

        ITEM_NFT memory itemSave;
        itemSave.campaignId = _campaignId;
        itemSave.isBox = _isBox;
        itemsNFT[_tokenId] = itemSave;
    }

    /**
     * @dev function to set pause
     */
    function setPause(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    /**
     * @dev function to set Admin
     */
    function setAdmin(address _addr, bool _allow) public onlyOwner {
        admins[_addr] = _allow;
    }

    /**
     * @dev function to set Admin
     */
    function setWithdrawAddress(address _addr) public onlyOwner {
        WITHDRAW_ADDRESS = _addr;
    }

    /**
     * @dev function to set white list address
     */
    function setWhitelist(
        uint16 _campaignId,
        address[] memory _addresses,
        bool _allow
    ) public onlyOwner {
        require(!campaigns[_campaignId].locked, "Campaign locked");
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelistAddresses[_campaignId][_addresses[i]] = _allow;
        }
    }

    /**
     * @dev function to set boxes/nft for sell by tokenId
     */
    function setAllocationNFT(
        uint16 _campaignId,
        uint256[] memory _tokenIds,
        bool isBox
    ) public onlyOwner {
        require(!campaigns[_campaignId].locked, "Campaign locked");
        if (isBox) {
            allocationBoxes[_campaignId] = _tokenIds;
        } else {
            allocationNFTs[_campaignId] = _tokenIds;
        }
    }

    /**
     * @dev function to withdraw all fund
     */
    function withdrawAllFund(address _tokenAddress) external onlyOwner {
        IERC20Upgradeable token = IERC20Upgradeable(_tokenAddress);
        require(token.balanceOf(address(this)) > 0, "Not enough Token");
        require(WITHDRAW_ADDRESS != address(0), "Invalid Address");

        token.safeTransfer(WITHDRAW_ADDRESS, token.balanceOf(address(this)));
    }

    /**
        SETTER
     */

    function useNFT(uint256 _tokenId, bool _used) public onlyAdmin {
        require(itemsNFT[_tokenId].used == _used, "Already set");
        itemsNFT[_tokenId].used = _used;
    }

    // Add/update campaign - by Admin
    function createCampaign() external onlyAdmin {
        CAMPAIGN_INFO memory campaign;
        campaigns.push(campaign);
    }

    function updateCampaign(
        uint16 _campaignId,
        uint256 _startTime,
        uint256 _endTime,
        bool _locked,
        uint256 _priceBox,
        uint16 _maxBuyBoxPerAddress,
        bool _requireWhitelist
    ) external onlyAdmin {
        require(_campaignId < campaigns.length, "Campaign not available");

        CAMPAIGN_INFO memory campaign = campaigns[_campaignId]; // campaign info

        require(!campaign.locked, "Campaign locked");

        // do update
        campaigns[_campaignId].startTime = _startTime;
        campaigns[_campaignId].endTime = _endTime;
        campaigns[_campaignId].priceBox = _priceBox;
        campaigns[_campaignId].locked = _locked;
        campaigns[_campaignId].maxBuyBoxPerAddress = _maxBuyBoxPerAddress;
        campaigns[_campaignId].requireWhitelist = _requireWhitelist;
    }

    /* GETTER */
    function campaignCount() external view returns (uint256) {
        return campaigns.length;
    }

    /* function totalAllocationNFT(uint16 _campaignId, bool isBox)
        public
        view
        returns (uint256)
    {
        if (isBox) return allocationBoxes[_campaignId].length;
        return allocationNFTs[_campaignId].length;
    } */
}
