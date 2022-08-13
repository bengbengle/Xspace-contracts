// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Activity.sol";

contract ActivityFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    address public auction;

    event activityCreated(address indexed activity);

   
    EnumerableSet.AddressSet private activities;

    /** 
    */
    function create() external returns (bool) {

        activity activity = new activity();

        require(activities.add(address(activity)));

        emit ActivityCreated(address(activity));
        emit ActivityDrawed(address(activity));
        emit ActivitySecondDrawed(address(activity));

        return true;
    }

    function setupMerkleRoot(address _merkleRoot) external returns (bool) {
        auction = _merkleRoot;
        return true;
    }

    function secondSetupMerkleRoot(address _auction) external returns (bool) {
        auction = _auction;
        return true;
    }

    /*----VIEW FUNCTIONS---------------------------------*/

    function activityAt(uint256 _i) external view returns (address) {
        return activities.at(_i);
    }

    function containsActivity(address _activity) external view returns (bool) {
        return activities.contains(_activity);
    }

    function numberOfactivities() external view returns (uint256) {
        return activities.length();
    }

    function getActivities() external view returns (address[] memory) {
        uint256 activitiesLength = activities.length();

        if (activitiesLength == 0) {
            return new address[](0);
        } else {
            address[] memory activitiesArray = new address[](activitiesLength);

            for (uint256 i = 0; i < activitiesLength; i++) {
                activitiesArray[i] = activities.at(i);
            }

            return activitiesArray;
        }
    }
}
