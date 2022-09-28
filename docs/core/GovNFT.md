

## MyToken

### _tokenIdCounter

```solidity
struct Counters.Counter _tokenIdCounter
```

### dao

```solidity
address dao
```

### auction

```solidity
address auction
```

### mintable

```solidity
bool mintable
```

### burnable

```solidity
bool burnable
```

### mintableStatusFrozen

```solidity
bool mintableStatusFrozen
```

### burnableStatusFrozen

```solidity
bool burnableStatusFrozen
```

### constructor

```solidity
constructor(string _name, string _symbol, address _dao) public
```

### onlyDao

```solidity
modifier onlyDao()
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

### mint

```solidity
function mint(address _to) external returns (bool)
```

### burn

```solidity
function burn(uint256 _tokenId, address[] _tokens) external returns (bool)
```

_burn a new token for the given tokenid_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenId | uint256 | The tokenId of the token to burn |
| _tokens | address[] | The tokenids of tokens to burn |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the token was burned, false otherwise |

### changeMintable

```solidity
function changeMintable(bool _mintable) external returns (bool)
```

change the mintable status of the nft token

_change the mintable status of the nft token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _mintable | bool | The new mintable status |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the status was changed, false otherwise |

### changeBurnable

```solidity
function changeBurnable(bool _burnable) external returns (bool)
```

change the burnable status of the nft token

_change the burnable status of the nft token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _burnable | bool | The new burnable status |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the status was changed, false otherwise |

### freezeMintingStatus

```solidity
function freezeMintingStatus() external returns (bool)
```

freeze the mintable status of the nft token

_freeze the mintable status of the nft token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the status was frozen, false otherwise |

### freezeBurningStatus

```solidity
function freezeBurningStatus() external returns (bool)
```

freeze the burnable status of the nft token

_freeze the burnable status of the nft token_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the status was frozen, false otherwise |

