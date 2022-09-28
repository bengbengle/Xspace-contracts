// Built by @ragonzal - 2020
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Activity {

    using SafeERC20 for IERC20;
    
    struct ActivityObj {
        bool start;
        address tokenAddress;
        uint256 tokenAmount;
        bytes32 rootHash;
    }

    event Created(address indexed distributor, uint256 indexed activityId, address indexed tokenAddress, uint256 tokenAmount);
    event Started(address indexed distributor, uint256 indexed activityId, address indexed tokenAddress, uint256 tokenAmount, bytes32 rootHash);
    event Claimed(address indexed distributor, uint256 indexed activityId, address indexed recipient, address tokenAddress, uint256 tokenAmount);


    // distributor --> number of activities
    mapping(address => uint256) public activityIds;

    // distributor --> number of activities/activityId --> activity activity
    mapping(address => mapping(uint256 => ActivityObj)) public activities; 

    // distributor --> number of activities/activityId --> recipient --> bool
    mapping(address => mapping(uint256 => mapping(address => bool))) public claimed;

    /**
        * @dev Create new activity with erc20 token address and merkle tree root hash
        * @param _tokenAddress Address of the Erc20 contract
        * @param _totalAmount Amount of the Erc20 tokens to be dropped
     */
    function create(address _tokenAddress, uint256 _totalAmount) 
        public 
        returns (bool)
    {

        activityIds[msg.sender]++;

        uint256 activityId = activityIds[msg.sender];

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _totalAmount);

        activities[msg.sender][activityId] = ActivityObj({
            start: false,
            tokenAddress: _tokenAddress,
            tokenAmount: _totalAmount,
            rootHash: "0x"
        });

        emit Created(msg.sender, activityId, _tokenAddress, _totalAmount);
        return true;
    }

    /**
        * @dev set root hash and Start activity claim with activityId 
        * @param _activityId activity id
     */
    function start(uint256 _activityId, bytes32 _rootHash) 
        public 
        returns (bool)
    {
        require(activities[msg.sender][_activityId].start == false, "activity already started");
        require(activityIds[msg.sender] >= _activityId, " ActivityId id does not exist");

        activities[msg.sender][_activityId].rootHash = _rootHash;
        activities[msg.sender][_activityId].start = true;

        emit Started(msg.sender, _activityId, activities[msg.sender][_activityId].tokenAddress, activities[msg.sender][_activityId].tokenAmount, _rootHash);        
        return true;
    }


    /**
     * @dev Function to verify merkle tree proofs and mint Token to the recipient
     * @param _distributor the distributor of the activity
     * @param _activityId the number of the activity activity
     * @param _index Leaf position in the merkle tree
     * @param _recipient Recipient address of the Token to be minted
     * @param _tokenAddress amount of token to be claimed to recipient
     * @param _tokenAmount amount of token to be claimed to recipient
     * @param _proofs Array of proofs to verify the claim
     */
    function claim(
        address _distributor, 
        uint256 _activityId, 
        uint256 _index, 
        address _recipient,
        address _tokenAddress,
        uint256 _tokenAmount, 
        bytes32[] calldata _proofs
    ) 
        external 
        returns (bool)
    {
        require(claimed[_distributor][_activityId][_recipient] == false, "Recipient already processed!");
        require(activities[_distributor][_activityId].start == true, "Recipient already processed!");
        
        require(verify(_distributor, _activityId, _index, _recipient, _tokenAddress, _tokenAmount, _proofs), "Recipient not in merkle tree!");

        claimed[_distributor][_activityId][_recipient] = true;

        require(transferTokens(_recipient, _tokenAddress, _tokenAmount), "Could not mint Token");

        emit Claimed(_distributor, _activityId, _recipient, _tokenAddress, _tokenAmount);
        return true;
    }


    // function batchClaim()
    /**
     * @dev Function to verify merkle tree proofs
     * @param _distributor _distributor of the activity 
     * @param _activityId Leaf position in the merkle tree
     * @param _index Leaf position in the merkle tree
     * @param _recipient the recipient of the activity
     * @param _tokenAddress Address of the token transfer to
     * @param _tokenAmount amount of the Token to be transfer to.
     * @param _proofs Array of proofs to verify the claim
     */
    function verify(
        address _distributor, 
        uint256 _activityId,

        uint256 _index, 
        address _recipient, 
        address _tokenAddress, 
        uint256 _tokenAmount, 

        bytes32[] memory _proofs
    ) public view returns (bool) {

        bytes32 _hash = keccak256(abi.encodePacked(_distributor, _activityId, _index, _recipient, _tokenAddress, _tokenAmount));

        for (uint16 i = 0; i < _proofs.length; i++) {
            bytes32 proofElement = _proofs[i];
            if (proofElement < _hash) {
                _hash = keccak256(abi.encodePacked(proofElement, _hash));
            } else {
                _hash = keccak256(abi.encodePacked(_hash, proofElement));
            }
        }
        
        // Check the merkle root proof
        return activities[_distributor][_activityId].rootHash == _hash;
    }

    /**
     * @dev Function to mint Token
     * @param _recipient Recipient address of the Token to be transferred to recipient.
     * @param _tokenAddress Address of token to be transferred.
     * @param _tokenAmount Array of token num to be transferred.
     */
    function transferTokens(address _recipient, address _tokenAddress, uint256 _tokenAmount) internal returns (bool) {
        IERC20(_tokenAddress).transfer(_recipient, _tokenAmount);
        return true;
    }
}
