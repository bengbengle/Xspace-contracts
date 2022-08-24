// Built by @ragonzal - 2020
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Activity {

    using SafeERC20 for IERC20;
    
    struct ActivityObj {
        bool started;
        address tokenAddress;
        uint256 tokenAmount;
        bytes32 rootHash;
    }

    event ActivityCreated(address indexed distributor, uint256 indexed activityId, address indexed token, uint256 tokenAmount);
    event ActivitStarted(address indexed distributor, uint256 indexed activityId, address indexed token, uint256 tokenAmount, bytes32 rootHash);
    event Claimed(address indexed distributor, uint256 indexed activityId, address indexed token, uint256 num);


    // distributor --> number of activities
    mapping(address => uint256) public activityIds;

    // distributor --> number of activities/activityId --> activity activity
    mapping(address => mapping(uint256 => ActivityObj)) public activities; 

    // distributor --> number of activities/activityId --> recipient --> bool
    mapping(address => mapping(uint256 => mapping(address => bool))) public claimed;

    /**
        * @dev Create new event with erc20 token address and merkle tree root hash
        * @param _tokenAddress Address of the Erc20 contract
        * @param _tokenAmount Amount of the Erc20 tokens to be dropped
     */
    function create(address _tokenAddress, uint256 _tokenAmount) 
        public 
        returns (bool)
    {

        uint256 activityId = activityIds[msg.sender];

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _tokenAmount / 1e18 );

        activities[msg.sender][activityId] = ActivityObj({
            started: false,
            tokenAddress: _tokenAddress,
            tokenAmount: _tokenAmount,
            rootHash: "0x"
        });

        activityIds[msg.sender]++;
        emit ActivityCreated(msg.sender, activityId, _tokenAddress, _tokenAmount);
        return true;
    }

    /**
        * @dev set root hash and Start activity claim with activityId 
        * @param _activityId Event id
     */
    function start(uint256 _activityId, bytes32 _rootHash) 
        public 
        returns (bool)
    {
        require(activities[msg.sender][_activityId].started == false, "Event already started");
        require(activityIds[msg.sender] > _activityId, "Event id does not exist");

        activities[msg.sender][_activityId].rootHash = _rootHash;
        activities[msg.sender][_activityId].started = true;

        emit ActivitStarted(msg.sender, _activityId, activities[msg.sender][_activityId].tokenAddress, activities[msg.sender][_activityId].tokenAmount, _rootHash);        
        return true;
    }

    /**
     * @dev Function to verify merkle tree proofs and mint Token to the recipient
     * @param distributor the distributor of the event
     * @param activityId the number of the activity event
     * @param index Leaf position in the merkle tree
     * @param recipient Recipient address of the Token to be minted
     * @param num amount of token to be claimed to recipient
     * @param proofs Array of proofs to verify the claim
     */
    function claim(
        address distributor, 
        uint256 activityId, 
        address token,
        uint256 index, 
        address recipient,
        uint256 num, 
        bytes32[] calldata proofs
    ) 
        external 
        returns (bool)
    {
        require(claimed[distributor][activityId][recipient] == false, "Recipient already processed!");

        require(verify(distributor, activityId, token, index, recipient, num, proofs), "Recipient not in merkle tree!");

        claimed[distributor][activityId][recipient] = true;

        require(transferTokens(activities[distributor][activityId].tokenAddress, recipient, num), "Could not mint Token");
        emit Claimed(distributor, activityId, token, num);
        return true;
    }


    /**
     * @dev Function to verify merkle tree proofs
     * @param activityId Leaf position in the merkle tree
     * @param index Leaf position in the merkle tree
     * @param recipient Recipient address of the Token to be transfer to.
     * @param proofs Array of proofs to verify the claim
     */
    function verify(
        address distributor, 
        uint256 activityId, 
        address token, 
        uint256 index, 
        address recipient, 
        uint256 num, 
        bytes32[] memory proofs
    ) public view returns (bool) {

        bytes32 node = keccak256(abi.encodePacked(distributor, activityId, token, index, recipient, num));

        for (uint16 i = 0; i < proofs.length; i++) {
            bytes32 proofElement = proofs[i];
            if (proofElement < node) {
                node = keccak256(abi.encodePacked(proofElement, node));
            } else {
                node = keccak256(abi.encodePacked(node, proofElement));
            }
        }
        
        // Check the merkle proof
        return activities[distributor][activityId].rootHash == node;
    }

    /**
     * @dev Function to mint Token
     * @param recipient Recipient address of the Token to be transferred to recipient.
     * @param num Array of token num to be transferred.
     */
    function transferTokens(address token, address recipient, uint256 num) internal returns (bool) {
        IERC20(token).safeTransfer(recipient, num);
        return true;
    }
}
