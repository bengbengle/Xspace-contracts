# Solidity API

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

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal
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

### changeMintable

```solidity
function changeMintable(bool _mintable) external returns (bool)
```

### changeBurnable

```solidity
function changeBurnable(bool _burnable) external returns (bool)
```

### freezeMintingStatus

```solidity
function freezeMintingStatus() external returns (bool)
```

### freezeBurningStatus

```solidity
function freezeBurningStatus() external returns (bool)
```

