// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../interfaces/IDao.sol";

contract MyToken is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

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
    ) ERC721(_name, _symbol) {
        dao = _dao;
        auction = msg.sender;
    }

    modifier onlyDao() {
        require(msg.sender == dao, "GovToken: caller is not the dao");
        _;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function mint(address _to) external onlyOwner returns (bool) {
        require(mintable, "GovToken: minting is disabled");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        return true;
    }

    /**
     * @notice burn a new token for the given tokenid
     * @dev burn a new token for the given tokenid
     * @param _tokenId The tokenId of the token to burn
     * @param _tokens The tokenids of tokens to burn
     * @return true if the token was burned, false otherwise
     */
    function burn(uint256 _tokenId, address[] memory _tokens)
        external
        returns (bool)
    {
        require(burnable, "GovToken: burning is disabled");
        require(msg.sender != dao, "GovToken: DAO can't burn GovToken");
        require(balanceOf(msg.sender) >= 1, "GovToken: insufficient balance");
        require(totalSupply() > 0, "GovToken: Zero share");

        uint256 _share = 1 / (totalSupply());

        _burn(_tokenId);

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
