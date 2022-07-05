// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/IGovToken.sol";
import "../interfaces/IDao.sol";

contract ExitModule is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    struct exitOffer {
        bool isActive;
        address recipient;
        uint256 amount;
        uint256 ethAmount;
        address[] tokenAddresses;
        uint256[] tokenAmounts;
    }

    mapping(address => mapping(uint256 => exitOffer)) public exitOffers; // exitOffers[dao][offerId]

    mapping(address => uint256) public numberOfPrivateOffers;

    event Exit(
        address indexed recipient,
        uint256 indexed amount,
        uint256 ethAmount,
        address[] tokenAddresses,
        uint256[] tokenAmounts
    );

    function createExitOffer(
        address _recipient,
        uint256 _amount,
        uint256 _ethAmount,
        address[] memory _tokenAddresses,
        uint256[] memory _tokenAmounts
    ) external returns (bool success) {
        require(
            _tokenAddresses.length == _tokenAmounts.length, "ExitModule: Invalid Tokens"
        );

        exitOffers[msg.sender][numberOfPrivateOffers[msg.sender]] = exitOffer({
            isActive: true,
            recipient: _recipient,
            amount: _amount,
            ethAmount: _ethAmount,
            tokenAddresses: _tokenAddresses,
            tokenAmounts: _tokenAmounts
        });

        numberOfPrivateOffers[msg.sender]++;

        return true;
    }

    function disableExitOffer(uint256 _offerId)
        external
        returns (bool success)
    {
        require(
            exitOffers[msg.sender][_offerId].isActive == true, "ExitModule: Already Disabled"
        );

        exitOffers[msg.sender][_offerId].isActive = false;

        return true;
    }

    function exit(address _daoAddress, uint256 _offerId)
        external
        nonReentrant
        returns (bool success)
    {
        exitOffer storage offer = exitOffers[_daoAddress][_offerId];

        require(offer.isActive, "ExitModule: Offer is Disabled");

        offer.isActive = false;

        require(
            offer.recipient == msg.sender,
            "ExitModule: Invalid Recipient"
        );

        IDao dao = IDao(_daoAddress);

        address govToken = dao.govToken();

        bool burnableStatus = IGovToken(govToken).burnable();

        require(
            burnableStatus || !IGovToken(govToken).burnableStatusFrozen(),
            "ExitModule: LP is not Burnable"
        );

        if (!burnableStatus) {
            dao.executePermitted(
                govToken,
                abi.encodeWithSignature("changeBurnable(bool)", true),
                0
            );
        }

        IERC20(govToken).safeTransferFrom(
            msg.sender,
            address(this),
            offer.amount
        );

        IERC20(govToken).approve(govToken, offer.amount);

        address[] memory emptyAddressArray = new address[](0);

        IGovToken(govToken).burn(
            offer.amount,
            emptyAddressArray
        );

        for (uint256 i = 0; i < offer.tokenAddresses.length; i++) {
            if (offer.tokenAmounts[i] > 0) {
                dao.executePermitted(
                    offer.tokenAddresses[i],
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        msg.sender,
                        offer.tokenAmounts[i]
                    ),
                    0
                );
            }
        }

        if (offer.ethAmount > 0) {
            dao.executePermitted(msg.sender, "", offer.ethAmount);
        }

        if (!burnableStatus) {
            dao.executePermitted(
                govToken,
                abi.encodeWithSignature("changeBurnable(bool)", false),
                0
            );
        }

        emit Exit(
            offer.recipient,
            offer.amount,
            offer.ethAmount,
            offer.tokenAddresses,
            offer.tokenAmounts
        );

        return true;
    }

    function getOffers(address _dao)
        external
        view
        returns (exitOffer[] memory)
    {
        exitOffer[] memory offers = new exitOffer[](
            numberOfPrivateOffers[_dao]
        );

        for (uint256 i = 0; i < numberOfPrivateOffers[_dao]; i++) {
            offers[i] = exitOffers[_dao][i];
        }

        return offers;
    }

    event Received(address indexed, uint256);

    receive() external payable {
        payable(msg.sender).sendValue(msg.value);

        emit Received(msg.sender, msg.value);
    }
}
