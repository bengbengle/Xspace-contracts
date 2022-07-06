// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../interfaces/IGovToken.sol";
import "../interfaces/IDao.sol";

contract OffchainVotingModule is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;
    
    EnumerableSet.AddressSet private permitted;

    // address public MetapiaValidationKey = 0xa2898CE12595fCC02729475FA1056c6775FA70B4;

    mapping(bytes32 => bool) public executedTx;

    struct Proposal {
        bool isActive;
        address target;
        bytes data;
        uint256 value;
        uint256 nonce;
        uint256 timestamp;
    }

    // only by Metapia Server with sig 
    mapping(address => mapping(uint256 => Proposal)) public proposals; // proposal[dao][proposalId]

    mapping(address => uint256) public numberOfProposals; // proposal[dao][num]

    event OffChainVotingExecuted(
        uint256 indexed amount,
        uint256 ethAmount,
        address[] tokenAddresses,
        uint256[] tokenAmounts
    );
 
    constructor() {
        permitted.add(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
        permitted.add(0xa2898CE12595fCC02729475FA1056c6775FA70B4);
    }

    function createProposal(
        address _daoAddress,
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint256 _nonce,
        uint256 _timestamp,
        bytes memory _sig,
        string memory _spaceId
    ) external returns (bool) {
        bytes32 txHash = getTxHash(_target, _data, _value, _nonce, _timestamp);

        require(!executedTx[txHash], "DAO: offchain voting proposal already executed");

        require(_checkSig(_sig, txHash), "DAO: signature are not invalid");

        require(keccak256(abi.encode(IDao(_daoAddress).permittedSpaceId())) == keccak256(abi.encode(_spaceId)), "OffchainVoting: spaceId is invalid");

        proposals[_daoAddress][numberOfProposals[_daoAddress]] = Proposal({
            isActive: true,
            target: _target,
            data: _data,
            value: _value,
            nonce: _nonce,
            timestamp: _timestamp
        });

        numberOfProposals[_daoAddress]++;

        return true;
    }

    function disableProposal(uint256 _proposalId) 
        external
        returns(bool) 
    {
         require(
            proposals[msg.sender][_proposalId].isActive == true, "OffchainVotingModule: Already Disabled"
        );

        proposals[msg.sender][_proposalId].isActive = false;

        return true;
    }

     function getProposals(address _dao)
        external
        view
        returns (Proposal[] memory)
    {
        Proposal[] memory _proposals = new Proposal[](numberOfProposals[_dao]);

        for (uint256 i = 0; i < numberOfProposals[_dao]; i++) {
            _proposals[i] = proposals[_dao][i];
        }
        return _proposals;
    }

    function execute(address _daoAddress, uint256 _proposalId) 
        external 
        nonReentrant 
        returns (bool) 
    {
        Proposal storage proposal = proposals[_daoAddress][_proposalId];
        
        require(proposal.isActive, "Offchain Voting Proposal Module: proposal is Disabled");

        proposal.isActive = false;

        IDao dao = IDao(_daoAddress);

        dao.executePermitted(
            proposal.target,
            proposal.data,
            proposal.value
        );

        return true;

    }
    function createAndExecute(
        address _daoAddress,
        address _target,
        bytes calldata _data,
        uint256 _value,
        uint256 _nonce,
        uint256 _timestamp,
        bytes memory _sig,
        string memory _spaceId
    ) external nonReentrant returns (bool) {

        bytes32 txHash = getTxHash(_target, _data, _value, _nonce, _timestamp);

        require(!executedTx[txHash], "OffchainVoting: offchain voting proposal already executed");

        require(_checkSig(_sig, txHash), "OffchainVoting: signature are not invalid");

        executedTx[txHash] = true;

        IDao dao = IDao(_daoAddress);

        require(keccak256(abi.encode(dao.permittedSpaceId())) == keccak256(abi.encode(_spaceId)), "OffchainVoting: spaceId is invalid");

        dao.executePermitted(
                _target,
                _data,
                _value
            );

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

    function _checkSig(bytes memory _sig, bytes32 _txHash)
        internal
        view
        returns (bool)
    {
        bytes32 ethSignedHash = _txHash.toEthSignedMessageHash();

        address signer = ethSignedHash.recover(_sig);

        require(permitted.contains(signer), "DAO: signature are not invalid");
        
        return true;
    }
    
    modifier onlyPermitted() {
        require(permitted.contains(msg.sender), "OffchainVoting: only for permitted");
        _;
    }

    function addPermitted(address p) external onlyPermitted returns (bool) {
        require(permitted.add(p), "OffchainVoting: already permitted");

        return true;
    }

    function removePermitted(address p) external onlyPermitted returns (bool) {
        require(permitted.remove(p), "OffchainVoting: not a permitted");

        return true;
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

    event Received(address indexed, uint256);

    receive() external payable {
        payable(msg.sender).sendValue(msg.value);

        emit Received(msg.sender, msg.value);
    }
}
