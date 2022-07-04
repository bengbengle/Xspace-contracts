//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IExitModule {
    function exit(address _daoAddress, uint256 _offerId)
        external
        returns (bool success);
}
