// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Dao.sol";

contract Factory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    address public auction;

    event DaoCreated(address indexed dao);

   
    EnumerableSet.AddressSet private daos;

    /**
        * @notice create new DAO
        * @dev create new DAO
        * @param _daoName The name of the DAO
        * @param _daoSymbol The symbol of the Dao
        * @param _quorum the mimimum quorum of the DAO
        * @param _partners The partners address of the DAO
        * @param _shares The shares of the each partners
     */
    function create(
        string memory _daoName,
        string memory _daoSymbol,
        uint8 _quorum,
        address[] memory _partners,
        uint256[] memory _shares
    ) external returns (bool) {
        Dao dao = new Dao(_daoName, _daoSymbol, _quorum, _partners, _shares);

        require(daos.add(address(dao)));

        emit DaoCreated(address(dao));

        return true;
    }

    // /**
    //     * @notice create multi sig wallet DAO 
    //     * @dev get DAO by address
    //     * @param _daoName The name of the DAO
    //     * @param _daoSymbol The symbol of the DAO
    //     * @param _quorum the mimimum quorum of the DAO
    //     * @param _partners The partners address of the DAO
    //     * @return The DAO
    //  */
    // function createMultiSigWallet(
    //     string memory _daoName,
    //     string memory _daoSymbol,
    //     uint8 _quorum,
    //     address[] memory _partners
    // ) external returns (bool) {
    //     uint256[] memory _shares = new uint256[](_partners.length);

    //     for (uint256 i = 0; i < _partners.length; i++) {
    //         _shares[i] = 1;
    //     }
    //     Dao dao = new Dao(_daoName, _daoSymbol, _quorum, _partners, _shares);

    //     require(daos.add(address(dao)));

    //     emit DaoCreated(address(dao));

    //     return true;
    // }

    function setupAuction(address _auction) external returns (bool) {
        auction = _auction;
        return true;
    }

    /*----VIEW FUNCTIONS---------------------------------*/

    /**
        * @notice get DAO by index
        * @dev get DAO by index
        * @param _i The index of the DAO
        * @return The DAO
     */
    function daoAt(uint256 _i) external view returns (address) {
        return daos.at(_i);
    }

    /**
        * @notice get is contained the dao
        * @dev get is contained the dao by the dao address
        * @param _dao The DAO address
        * @return The is contained the dao
     */
    function containsDao(address _dao) external view returns (bool) {
        return daos.contains(_dao);
    }

    /**
        * @notice get DAO count
        * @dev get DAO count
        * @return The DAO count
     */
    function numberOfDaos() external view returns (uint256) {
        return daos.length();
    }

    /**
        * @notice get DAO addresses list
        * @return dao addresses list
     */
    function getDaos() external view returns (address[] memory) {
        uint256 daosLength = daos.length();

        if (daosLength == 0) {
            return new address[](0);
        } else {
            address[] memory daosArray = new address[](daosLength);

            for (uint256 i = 0; i < daosLength; i++) {
                daosArray[i] = daos.at(i);
            }

            return daosArray;
        }
    }
}
