# Solidity API

## Auction

### factory

```solidity
address factory
```

### govTokens

```solidity
mapping(address => bool) govTokens
```

### PublicOffer

```solidity
struct PublicOffer {
  bool isActive;
  address currency;
  uint256 rate;
}
```

### publicOffers

```solidity
mapping(address => struct Auction.PublicOffer) publicOffers
```

### PrivateOffer

```solidity
struct PrivateOffer {
  bool isActive;
  address recipient;
  address currency;
  uint256 currencyAmount;
  uint256 amount;
}
```

### privateOffers

```solidity
mapping(address => mapping(uint256 => struct Auction.PrivateOffer)) privateOffers
```

### numberOfPrivateOffers

```solidity
mapping(address => uint256) numberOfPrivateOffers
```

### GovTokenCreated

```solidity
event GovTokenCreated(address govToken)
```

### onlyDaoWithGovToken

```solidity
modifier onlyDaoWithGovToken()
```

### setFactory

```solidity
function setFactory(address _factory) external returns (bool)
```

### createGovToken

```solidity
function createGovToken(string _name, string _symbol) external returns (bool)
```

### initPublicOffer

```solidity
function initPublicOffer(bool _isActive, address _currency, uint256 _rate) external returns (bool)
```

### createPrivateOffer

```solidity
function createPrivateOffer(address _recipient, address _currency, uint256 _currencyAmount, uint256 _amount) external returns (bool)
```

### disablePrivateOffer

```solidity
function disablePrivateOffer(uint256 _id) external returns (bool)
```

### buyPublicOffer

```solidity
function buyPublicOffer(address _dao, uint256 _amount) external returns (bool)
```

### buyPrivateOffer

```solidity
function buyPrivateOffer(address _dao, uint256 _id) external returns (bool)
```

