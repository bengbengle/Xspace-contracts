// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../interfaces/IDao.sol";


contract GovToken is ReentrancyGuard, ERC20, ERC20Permit {
    address public immutable dao;

    address public auction;

    bool public mintable = true;
    bool public burnable = true;
    bool public mintableStatusFrozen = false;
    bool public burnableStatusFrozen = false;

    constructor(
        string memory _name,
        string memory _symbol,
        address _dao
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        dao = _dao;
        auction = msg.sender;
    }

    modifier onlyDao() {
        require(msg.sender == dao, "GovToken: caller is not the dao");
        _;
    }

    modifier onlyDaoAuction() {
        require(msg.sender == dao || msg.sender == auction, "GovToken: caller is not the dao");
        _;
    }


    function mint(address _to, uint256 _amount) external onlyDaoAuction returns (bool)
    {
        require(mintable, "GovToken: minting is disabled");
        _mint(_to, _amount);
        return true;
    }

    function burn(uint256 _amount, address[] memory _tokens) external nonReentrant returns (bool) 
    {
        require(burnable, "GovToken: burning is disabled");
        require(msg.sender != dao, "GovToken: DAO can't burn GovToken");
        require(
            _amount <= balanceOf(msg.sender), "GovToken: insufficient balance"
        );
        require(totalSupply() > 0, "GovToken: Zero share");

        uint256 _share = (1e18 * _amount) / (totalSupply());

        _burn(msg.sender, _amount);

        bool b = IDao(dao).burnGovToken(msg.sender, _share, _tokens);

        require(b, "GovToken: burning error");

        return true;
    }

    function changeMintable(bool _mintable) external onlyDao returns (bool) {
        require(!mintableStatusFrozen, "GovToken: minting status is frozen");
        mintable = _mintable;
        return true;
    }

    function changeBurnable(bool _burnable) external onlyDao returns (bool) {
        require(!burnableStatusFrozen, "GovToken: burnable status is frozen");
        burnable = _burnable;
        return true;
    }

    function freezeMintingStatus() external onlyDao returns (bool) {
        mintableStatusFrozen = true;
        return true;
    }

    function freezeBurningStatus() external onlyDao returns (bool) {
        burnableStatusFrozen = true;
        return true;
    }
}
