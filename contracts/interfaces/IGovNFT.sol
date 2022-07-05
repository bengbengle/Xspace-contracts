//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IGovToken {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function mint(address _to, uint256 _amount) external returns (bool);

    function mintable() external view returns (bool);

    function burnable() external view returns (bool);

    function mintableStatusFrozen() external view returns (bool);

    function burnableStatusFrozen() external view returns (bool);

    function burn(uint256 _amount, address[] memory _tokens) external returns (bool);
}
