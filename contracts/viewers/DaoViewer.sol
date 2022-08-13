//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "../interfaces/IFactory.sol";
import "../interfaces/IDao.sol";
import "../interfaces/IGovToken.sol";
import "../interfaces/IAuction.sol";

contract DaoViewer {
    struct DaoInfo {
        address dao;
        string daoName;
        string daoSymbol;

        address govToken;
        string name;
        string symbol;
    }

    function getDao(address _dao) public view returns (DaoInfo memory) {
        address govToken = IDao(_dao).govToken();

        if (govToken == address(0)) {
            return
                DaoInfo({
                    dao: _dao,
                    daoName: IDao(_dao).name(),
                    daoSymbol: IDao(_dao).symbol(),
                    govToken: address(0),
                    name: "",
                    symbol: ""
                });
        }

        return
            DaoInfo({
                dao: _dao,
                daoName: IDao(_dao).name(),
                daoSymbol: IDao(_dao).symbol(),
                govToken: govToken,
                name: IGovToken(govToken).name(),
                symbol: IGovToken(govToken).symbol()
            });
    }

    function getDaos(address _factory) public view returns (DaoInfo[] memory) {
        address[] memory _daosRaw = IFactory(_factory).getDaos();

        DaoInfo[] memory _daos = new DaoInfo[](_daosRaw.length);

        if (_daosRaw.length == 0) {
            return new DaoInfo[](0);
        } else {
            for (uint256 i = 0; i < _daosRaw.length; i++) {
                _daos[i] = getDao(_daosRaw[i]);
            }

            return _daos;
        }
    }

    function userDaos(address _user, address _factory)
        external
        view
        returns (DaoInfo[] memory)
    {
        DaoInfo[] memory _daos = getDaos(_factory);

        if (_daos.length == 0) {
            return new DaoInfo[](0);
        } else {
            DaoInfo[] memory _userDaos = new DaoInfo[](_daos.length);

            for (uint256 i = 0; i < _daos.length; i++) {
                if (IERC20Metadata(_daos[i].dao).balanceOf(_user) > 0) {
                    _userDaos[i] = _daos[i];
                }
            }

            return _userDaos;
        }
    }

    function balances(address[] memory users, address[] memory tokens)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory addrBalances = new uint256[](
            tokens.length * users.length
        );

        for (uint256 i = 0; i < users.length; i++) {
            for (uint256 j = 0; j < tokens.length; j++) {
                uint256 addrIdx = j + tokens.length * i;

                if (tokens[j] != address(0x0)) {
                    addrBalances[addrIdx] = IERC20Metadata(tokens[j]).balanceOf(
                        users[i]
                    );
                } else {
                    addrBalances[addrIdx] = users[i].balance;
                }
            }
        }

        return addrBalances;
    }

    struct DaoConfiguration {
        bool gtMintable;
        bool gtBurnable;

        address govTokenAddress;
        
        bool govTokenMintable;
        bool govTokenBurnable;

        bool govTokenMintableStatusFrozen;
        bool govTokenBurnableStatusFrozen;
        
        uint256 permittedLength;
        uint256 adaptersLength;
        
        // uint256 monthlyCost;
        uint256 numberOfPrivateOffers;
    }

    function getDaoConfiguration(address _factory, address _dao)
        external
        view
        returns (DaoConfiguration memory)
    {
        address govToken = IDao(_dao).govToken();

        if (govToken == address(0)) {
            return
                DaoConfiguration({
                    gtMintable: IDao(_dao).mintable(),
                    gtBurnable: IDao(_dao).burnable(),

                    govTokenAddress: address(0),
                    govTokenMintable: false,
                    govTokenBurnable: false,
                    govTokenMintableStatusFrozen: false,
                    govTokenBurnableStatusFrozen: false,
                    
                    permittedLength: IDao(_dao).numberOfPermitted(),
                    adaptersLength: IDao(_dao).numberOfAdapters(),
                    
                    // monthlyCost: IFactory(_factory).monthlyCost(),
                    numberOfPrivateOffers: 0
                });
        } else {
            return
                DaoConfiguration({
                    gtMintable: IDao(_dao).mintable(),
                    gtBurnable: IDao(_dao).burnable(),
                    govTokenAddress: govToken,
                    govTokenMintable: IGovToken(govToken).mintable(),
                    govTokenBurnable: IGovToken(govToken).burnable(),
                    govTokenMintableStatusFrozen: IGovToken(govToken).mintableStatusFrozen(),
                    govTokenBurnableStatusFrozen: IGovToken(govToken).burnableStatusFrozen(),
                    permittedLength: IDao(_dao).numberOfPermitted(),
                    adaptersLength: IDao(_dao).numberOfAdapters(),
                    // monthlyCost: IFactory(_factory).monthlyCost(),
                    numberOfPrivateOffers: IAuction(IFactory(_factory).auction()).numberOfPrivateOffers(_dao)
                });
        }
    }

    function getInvestInfo(address _factory)
        external
        view
        returns (
            DaoInfo[] memory,
            IAuction.PublicOffer[] memory,
            string[] memory,
            uint8[] memory,
            uint256[] memory
        )
    {
        DaoInfo[] memory daos = getDaos(_factory);

        uint256 daosLength = daos.length;

        if (daosLength == 0) {
            return (
                new DaoInfo[](0),
                new IAuction.PublicOffer[](0),
                new string[](0),
                new uint8[](0),
                new uint256[](0)
            );
        }

        IAuction.PublicOffer[] memory publicOffers = new IAuction.PublicOffer[](
            daosLength
        );

        for (uint256 i = 0; i < daosLength; i++) {
            publicOffers[i] = IAuction(IFactory(_factory).auction()).publicOffers(daos[i].dao);
        }

        string[] memory symbols = new string[](daosLength);
        uint8[] memory decimals = new uint8[](daosLength);

        for (uint256 i = 0; i < daosLength; i++) {
            if (publicOffers[i].currency != address(0)) {
                try IERC20Metadata(publicOffers[i].currency).symbol() returns (
                    string memory s
                ) {
                    symbols[i] = s;
                } catch {}

                try
                    IERC20Metadata(publicOffers[i].currency).decimals()
                returns (uint8 d) {
                    decimals[i] = d;
                } catch {}
            }
        }

        uint256[] memory numberOfPrivateOffers = new uint256[](daosLength);

        for (uint256 i = 0; i < daosLength; i++) {
            numberOfPrivateOffers[i] = IAuction(IFactory(_factory).auction())
                .numberOfPrivateOffers(daos[i].dao);
        }

        return (daos, publicOffers, symbols, decimals, numberOfPrivateOffers);
    }

    function getPrivateOffersInfo(address _factory)
        external
        view
        returns (
            DaoInfo[] memory,
            uint256[] memory,
            IAuction.PrivateOffer[] memory,
            string[] memory,
            uint8[] memory
        )
    {
        DaoInfo[] memory daos = getDaos(_factory);

        uint256 daosLength = daos.length;

        if (daosLength == 0) {
            return (
                new DaoInfo[](0),
                new uint256[](0),
                new IAuction.PrivateOffer[](0),
                new string[](0),
                new uint8[](0)
            );
        }

        uint256[] memory totalPrivateOffers = new uint256[](daosLength);

        uint256 privateOffersLength = 0;

        IAuction auction = IAuction(IFactory(_factory).auction());

        for (uint256 i = 0; i < daosLength; i++) {
            uint256 numberOfPrivateOffers = auction.numberOfPrivateOffers(daos[i].dao);

            totalPrivateOffers[i] = numberOfPrivateOffers;

            privateOffersLength += numberOfPrivateOffers;
        }

        IAuction.PrivateOffer[] memory privateOffers = new IAuction.PrivateOffer[](
            privateOffersLength
        );

        string[] memory symbols = new string[](privateOffersLength);

        uint8[] memory decimals = new uint8[](privateOffersLength);

        uint256 indexCounter = 0;

        for (uint256 i = 0; i < daosLength; i++) {
            for (uint256 j = 0; j < totalPrivateOffers[i]; j++) {
                IAuction.PrivateOffer memory privateOffer = auction.privateOffers(
                    daos[i].dao,
                    j
                );

                privateOffers[indexCounter] = privateOffer;

                try IERC20Metadata(privateOffer.currency).symbol() returns (
                    string memory s
                ) {
                    symbols[indexCounter] = s;
                } catch {}

                try IERC20Metadata(privateOffer.currency).decimals() returns (
                    uint8 d
                ) {
                    decimals[indexCounter] = d;
                } catch {}

                indexCounter++;
            }
        }

        return (daos, totalPrivateOffers, privateOffers, symbols, decimals);
    }
}
