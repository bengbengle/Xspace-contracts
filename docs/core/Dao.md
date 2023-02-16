

## Dao

_The Dao contract is used to manage the DAO._

### VOTING_DURATION

```solidity
uint32 VOTING_DURATION
```

### permitted

```solidity
struct EnumerableSet.AddressSet permitted
```

### permittedSpaceId

```solidity
string permittedSpaceId
```

### adapters

```solidity
struct EnumerableSet.AddressSet adapters
```

### factory

```solidity
address factory
```

### govToken

```solidity
address govToken
```

### quorum

```solidity
uint8 quorum
```

### ExecutedVoting

```solidity
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
```

### executedVoting

```solidity
struct Dao.ExecutedVoting[] executedVoting
```

### executedTx

```solidity
mapping(bytes32 => bool) executedTx
```

### ExecutedPermitted

```solidity
struct ExecutedPermitted {
  address target;
  bytes data;
  uint256 value;
  uint256 executionTimestamp;
  address executor;
}
```

### executedPermitted

```solidity
struct Dao.ExecutedPermitted[] executedPermitted
```

### mintable

```solidity
bool mintable
```

### burnable

```solidity
bool burnable
```

### Executed

```solidity
event Executed(address target, bytes data, uint256 value, uint256 nonce, uint256 timestamp, uint256 executionTimestamp, bytes32 txHash, bytes[] sigs)
```

### ExecutedPermittedEvent

```solidity
event ExecutedPermittedEvent(address target, bytes data, uint256 value, address executor)
```

### onlyDao

```solidity
modifier onlyDao()
```

### constructor

```solidity
constructor(string _name, string _symbol, uint8 _quorum, address[] _partners, uint256[] _shares) public
```

### executePermitted

```solidity
function executePermitted(address _target, bytes _data, uint256 _value) external returns (bool)
```

### execute

```solidity
function execute(address _target, bytes _data, uint256 _value, uint256 _nonce, uint256 _timestamp, bytes[] _sigs) external returns (bool)
```

### getTxHash

```solidity
function getTxHash(address _target, bytes _data, uint256 _value, uint256 _nonce, uint256 _timestamp) public view returns (bytes32)
```

### _checkSigs

```solidity
function _checkSigs(bytes[] _sigs, bytes32 _txHash) internal view returns (bool)
```

### burnGovToken

```solidity
function burnGovToken(address _recipient, uint256 _share, address[] _tokens) external returns (bool)
```

### addOwner

```solidity
function addOwner(address _to) external returns (bool)
```

### deleteOwner

```solidity
function deleteOwner(address _to) external returns (bool)
```

### updateOwner

```solidity
function updateOwner(address _sender, address _recipient) external returns (bool)
```

### mint

```solidity
function mint(address _to, uint256 _amount) external returns (bool)
```

### burn

```solidity
function burn(address _to, uint256 _amount) external returns (bool)
```

### move

```solidity
function move(address _sender, address _recipient, uint256 _amount) external returns (bool)
```

### disableMinting

```solidity
function disableMinting() external returns (bool)
```

### disableBurning

```solidity
function disableBurning() external returns (bool)
```

### addAdapter

```solidity
function addAdapter(address _adapter) external returns (bool)
```

### removeAdapter

```solidity
function removeAdapter(address _adapter) external returns (bool)
```

### addPermitted

```solidity
function addPermitted(address p) external returns (bool)
```

### removePermitted

```solidity
function removePermitted(address p) external returns (bool)
```

### setPermittedSpaceId

```solidity
function setPermittedSpaceId(string _spaceId) external returns (bool)
```

### setGovToken

```solidity
function setGovToken(address _govToken) external returns (bool)
```

### setFactory

```solidity
function setFactory(address _factory) external returns (bool)
```

### changeQuorum

```solidity
function changeQuorum(uint8 _quorum) external returns (bool)
```

### executedVotingByIndex

```solidity
function executedVotingByIndex(uint256 _index) external view returns (struct Dao.ExecutedVoting)
```

### getExecutedVoting

```solidity
function getExecutedVoting() external view returns (struct Dao.ExecutedVoting[])
```

### getExecutedPermitted

```solidity
function getExecutedPermitted() external view returns (struct Dao.ExecutedPermitted[])
```

### numberOfAdapters

```solidity
function numberOfAdapters() external view returns (uint256)
```

### containsAdapter

```solidity
function containsAdapter(address a) external view returns (bool)
```

### getAdapters

```solidity
function getAdapters() external view returns (address[])
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

### _hasDuplicate

```solidity
function _hasDuplicate(address[] _list) internal pure returns (bool)
```

### transfer

```solidity
function transfer(address, uint256) public pure returns (bool)
```

### transferFrom

```solidity
function transferFrom(address, address, uint256) public pure returns (bool)
```

### Received

```solidity
event Received(address, uint256)
```

### receive

```solidity
receive() external payable
```

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) external pure returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) external pure returns (bytes4)
```

### onERC721Received

```solidity
function onERC721Received(address, address, uint256, bytes) external pure returns (bytes4)
```

### tokensReceived

```solidity
function tokensReceived(address, address, address, uint256, bytes, bytes) external pure
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view virtual returns (bool)
```

