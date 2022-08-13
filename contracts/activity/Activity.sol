
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/escrow/ConditionalEscrow.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "openzeppelin/contracts/security/access/Ownable.sol";
import "openzeppelin/contracts/utils/Address.sol";

contract ActivityEscrow is ReentrancyGuard, {
    using Address for address payable;

    event Deposited(address indexed payee, uint256 weiAmount);
    event Claimed(address indexed payee, uint256 weiAmount);

    mapping(address => uint256) private _deposits;

    // activityId --> merkleRoot
    mapping(address => bytes32) public merkleRootList; 

    function depositsOf(address payee) public view returns (uint256) {
        return _deposits[payee];
    }

    /**
     * @dev 将发送的金额存储为要提取的信用。 
     * @param payee 资金的目的地地址。
     *
     * 发出 {Deposited} 事件。
     */
    function deposit(address payee) public payable virtual onlyOwner {
        uint256 amount = msg.value;
        _deposits[payee] += amount;
        emit Deposited(payee, amount);
    }

    function setupMerkleRoot(_merkleRoot, sign) public {

    }
    

    /**
     * @dev Withdraw accumulated balance for a payee, forwarding all gas to the
     * recipient.
     *
     * WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
     * Make sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     *
     * @param payee The address whose funds will be withdrawn and transferred to.
     *
     * Emits a {Claimed} event.
     */
    function claim(address payable payee) public virtual onlyOwner {
        uint256 payment = _deposits[payee];

        _deposits[payee] = 0;

        payee.sendValue(payment);

        emit Claimed(payee, payment);
    }
}