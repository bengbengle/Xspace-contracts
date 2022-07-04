//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IAuction {
    struct PublicOffer {
        bool isActive;
        address currency;
        uint256 rate;
    }

    function publicOffers(address _dao) external view returns (PublicOffer memory);

    struct PrivateOffer {
        bool isActive;
        address recipient;
        address currency;
        uint256 currencyAmount;
        uint256 amount;
    }

    function privateOffers(address _dao, uint256 _index)
        external
        view
        returns (PrivateOffer memory);

    function numberOfPrivateOffers(address _dao)
        external
        view
        returns (uint256);

    function buyPrivateOffer(address _dao, uint256 _id) external returns (bool);
}
