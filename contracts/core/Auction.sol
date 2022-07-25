// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./GovToken.sol";

import "../interfaces/IFactory.sol";
import "../interfaces/IDao.sol";
import "../interfaces/IGovToken.sol";

contract Auction is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public factory = address(0);

    mapping(address => bool) public govTokens;

    struct PublicOffer {
        bool isActive;
        address currency;
        uint256 rate; // amount = currencyAmount / rate. For example: 1 govToken = 100 USDT. 530 USDT -> 530/100 = 5.3 GovToken
    }

    mapping(address => PublicOffer) public publicOffers; // publicOffers[dao]

    struct PrivateOffer {
        bool isActive;
        address recipient;
        address currency;
        uint256 currencyAmount;
        uint256 amount;
    }

    mapping(address => mapping(uint256 => PrivateOffer)) public privateOffers; // privateOffers[dao][offerId]
    mapping(address => uint256) public numberOfPrivateOffers;

    event GovTokenCreated(address indexed govToken);

    modifier onlyDaoWithGovToken() {
        require(
            IFactory(factory).containsDao(msg.sender) && IDao(msg.sender).govToken() != address(0),
            "Auction: this function is only for DAO with GovToken"
        );
        _;
    }

    /**
        * @notice setup factory address
        * @dev factory address is used to point to the factory contract
        * @param _factory The address of the factory
     */
    function setFactory(address _factory) external returns (bool) {
        require(
            factory == address(0), "Auction: factory address has already been set"
        );

        factory = _factory;

        return true;
    }

    /**
        * @notice create new GovToken
        * @dev create new GovToken
        * @param _name The name of the GovToken
        * @param _symbol The symbol of the GovToken
     */
    function createGovToken(string memory _name, string memory _symbol)
        external
        nonReentrant
        returns (bool)
    {
        require(
            IFactory(factory).containsDao(msg.sender), "Auction: only DAO can deploy GovToken"
        );

        GovToken govToken = new GovToken(_name, _symbol, msg.sender);

        govTokens[address(govToken)] = true;

        emit GovTokenCreated(address(govToken));

        bool b = IDao(msg.sender).setGovToken(address(govToken));

        require(b, "Auction: Gov Token setting error");

        return true;
    }

      /**
        * @notice create a public offer
        * @dev DAO can use this to create/enable/disable/changeCurrency/changeRate
        * @param _isActive  true to enable, false to disable
        * @param _currency  currency address
        * @param _rate      rate
     */
    function initPublicOffer(bool _isActive, address _currency, uint256 _rate) 
        external 
        onlyDaoWithGovToken 
        returns (bool) 
    {
        publicOffers[msg.sender] = PublicOffer({
            isActive: _isActive,
            currency: _currency,
            rate: _rate
        });

        return true;
    }

    /**
        * @notice create private offer with _recipient address
        * @dev DAO can use this to create/enable/disable/changeCurrency/changeRate, isActive is default set true 
        * @param _recipient recipient address
        * @param _currency  currency address
        * @param _currencyAmount currency amount
        * @param _amount     amount
     */
    function createPrivateOffer(address _recipient, address _currency, uint256 _currencyAmount, uint256 _amount) 
        external 
        onlyDaoWithGovToken 
        returns (bool)
    {
        privateOffers[msg.sender][numberOfPrivateOffers[msg.sender]] = PrivateOffer({
            isActive: true,
            recipient: _recipient,
            currency: _currency,
            currencyAmount: _currencyAmount,
            amount: _amount
        });

        numberOfPrivateOffers[msg.sender]++;

        return true;
    }

    /**
        * @notice disablePrivateOffer
        * @param _id        offer id
     */
    function disablePrivateOffer(uint256 _id)
        external
        onlyDaoWithGovToken
        returns (bool)
    {
        privateOffers[msg.sender][_id].isActive = false;

        return true;
    }

    /**
        * @notice buy a public offer
        * @dev only DAO can sell GovTokens
        * @param _dao DAO address
        * @param _amount amount
     */
    function buyPublicOffer(address _dao, uint256 _amount)
        external
        nonReentrant
        returns (bool)
    {
        require(
            IFactory(factory).containsDao(_dao), "Auction: only DAO can sell GovTokens"
        );

        PublicOffer memory publicOffer = publicOffers[_dao];

        require(publicOffer.isActive, "Auction: this offer is disabled");

        IERC20(publicOffer.currency).safeTransferFrom(
            msg.sender,
            _dao,
            (_amount * publicOffer.rate) / 1e18
        );

        address govToken = IDao(_dao).govToken();

        bool b = IGovToken(govToken).mint(msg.sender, _amount);

        require(b, "Auction: mint error");

        return true;
    }

    /**
        * @notice buy a private offer
        * @dev only DAO can sell GovTokens
        * @param _dao DAO address
        * @param _id offer id
     */
    function buyPrivateOffer(address _dao, uint256 _id)
        external
        nonReentrant
        returns (bool)
    {
        require(
            IFactory(factory).containsDao(_dao), "Auction: only DAO can sell GovTokens"
        );

        PrivateOffer storage offer = privateOffers[_dao][_id];

        require(offer.isActive, "Auction: this offer is disabled");

        offer.isActive = false;

        require(offer.recipient == msg.sender, "Auction: wrong recipient");

        IERC20(offer.currency).safeTransferFrom(
            msg.sender,
            _dao,
            offer.currencyAmount
        );

        address token = IDao(_dao).govToken();

        bool b = IGovToken(token).mint(msg.sender, offer.amount);

        require(b, "Auction: mint error");

        return true;
    }
}
