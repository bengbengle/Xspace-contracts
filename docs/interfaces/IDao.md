

## IDao

### name

```solidity
function name() external view returns (string)
```

### symbol

```solidity
function symbol() external view returns (string)
```

### govToken

```solidity
function govToken() external view returns (address)
```

### setGovToken

```solidity
function setGovToken(address _govToken) external returns (bool)
```

### burnGovToken

```solidity
function burnGovToken(address _recipient, uint256 _share, address[] _tokens) external returns (bool)
```

### quorum

```solidity
function quorum() external view returns (uint8)
```

### executedTx

```solidity
function executedTx(bytes32 _txHash) external view returns (bool)
```

### mintable

```solidity
function mintable() external view returns (bool)
```

### burnable

```solidity
function burnable() external view returns (bool)
```

### numberOfPermitted

```solidity
function numberOfPermitted() external view returns (uint256)
```

### numberOfAdapters

```solidity
function numberOfAdapters() external view returns (uint256)
```

### executePermitted

```solidity
function executePermitted(address _target, bytes _data, uint256 _value) external returns (bool)
```

### permittedSpaceId

```solidity
function permittedSpaceId() external returns (string)
```

