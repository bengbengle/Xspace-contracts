# Solidity API

## Factory

### auction

```solidity
address auction
```

### DaoCreated

```solidity
event DaoCreated(address dao)
```

### daos

```solidity
struct EnumerableSet.AddressSet daos
```

### create

```solidity
function create(string _daoName, string _daoSymbol, uint8 _quorum, address[] _partners, uint256[] _shares) external returns (bool)
```

@notice

### createMultiSigWallet

```solidity
function createMultiSigWallet(string _daoName, string _daoSymbol, uint8 _quorum, address[] _partners) external returns (bool)
```

### setupAuction

```solidity
function setupAuction(address _auction) external returns (bool)
```

### daoAt

```solidity
function daoAt(uint256 _i) external view returns (address)
```

### containsDao

```solidity
function containsDao(address _dao) external view returns (bool)
```

### numberOfDaos

```solidity
function numberOfDaos() external view returns (uint256)
```

### getDaos

```solidity
function getDaos() external view returns (address[])
```

