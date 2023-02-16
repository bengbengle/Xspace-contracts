

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

create new DAO

_create new DAO_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _daoName | string | The name of the DAO |
| _daoSymbol | string | The symbol of the Dao |
| _quorum | uint8 | the mimimum quorum of the DAO |
| _partners | address[] | The partners address of the DAO |
| _shares | uint256[] | The shares of the each partners |

### setupAuction

```solidity
function setupAuction(address _auction) external returns (bool)
```

### daoAt

```solidity
function daoAt(uint256 _i) external view returns (address)
```

get DAO by index

_get DAO by index_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _i | uint256 | The index of the DAO |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The DAO |

### containsDao

```solidity
function containsDao(address _dao) external view returns (bool)
```

get is contained the dao

_get is contained the dao by the dao address_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dao | address | The DAO address |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | The is contained the dao |

### numberOfDaos

```solidity
function numberOfDaos() external view returns (uint256)
```

get DAO count

_get DAO count_

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The DAO count |

### getDaos

```solidity
function getDaos() external view returns (address[])
```

get DAO addresses list

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address[] | dao addresses list |

