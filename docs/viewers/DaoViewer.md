

## DaoViewer

### DaoInfo

```solidity
struct DaoInfo {
  address dao;
  string daoName;
  string daoSymbol;
  address govToken;
  string name;
  string symbol;
}
```

### getDao

```solidity
function getDao(address _dao) public view returns (struct DaoViewer.DaoInfo)
```

### getDaos

```solidity
function getDaos(address _factory) public view returns (struct DaoViewer.DaoInfo[])
```

### userDaos

```solidity
function userDaos(address _user, address _factory) external view returns (struct DaoViewer.DaoInfo[])
```

### balances

```solidity
function balances(address[] users, address[] tokens) external view returns (uint256[])
```

### DaoConfiguration

```solidity
struct DaoConfiguration {
  bool gtMintable;
  bool gtBurnable;
  address govTokenAddress;
  bool govTokenMintable;
  bool govTokenBurnable;
  bool govTokenMintableStatusFrozen;
  bool govTokenBurnableStatusFrozen;
  uint256 permittedLength;
  uint256 adaptersLength;
  uint256 numberOfPrivateOffers;
}
```

### getDaoConfiguration

```solidity
function getDaoConfiguration(address _factory, address _dao) external view returns (struct DaoViewer.DaoConfiguration)
```

### getInvestInfo

```solidity
function getInvestInfo(address _factory) external view returns (struct DaoViewer.DaoInfo[], struct IAuction.PublicOffer[], string[], uint8[], uint256[])
```

### getPrivateOffersInfo

```solidity
function getPrivateOffersInfo(address _factory) external view returns (struct DaoViewer.DaoInfo[], uint256[], struct IAuction.PrivateOffer[], string[], uint8[])
```

