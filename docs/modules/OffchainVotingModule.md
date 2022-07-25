

## OffchainVotingModule

### permitted

```solidity
struct EnumerableSet.AddressSet permitted
```

### executedTx

```solidity
mapping(bytes32 => bool) executedTx
```

### Proposal

```solidity
struct Proposal {
  bool isActive;
  address target;
  bytes data;
  uint256 value;
  uint256 nonce;
  uint256 timestamp;
}
```

### proposals

```solidity
mapping(address => mapping(uint256 => struct OffchainVotingModule.Proposal)) proposals
```

### numberOfProposals

```solidity
mapping(address => uint256) numberOfProposals
```

### OffChainVotingExecuted

```solidity
event OffChainVotingExecuted(uint256 amount, uint256 ethAmount, address[] tokenAddresses, uint256[] tokenAmounts)
```

### constructor

```solidity
constructor() public
```

### createProposal

```solidity
function createProposal(address _daoAddress, address _target, bytes _data, uint256 _value, uint256 _nonce, uint256 _timestamp, bytes _sig, string _spaceId) external returns (bool)
```

### disableProposal

```solidity
function disableProposal(uint256 _proposalId) external returns (bool)
```

### getProposals

```solidity
function getProposals(address _dao) external view returns (struct OffchainVotingModule.Proposal[])
```

### execute

```solidity
function execute(address _daoAddress, uint256 _proposalId) external returns (bool)
```

### createAndExecute

```solidity
function createAndExecute(address _daoAddress, address _target, bytes _data, uint256 _value, uint256 _nonce, uint256 _timestamp, bytes _sig, string _spaceId) external returns (bool)
```

### getTxHash

```solidity
function getTxHash(address _target, bytes _data, uint256 _value, uint256 _nonce, uint256 _timestamp) public view returns (bytes32)
```

### _checkSig

```solidity
function _checkSig(bytes _sig, bytes32 _txHash) internal view returns (bool)
```

### onlyPermitted

```solidity
modifier onlyPermitted()
```

### addPermitted

```solidity
function addPermitted(address p) external returns (bool)
```

### removePermitted

```solidity
function removePermitted(address p) external returns (bool)
```

### numberOfPermitted

```solidity
function numberOfPermitted() external view returns (uint256)
```

### containsPermitted

```solidity
function containsPermitted(address p) external view returns (bool)
```

### getPermitted

```solidity
function getPermitted() external view returns (address[])
```

### Received

```solidity
event Received(address, uint256)
```

### receive

```solidity
receive() external payable
```

