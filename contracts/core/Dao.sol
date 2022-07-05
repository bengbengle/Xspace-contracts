// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/IAdapter.sol";
import "../interfaces/IFactory.sol";

import "../interfaces/ERC1155TokenReceiver.sol";
import "../interfaces/ERC721TokenReceiver.sol";
import "../interfaces/ERC777TokensRecipient.sol";
import "../interfaces/IERC165.sol";

contract Dao is ReentrancyGuard, ERC20, ERC1155TokenReceiver, ERC777TokensRecipient, ERC721TokenReceiver, IERC165 {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using Address for address;
    using Address for address payable;
    using ECDSA for bytes32;

    uint32 public constant VOTING_DURATION = 3 days;

    /*----STATE------------------------------------------*/

    // These addresses can rule without voting
    EnumerableSet.AddressSet private permitted;

    // These contracts help burn GovToken's
    EnumerableSet.AddressSet private adapters;

    // Factory Address
    address public immutable factory;

    // Auction Address
    // address public immutable auction;

    // TODO: NFT token address
    address public govToken = address(0); 

    // Quorum >=1 <=100
    uint8 public quorum;

    // Executed Voting
    struct ExecutedVoting {
        address target;
        bytes data;
        uint256 value;
        uint256 nonce;
        uint256 timestamp;
        uint256 executionTimestamp;
        bytes32 txHash;
        bytes[] sigs;
    }

    ExecutedVoting[] internal executedVoting;

    mapping(bytes32 => bool) public executedTx;

    struct ExecutedPermitted {
        address target;
        bytes data;
        uint256 value;
        uint256 executionTimestamp;
        address executor;
    }

    ExecutedPermitted[] public executedPermitted;

    // GT
    bool public mintable = true;
    bool public burnable = true;

    /*----EVENTS-----------------------------------------*/

    event Executed(
        address indexed target,
        bytes data,
        uint256 value,
        uint256 indexed nonce,
        uint256 timestamp,
        uint256 executionTimestamp,
        bytes32 txHash,
        bytes[] sigs
    );

    event ExecutedPermittedEvent(
        address indexed target,
        bytes data,
        uint256 value,
        address indexed executor
    );

    /*----MODIFIERS--------------------------------------*/

    modifier onlyDao() {
        require(
            msg.sender == address(this),
            "DAO: this function is only for DAO"
        );
        _;
    }

    /*----CONSTRUCTOR------------------------------------*/

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _quorum,
        address[] memory _partners,
        uint256[] memory _shares
    ) ERC20(_name, _symbol) {
        factory = msg.sender;

        // auction = IFactory(msg.sender).auction();

        require(
            _quorum >= 1 && _quorum <= 100,
            "DAO: quorum should be 1 <= q <= 100"
        );

        quorum = _quorum;

        require(
            _partners.length > 0 && _partners.length == _shares.length,
            "DAO: shares distribution is invalid"
        );

        for (uint256 i = 0; i < _partners.length; i++) {
            _mint(_partners[i], _shares[i]);
        }
    }

    /*----MAIN FUNCTIONS TO RULE--------------------------*/

    function executePermitted(
        address _target,
        bytes calldata _data,
        uint256 _value
    ) external nonReentrant returns (bool) {
        // require(checkSubscription(), "DAO: subscription not paid");

        require(permitted.contains(msg.sender), "DAO: only for permitted");

        executedPermitted.push(
            ExecutedPermitted({
                target: _target,
                data: _data,
                value: _value,
                executionTimestamp: block.timestamp,
                executor: msg.sender
            })
        );

        emit ExecutedPermittedEvent(_target, _data, _value, msg.sender);

        if (_data.length == 0) {
            payable(_target).sendValue(_value);
        } else {
            if (_value == 0) {
                _target.functionCall(_data);
            } else {
                _target.functionCallWithValue(_data, _value);
            }
        }

        return true;
    }

    function execute(
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint256 _nonce,
        uint256 _timestamp,
        bytes[] memory _sigs
    ) external nonReentrant returns (bool) {
        // require(checkSubscription(), "DAO: subscription not paid");

        require(balanceOf(msg.sender) > 0, "DAO: only for members");

        require(
            _timestamp + VOTING_DURATION >= block.timestamp,
            "DAO: voting is over"
        );

        bytes32 txHash = getTxHash(_target, _data, _value, _nonce, _timestamp);

        require(!executedTx[txHash], "DAO: voting already executed");

        require(_checkSigs(_sigs, txHash), "DAO: quorum is not reached");

        executedTx[txHash] = true;

        executedVoting.push(
            ExecutedVoting({
                target: _target,
                data: _data,
                value: _value,
                nonce: _nonce,
                timestamp: _timestamp,
                executionTimestamp: block.timestamp,
                txHash: txHash,
                sigs: _sigs
            })
        );

        emit Executed(
            _target,
            _data,
            _value,
            _nonce,
            _timestamp,
            block.timestamp,
            txHash,
            _sigs
        );

        if (_data.length == 0) {
            payable(_target).sendValue(_value);
        } else {
            if (_value == 0) {
                _target.functionCall(_data);
            } else {
                _target.functionCallWithValue(_data, _value);
            }
        }

        return true;
    }

    function getTxHash(
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint256 _nonce,
        uint256 _timestamp
    ) public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    address(this),
                    _target,
                    _data,
                    _value,
                    _nonce,
                    _timestamp,
                    block.chainid
                )
            );
    }

    function _checkSigs(bytes[] memory _sigs, bytes32 _txHash)
        internal
        view
        returns (bool)
    {
        bytes32 ethSignedHash = _txHash.toEthSignedMessageHash();

        uint256 share = 0;

        address[] memory signers = new address[](_sigs.length);

        for (uint256 i = 0; i < _sigs.length; i++) {
            address signer = ethSignedHash.recover(_sigs[i]);

            signers[i] = signer;
        }

        require(!_hasDuplicate(signers), "DAO: signatures are not unique");

        for (uint256 i = 0; i < signers.length; i++) {
            share += balanceOf(signers[i]);
        }

        if (share * 100 < totalSupply() * quorum) {
            return false;
        }

        return true;
    }

     /*----BURN Gov TOKENS---------------------------------*/

    function burnGovToken(
        address _recipient,
        uint256 _share,
        address[] memory _tokens
    ) external nonReentrant returns (bool) {
        require(govToken != address(0), "DAO: GovToken not set yet");

        require(msg.sender == govToken, "DAO: only for Gov Token Contract Address ");

        require(
            !_hasDuplicate(_tokens), "DAO: duplicates are prohibited (tokens)"
        );

        for (uint256 i = 0; i < _tokens.length; i++) {
            require(
                _tokens[i] != govToken && _tokens[i] != address(this),
                "DAO: GOV Token and GT cannot be part of a share"
            );
        }

        // ETH

        payable(_recipient).sendValue((address(this).balance * _share) / 1e18);

        // Tokens

        if (_tokens.length > 0) {
            uint256[] memory _tokenShares = new uint256[](_tokens.length);

            for (uint256 i = 0; i < _tokens.length; i++) {
                _tokenShares[i] = ((IERC20(_tokens[i]).balanceOf(address(this)) * _share) / 1e18);
            }

            for (uint256 i = 0; i < _tokens.length; i++) {
                IERC20(_tokens[i]).safeTransfer(_recipient, _tokenShares[i]);
            }
        }

        return true;
    }
    

    /*----GT MANAGEMENT----------------------------------*/

    
    function addOwner(address _to)
        external
        onlyDao
        returns (bool)
    {
        require(mintable, "DAO: GT minting is disabled");
        require(balanceOf(_to) == 0, "DAO: The Owner is in the DAO Space");
        _mint(_to, 1);
        return true;
    }

    function deleteOwner(address _to)
        external
        onlyDao
        returns (bool)
    {
        require(burnable, "DAO: GT burning is disabled");
        require(balanceOf(_to) > 0, "DAO: The Owner is not in the DAO Space");

        _burn(_to, balanceOf(_to));
        return true;
    }

    function updateOwner(address _sender, address _recipient) 
        external 
        onlyDao 
        returns (bool)
    {
        require(balanceOf(_sender) > 0 &&  balanceOf(_recipient) == 0 , "DAO: The Sender is not in the DAO Space");

        _transfer(_sender, _recipient, balanceOf(_recipient));

        return true;
    }
    

    function mint(address _to, uint256 _amount)
        external
        onlyDao
        returns (bool)
    {
        require(mintable, "DAO: GT minting is disabled");
        _mint(_to, _amount);
        return true;
    }


    function burn(address _to, uint256 _amount)
        external
        onlyDao
        returns (bool)
    {
        require(burnable, "DAO: GT burning is disabled");
        _burn(_to, _amount);
        return true;
    }

    function move(address _sender, address _recipient, uint256 _amount) 
        external 
        onlyDao 
        returns (bool) 
    {
        _transfer(_sender, _recipient, _amount);
        return true;
    }

    function disableMinting() external onlyDao returns (bool) {
        mintable = false;
        return true;
    }

    function disableBurning() external onlyDao returns (bool) {
        burnable = false;
        return true;
    }

    /*----ADAPTERS & PERMITTED---------------------------*/

    function addAdapter(address _adapter) external onlyDao returns (bool) {
        require(adapters.add(_adapter), "DAO: already an adapter");

        permitted.add(_adapter);

        return true;
    }

    function removeAdapter(address _adapter) external onlyDao returns (bool) {
        require(adapters.remove(_adapter), "DAO: not an adapter");

        permitted.remove(_adapter);

        return true;
    }

    function addPermitted(address p) external onlyDao returns (bool) {
        require(permitted.add(p), "DAO: already permitted");

        return true;
    }

    function removePermitted(address p) external onlyDao returns (bool) {
        require(permitted.remove(p), "DAO: not a permitted");

        return true;
    }

    /*----Gov Token---------------------------------------------*/

    function setGovToken(address _govToken) external returns (bool) {
        require(govToken == address(0), "DAO: Gov Token address has already been set");

        // require(msg.sender == auction, "DAO: only Auction can set Gov Token");

        govToken = _govToken;

        return true;
    }

    /*----QUORUM-----------------------------------------*/

    function changeQuorum(uint8 _quorum) external onlyDao returns (bool) {
        require(_quorum >= 1 && _quorum <= 100, "DAO: quorum should be 1 <= _quorum <= 100");

        quorum = _quorum;

        return true;
    }
    
    /*----VIEW FUNCTIONS---------------------------------*/

    function executedVotingByIndex(uint256 _index)
        external
        view
        returns (ExecutedVoting memory)
    {
        return executedVoting[_index];
    }

    function getExecutedVoting()
        external
        view
        returns (ExecutedVoting[] memory)
    {
        return executedVoting;
    }

    function getExecutedPermitted()
        external
        view
        returns (ExecutedPermitted[] memory)
    {
        return executedPermitted;
    }

    function numberOfAdapters() external view returns (uint256) {
        return adapters.length();
    }

    function containsAdapter(address a) external view returns (bool) {
        return adapters.contains(a);
    }

    function getAdapters() external view returns (address[] memory) {
        uint256 adaptersLength = adapters.length();

        if (adaptersLength == 0) {
            return new address[](0);
        } else {
            address[] memory adaptersArray = new address[](adaptersLength);

            for (uint256 i = 0; i < adaptersLength; i++) {
                adaptersArray[i] = adapters.at(i);
            }

            return adaptersArray;
        }
    }

    function numberOfPermitted() external view returns (uint256) {
        return permitted.length();
    }

    function containsPermitted(address p) external view returns (bool) {
        return permitted.contains(p);
    }

    function getPermitted() external view returns (address[] memory) {
        uint256 permittedLength = permitted.length();

        if (permittedLength == 0) {
            return new address[](0);
        } else {
            address[] memory permittedArray = new address[](permittedLength);

            for (uint256 i = 0; i < permittedLength; i++) {
                permittedArray[i] = permitted.at(i);
            }

            return permittedArray;
        }
    }

    /*----PURE FUNCTIONS---------------------------------*/
    
    function _hasDuplicate(address[] memory _list) internal pure returns (bool) {
        if (_list.length <= 1) {
            return false;
        } else {
            for (uint256 i = 0; i < _list.length - 1; i++) {
                address current = _list[i];
                for (uint256 j = i + 1; j < _list.length; j++) {
                    if (current == _list[j]) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert("DAO: transfer is prohibited");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public pure override returns (bool) {
        revert("DAO: transferFrom is prohibited");
    }

    /*----RECEIVE ETH------------------------------------*/

    event Received(address indexed, uint256);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return 0xf23a6e61;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return 0xbc197c81;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return 0x150b7a02;
    }

    function tokensReceived(
        address,
        address,
        address,
        uint256,
        bytes calldata,
        bytes calldata
    ) external pure override {
        // We implement this for completeness, doesn't really have any value
    }

    function supportsInterface(bytes4 interfaceId) external view virtual override returns (bool) {
        return
            interfaceId == type(ERC1155TokenReceiver).interfaceId ||
            interfaceId == type(ERC721TokenReceiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
