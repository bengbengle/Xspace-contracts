# Solidity API

## LaunchpadModule

### factory

```solidity
contract IFactory factory
```

### auction

```solidity
contract IAuction auction
```

### exitModule

```solidity
contract IExitModule exitModule
```

### Sale

```solidity
struct Sale {
  address currency;
  uint256 rate;
  bool isFinite;
  bool isLimitedTotalSaleAmount;
  bool isWhitelist;
  bool isAllocation;
  uint256 endTimestamp;
  uint256 totalSaleAmount;
  struct EnumerableSetUpgradeable.AddressSet whitelist;
  mapping(address => uint256) allocations;
}
```

### sales

```solidity
mapping(address => mapping(uint256 => struct LaunchpadModule.Sale)) sales
```

### saleIndexes

```solidity
mapping(address => uint256) saleIndexes
```

### bought

```solidity
mapping(address => mapping(uint256 => mapping(address => bool))) bought
```

### totalBought

```solidity
mapping(address => mapping(uint256 => uint256)) totalBought
```

### InitSale

```solidity
event InitSale(address daoAddress, uint256 saleId, address currency, uint256 rate, bool[4] limits, uint256 _endTimestamp, uint256 _totalSaleAmount, address[] _addWhitelist, uint256[] _allocations, address[] _removeWhitelist)
```

### CloseSale

```solidity
event CloseSale(address daoAddress, uint256 saleId)
```

### Buy

```solidity
event Buy(address daoAddress, uint256 saleId, address buyer, uint256 currencyAmount, uint256 amount)
```

### constructor

```solidity
constructor() public
```

### initialize

```solidity
function initialize() public
```

### setCoreAddresses

```solidity
function setCoreAddresses(contract IFactory _factory, contract IAuction _auction, contract IExitModule _exitModule) external
```

### onlyDao

```solidity
modifier onlyDao()
```

### initSale

```solidity
function initSale(address _currency, uint256 _rate, bool[4] _limits, uint256 _endTimestamp, uint256 _totalSaleAmount, address[] _addWhitelist, uint256[] _allocations, address[] _removeWhitelist) external
```

### fillGovTokenBalance

```solidity
function fillGovTokenBalance(address _dao, uint256 _id) external
```

### closeSale

```solidity
function closeSale() external
```

### burnGovToken

```solidity
function burnGovToken(address _dao, uint256 _id) external
```

### buy

```solidity
function buy(address _dao, uint256 _currencyAmount) external
```

### SaleInfo

```solidity
struct SaleInfo {
  address currency;
  uint256 rate;
  bool isFinite;
  bool isLimitedTotalSaleAmount;
  bool isWhitelist;
  bool isAllocation;
  uint256 endTimestamp;
  uint256 totalSaleAmount;
  address[] whitelist;
  uint256[] allocations;
}
```

### getSaleInfo

```solidity
function getSaleInfo(address _dao, uint256 _saleIndex) external view returns (struct LaunchpadModule.SaleInfo)
```

