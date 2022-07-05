// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../interfaces/IGovToken.sol";
import "../interfaces/IDao.sol";

contract OffchainVotingModule is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;
    using ECDSA for bytes32;

    address public MetapiaValidationKey = 0xB26D1CD9500e692952741e79daB3535A1AC86B04;

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

    function createProposal(
        address _daoAddress,

        address _target,
        bytes calldata _data,
        uint256 _value,
        uint256 _nonce,
        uint256 _timestamp,

        bytes memory _sig
    ) external returns (bool success) {
        bytes32 txHash = getTxHash(_target, _data, _value, _nonce, _timestamp);

        require(!executedTx[txHash], "DAO: offchain voting proposal already executed");

        require(_checkSig(_sig, txHash), "DAO: signature are not invalid");


        proposals[_daoAddress][numberOfProposals[_daoAddress]] = Proposal({
            isActive: true,
            target: _target,
            data: _data,
            value: _value,
            nonce: _nonce,
            timestamp: _timestamp
        });

        numberOfProposals[msg.sender]++;

        return true;
    }

    function disableProposal(uint256 _proposalId) 
        external
        returns(bool success) 
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
            abi.encodeWithSignature("changeBurnable(bool)", true),
            0
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

        bytes memory _sig
    ) external nonReentrant returns (bool) {

        bytes32 txHash = getTxHash(_target, _data, _value, _nonce, _timestamp);

        require(!executedTx[txHash], "DAO: offchain voting proposal already executed");

        require(_checkSig(_sig, txHash), "DAO: signature are not invalid");

        executedTx[txHash] = true;

        IDao dao = IDao(_daoAddress);

        dao.executePermitted(
            _target,
            abi.encodeWithSignature("changeBurnable(bool)", true),
            0
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

        require(signer == MetapiaValidationKey, "DAO: signature are not invalid");

        return true;
    }

    event Received(address indexed, uint256);

    receive() external payable {
        payable(msg.sender).sendValue(msg.value);

        emit Received(msg.sender, msg.value);
    }
}
