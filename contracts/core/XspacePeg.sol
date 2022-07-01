// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract XspacePeg is ERC20, ERC20Burnable, Ownable, ERC20Permit {
    constructor() ERC20("Xspace", "Xspace") ERC20Permit("Xspace") {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
