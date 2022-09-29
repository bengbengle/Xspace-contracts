// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../lib/base64.sol";
import "../lib/addressFormatter.sol";
import "../lib/strings.sol";
import "../lib/IValidator.sol";
import "./IMetopianSBTFactory.sol";

error Soulbound();

abstract contract IReverseRecords {
    function getNames(address[] calldata addresses)
        external
        view
        virtual
        returns (string[] memory);
}


contract MetopiaAlphaTestProof is ERC721, Ownable {
	using strings for *;
    using Counters for Counters.Counter;
    event Issue(uint typeId);

    IValidator private validator = IValidator(0x0ece45dd8962345573893fF12A08B6A5d824AdaF);
    IMetopianSBTFactory private sbtFactory = IMetopianSBTFactory(0xDe9f94086f92efeEe1C2c07290480B5B73701304);
    IReverseRecords private res = IReverseRecords(0x196eC7109e127A353B709a20da25052617295F6f);

    function lookupName(address addr) private view returns (string memory) {
        string memory resolved;
        address[] memory t = new address[](1);
        t[0] = addr;
        string[] memory results = res.getNames(t);
        if (bytes(results[0]).length == 0) {
            resolved = string(abi.encodePacked("0x",addressFormatter.toAsciiString(addr)));
        } else {
            resolved = results[0];
        }
        return resolved;
    }
    struct Token {
        uint id;
        uint tokenType;
        address issuer;
        string issuerName;
        
        bytes signature;
        uint timestamp;
        mapping(string=>string) attributes;
    }

    Counters.Counter private _tokenId;
    Token[] public _tokens;
    mapping(uint => uint) public _tokenIdCounters;
    mapping(uint => mapping(address=>uint)) private _balances;
    
    string private imageRenderURI =  "https://ai.metopia.xyz/sbt-generator";
    string private description = "";

    constructor() ERC721("Metopian SBT", "MSBT"){}

    function mint(uint typeId, string memory attributes, bytes memory _sig) public {
        require(_balances[typeId][msg.sender] == 0, "Dupl");
        
        IMetopianSBTFactory.TokenType memory tokenType = sbtFactory.tokenType(typeId);
        
        string memory message = string(abi.encodePacked("0x", addressFormatter.toAsciiString(msg.sender), attributes, Strings.toString(typeId)));
        
        require(validator.verify(tokenType.owner, msg.sender, message, _sig));
        _tokenIdCounters[typeId] = _tokenIdCounters[typeId] + 1 ;
        _tokenId.increment();
        _safeMint(msg.sender, _tokenId.current());
        _balances[typeId][msg.sender] = 1;
        
        Token storage token = _tokens.push();
        token.id = _tokenIdCounters[typeId];
        token.tokenType = typeId;
        token.signature = _sig;
        token.issuer = tokenType.owner;
        token.issuerName = lookupName(tokenType.owner);
        token.timestamp = block.timestamp;
        
        updateTokenAttrs(_tokenId.current(), attributes);
    }

    function updateTokenAttrs(uint id, string memory attributes) private{
        // Token storage token = _tokens[id - 1]; 
        if(bytes(attributes).length>0){
            strings.slice memory s = attributes.toSlice();
            strings.slice memory delim = "==".toSlice();
            strings.slice memory delim2 = "&&".toSlice();
    
            while(!s.empty()){
                string memory tmpField = s.split(delim).toString();
                string memory tmpValue = s.split(delim2).toString();
                _tokens[id - 1].attributes[tmpField] = tmpValue;
            }   
        }
    }

    function update(uint id, string memory attributes, bytes memory _sig) public {
        require(id <= _tokenId.current(), "Invalid id");
        Token storage token = _tokens[id-1]; 
        IMetopianSBTFactory.TokenType memory tokenType = sbtFactory.tokenType(token.tokenType);
        string memory message = string(abi.encodePacked(attributes, Strings.toString(id)));
        require(validator.verify(tokenType.owner, msg.sender, message, _sig));
        token.signature = _sig;

        updateTokenAttrs(id, attributes);
    }

    function tokenAttr(uint256 id, string calldata field) public view returns (string memory){
        return _tokens[id-1].attributes[field];
    }

    function tokenAttrsJsonStr(uint id) public view returns (string memory){
        bytes memory buff;
        Token storage token = _tokens[id - 1];
        IMetopianSBTFactory.TokenType memory tokenType = sbtFactory.tokenType(token.tokenType);
        if(tokenType.fields.length == 0) {
            return "";
        }
        for (uint i=0; i<tokenType.fields.length; i++) {
            buff = bytes(
                abi.encodePacked(
                    buff, 
                    ",{", 
                    "'trait_type':'", tokenType.fields[i],"',",
                    "'value':'", token.attributes[tokenType.fields[i]],
                    "'}"
                ));
        }
        return string(buff);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenId.current();
    }

    function tokenURI(uint256 id) public view override returns (string memory){
        require(id <= _tokenId.current(), "Invalid id");
        return constructTokenURI(id);
    }

    function tokenImageUrl(uint256 id) private view returns (string memory) {
        Token storage token = _tokens[id-1];
        
        IMetopianSBTFactory.TokenType memory tokenType = sbtFactory.tokenType(token.tokenType);
        // TokenType storage tokenType = _tokenTypes[token.tokenType];
        return string(
            abi.encodePacked(
                imageRenderURI,
                "?title=", tokenType.titleEncoded,
                "&description=", tokenType.descriptionEncoded,
                "&space=", tokenType.spaceEncoded,
                "&signer=", token.issuerName,
                "&featuredImageCID=", tokenType.featuredImageCID,
                "&id=", Strings.toString(id)
            )
        );
    }
    
    function constructTokenURI(uint256 id) private view returns (string memory) {
        Token storage token = _tokens[id-1];
        IMetopianSBTFactory.TokenType memory tokenType = sbtFactory.tokenType(token.tokenType);
        // TokenType storage tokenType = _tokenTypes[token.tokenType];
        return string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                "{", 
                                "'name':'", name(), "',",
                                "'description':'", description, "',",
                                "'image':'", tokenImageUrl(id), "',",
                                "'attributes':[",
                                    "{'trait_type': 'Title', 'value': '", tokenType.title, "'},",
                                    "{'trait_type': 'Description', 'value':'", tokenType.description, "'},",
                                    "{'trait_type':'Space', 'value':'", tokenType.space, "'},",
                                    "{'trait_type':'Signer', 'value':'", token.issuerName, "'},",
                                    tokenAttrsJsonStr(id),
                                "]}"
                            )
                        )
                    )
                )
            );
    }

    function setValidator(address _addr) public onlyOwner{
        validator = IValidator(_addr);
    }

    function setSBTFactory(address _addr) public onlyOwner{
        sbtFactory = IMetopianSBTFactory(_addr);
    }

    function setImageRenderURI(string memory _uri) public onlyOwner{
        imageRenderURI = _uri;
    }

    function setDescription(string calldata _description) public onlyOwner{
        description = _description;
    }


    /**
     * @notice SOULBOUND: Block transfers.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(
            from == address(0) || to == address(0),
            "SB: Nontransferable"
        );
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function setApprovalForAll(address operator, bool _approved)
        public
        virtual
        override
    {
        revert Soulbound();
    }

    /**
     * @notice SOULBOUND: Block approvals.
     */
    function approve(address to, uint256 tokenId)
        public
        virtual
        override
    {
        revert Soulbound();
    }
}