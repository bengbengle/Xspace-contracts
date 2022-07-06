//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IDao {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function govToken() external view returns (address);

    function setGovToken(address _govToken) external returns (bool);

    function burnGovToken(address _recipient, uint256 _share, address[] memory _tokens) external returns (bool);

    function quorum() external view returns (uint8);

    function executedTx(bytes32 _txHash) external view returns (bool);

    function mintable() external view returns (bool);

    function burnable() external view returns (bool);

    function numberOfPermitted() external view returns (uint256);

    function numberOfAdapters() external view returns (uint256);

    function executePermitted(address _target, bytes calldata _data, uint256 _value) external returns (bool);

    function permittedSpaceId() external returns (string memory);
    
}
