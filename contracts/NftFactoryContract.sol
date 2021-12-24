// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

interface IMintableERC721 is IERC721Upgradeable {
    function safeMint(address to, uint256 tokenId) external;

    function burn(uint256 tokenId) external;
}

contract NftFactoryContract is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC721HolderUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // NFT contract
    IMintableERC721 public minterErc721;
    IMintableERC721 public boxNft;
    IMintableERC721 public ticketNft;
    IERC20Upgradeable busdToken;

    // Operation
    mapping(address => bool) public admins;
    address public WITHDRAW_ADDRESS;
    uint256 public priceBox;
    uint256 public maxBuyPerAddress;
    bool public requireWhitelist;
    mapping(address => bool) public whitelistAddresses;

    // Box to sell
    uint256[] public boxesForSell; // tokenID of sell boxes
    uint256 public totalSoldBoxes; // Total sold boxes

    // Box opened
    uint256 public totalOpenBoxes; // Total opened boxes
    uint256[] private randomNFTs; // tokenID of random NFT

    // Buyer record
    mapping(address => uint256) public buyersBoxTotal;

    // Pause
    bool public paused;
    // Anti double call from user
    mapping(address => mapping(uint256 => bool)) seenNonces;

    event TokenMinted(
        address contractAddress,
        address to,
        uint256[] indexed tokenIds
    );
    event BuyBox(address buyerAddress, uint256 indexed tokenId);
    event OpenBox(
        address buyerAddress,
        uint256 indexed tokenId,
        uint256 indexed nftTokenId
    );

    function initialize(
        address _busdAddress,
        address _boxAddress,
        address _ticketAddress
    ) public initializer {
        __Ownable_init();

        busdToken = IERC20Upgradeable(_busdAddress);
        boxNft = IMintableERC721(_boxAddress);
        ticketNft = IMintableERC721(_ticketAddress);

        paused = false;
        // Default grant the admin role to a specified account
        admins[owner()] = true;
        // Default grant the withdraw to owner
        WITHDRAW_ADDRESS = owner();
        // Set price Box
        priceBox = 100 * 10**18; // 100
        // Max 1 box per address
        maxBuyPerAddress = 1;
        // Require white list to buy box
        requireWhitelist = true;
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

    modifier onlyWhiteList() {
        require(
            !requireWhitelist || whitelistAddresses[_msgSender()],
            "Caller is not in whitelist"
        );
        _;
    }

    modifier whenNotPaused() {
        require(paused == false, "Program paused");
        _;
    }

    /**
     * @dev mint function to Mint NFT to this contract
     */
    /* function mintToContract(address _erc721, uint256[] memory _tokenIds)
        external
        whenNotPaused
    {
        require(admins[_msgSender()], "Require role");
        minterErc721 = IMintableERC721(_erc721);

        // Mint multi NFT
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            minterErc721.safeMint(address(this), _tokenIds[i]);
        }
        emit TokenMinted(address(minterErc721), address(this), _tokenIds);
    } */

    /**
     * @dev mint function to buy box NFT
     */
    function buyBox(uint256 _nonce) external whenNotPaused onlyWhiteList {
        require(!seenNonces[_msgSender()][_nonce], "Please try again");
        // Check balance BUSD
        require(
            priceBox <= busdToken.balanceOf(_msgSender()),
            "Not enough Token"
        );

        uint256 allowToPayAmount = busdToken.allowance(
            _msgSender(),
            address(this)
        );
        require(allowToPayAmount >= priceBox, "Invalid token allowance");
        require(boxesForSell.length >= totalSoldBoxes, "Sold out");
        require(maxBuyPerAddress > buyersBoxTotal[_msgSender()], "Got limited");

        // Require white list
        /* require(
            !requireWhitelist || whitelistAddresses[_msgSender()],
            "Whitelist only"
        ); */

        uint256 tokenId = boxesForSell[totalSoldBoxes];
        // Check owner of NFT;
        // require(boxNft.ownerOf(tokenId) == address(this), "Not avaiable");
        // Mint the Box
        boxNft.safeMint(_msgSender(), tokenId);

        totalSoldBoxes++;

        // transfer BUSD
        busdToken.safeTransferFrom(_msgSender(), address(this), priceBox);
        // transfer NFT / not use
        // boxNft.safeTransferFrom(address(this), _msgSender(), tokenId);

        buyersBoxTotal[_msgSender()]++;
        seenNonces[_msgSender()][_nonce] = true;
        emit BuyBox(_msgSender(), tokenId);
    }

    /**
     * @dev mint function to open box NFT
     */
    function openBox(uint256 _tokenId, uint256 _nonce)
        external
        whenNotPaused
        onlyWhiteList
    {
        // Check owner of NFT;
        require(boxNft.ownerOf(_tokenId) == _msgSender(), "Need owner NFT");
        address addressApproved = boxNft.getApproved(_tokenId);
        bool approveForAll = boxNft.isApprovedForAll(
            _msgSender(),
            address(this)
        );
        require(
            addressApproved == address(this) || approveForAll,
            "Require approve"
        );
        require(!seenNonces[_msgSender()][_nonce], "Please try again");

        boxNft.burn(_tokenId);

        uint256 nftTokenId = randomNFTs[totalOpenBoxes];
        /* require(
            ticketNft.ownerOf(nftTokenId) == address(this),
            "Please try again"
        ); */
        if (nftTokenId > 0) {
            // Win NFT
            // transfer NFT
            // ticketNft.safeTransferFrom(address(this), _msgSender(), nftTokenId);
            ticketNft.safeMint(_msgSender(), nftTokenId);
        }
        totalOpenBoxes++;
        seenNonces[_msgSender()][_nonce] = true;
        emit OpenBox(_msgSender(), _tokenId, nftTokenId);
    }

    /**
     * @dev function to set pause
     */
    function setPause(bool _paused) external onlyAdmin {
        require(paused != _paused, "Already set");

        paused = _paused;
    }

    /**
     * @dev function to set Admin
     */
    function setAdmin(address _addr, bool _allow) public onlyOwner {
        require(admins[_addr] != _allow, "Already set");

        admins[_addr] = _allow;
    }

    /**
     * @dev function to set Admin
     */
    function setWithdrawAddress(address _addr) public onlyOwner {
        require(WITHDRAW_ADDRESS != _addr, "Already set");

        WITHDRAW_ADDRESS = _addr;
    }

    /**
     * @dev function to set price
     */
    function setPriceBox(uint256 _price) public onlyOwner {
        require(priceBox != _price, "Already set");

        priceBox = _price;
    }

    /**
     * @dev function to set boxes for sell by tokenId
     */
    function setBoxesForSell(uint256[] memory _tokenIds) public onlyOwner {
        boxesForSell = _tokenIds;
    }

    /**
     * @dev function to set limit buy per address
     */
    function setMaxBuyPerAddress(uint256 _limit) public onlyOwner {
        require(maxBuyPerAddress != _limit, "Already set");
        maxBuyPerAddress = _limit;
    }

    /**
     * @dev function to set white list address
     */
    function setWhitelist(address[] memory _addresses, bool _allow)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelistAddresses[_addresses[i]] = _allow;
        }
    }

    /**
     * @dev function to set white list address
     */
    function setRequireWhitelist(bool _allow) public onlyOwner {
        require(requireWhitelist != _allow, "Already set");
        requireWhitelist = _allow;
    }

    /**
     * @dev function to set white list address
     */
    function setRandomNFT(uint256[] memory _randomTokenIds) public onlyOwner {
        require(totalOpenBoxes == 0, "Boxex aleardy openned");

        randomNFTs = _randomTokenIds;
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
     * @dev function to withdraw NFTs
     */
    /* function withdrawNft(address _erc721, uint256[] memory _tokenIds)
        external
        onlyOwner
    {
        IERC721Upgradeable erc721 = IERC721Upgradeable(_erc721);
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(
                erc721.ownerOf(_tokenIds[i]) == address(this),
                "Need owner role"
            );
        }

        require(WITHDRAW_ADDRESS != address(0), "Invalid Address");

        // Withdraw NFT
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            erc721.safeTransferFrom(
                address(this),
                WITHDRAW_ADDRESS,
                _tokenIds[i]
            );
        }
    } */

    /* GETTER */
    function getBoxesForSell() public view returns (uint256[] memory) {
        return boxesForSell;
    }

    function totalBoxesForSell() public view returns (uint256) {
        return boxesForSell.length;
    }
}
