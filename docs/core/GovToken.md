

## GovToken

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

### onlyDaoAuction

```solidity
modifier onlyDaoAuction()
```

### mint

```solidity
function mint(address _to, uint256 _amount) external returns (bool)
```

### burn

```solidity
function burn(uint256 _amount, address[] _tokens) external returns (bool)
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

