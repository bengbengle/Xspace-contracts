

## ExitModule

### exitOffer

```solidity
struct exitOffer {
  bool isActive;
  address recipient;
  uint256 amount;
  uint256 ethAmount;
  address[] tokenAddresses;
  uint256[] tokenAmounts;
}
```

### exitOffers

```solidity
mapping(address => mapping(uint256 => struct ExitModule.exitOffer)) exitOffers
```

### numberOfPrivateOffers

```solidity
mapping(address => uint256) numberOfPrivateOffers
```

### Exit

```solidity
event Exit(address recipient, uint256 amount, uint256 ethAmount, address[] tokenAddresses, uint256[] tokenAmounts)
```

### createExitOffer

```solidity
function createExitOffer(address _recipient, uint256 _amount, uint256 _ethAmount, address[] _tokenAddresses, uint256[] _tokenAmounts) external returns (bool success)
```

### disableExitOffer

```solidity
function disableExitOffer(uint256 _offerId) external returns (bool success)
```

### exit

```solidity
function exit(address _daoAddress, uint256 _offerId) external returns (bool success)
```

### getOffers

```solidity
function getOffers(address _dao) external view returns (struct ExitModule.exitOffer[])
```

### Received

```solidity
event Received(address, uint256)
```

### receive

```solidity
receive() external payable
```

