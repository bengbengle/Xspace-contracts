

## Auction

_The auction contract is used to manage the auction of a gov token._

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

setup factory address

_factory address is used to point to the factory contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _factory | address | The address of the factory |

### createGovToken

```solidity
function createGovToken(string _name, string _symbol) external returns (bool)
```

create new GovToken

_create new GovToken_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _name | string | The name of the GovToken |
| _symbol | string | The symbol of the GovToken |

### initPublicOffer

```solidity
function initPublicOffer(bool _isActive, address _currency, uint256 _rate) external returns (bool)
```

create a public offer

_DAO can use this to create/enable/disable/changeCurrency/changeRate_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _isActive | bool | true to enable, false to disable |
| _currency | address | currency address |
| _rate | uint256 | rate |

### createPrivateOffer

```solidity
function createPrivateOffer(address _recipient, address _currency, uint256 _currencyAmount, uint256 _amount) external returns (bool)
```

create private offer with _recipient address

_DAO can use this to create/enable/disable/changeCurrency/changeRate, isActive is default set true_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recipient | address | recipient address |
| _currency | address | currency address |
| _currencyAmount | uint256 | currency amount |
| _amount | uint256 | amount |

### disablePrivateOffer

```solidity
function disablePrivateOffer(uint256 _id) external returns (bool)
```

disablePrivateOffer

| Name | Type | Description |
| ---- | ---- | ----------- |
| _id | uint256 | offer id |

### buyPublicOffer

```solidity
function buyPublicOffer(address _dao, uint256 _amount) external returns (bool)
```

buy a public offer

_only DAO can sell GovTokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dao | address | DAO address |
| _amount | uint256 | amount |

### buyPrivateOffer

```solidity
function buyPrivateOffer(address _dao, uint256 _id) external returns (bool)
```

buy a private offer

_only DAO can sell GovTokens_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dao | address | DAO address |
| _id | uint256 | offer id |

