# Solidity API

## IAuction

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
function publicOffers(address _dao) external view returns (struct IAuction.PublicOffer)
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
function privateOffers(address _dao, uint256 _index) external view returns (struct IAuction.PrivateOffer)
```

### numberOfPrivateOffers

```solidity
function numberOfPrivateOffers(address _dao) external view returns (uint256)
```

### buyPrivateOffer

```solidity
function buyPrivateOffer(address _dao, uint256 _id) external returns (bool)
```

