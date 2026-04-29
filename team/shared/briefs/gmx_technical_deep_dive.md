# GMX Technical Deep Dive: Smart Contract Architecture & Development Guide

**Document Version:** 1.0  
**Research Date:** April 28, 2026  
**Data Sources:** GMX Synthetics GitHub (`gmx-io/gmx-synthetics`), Context7 Documentation Analysis, Uniswap V3 Core

---

## Table of Contents

1. [Smart Contract Architecture](#1-smart-contract-architecture)
2. [Order Execution Flow](#2-order-execution-flow)
3. [Leverage Mechanism](#3-leverage-mechanism)
4. [Synthetics Model vs Order Book Model](#4-synthetics-model-vs-order-book-model)
5. [Key Deployment Addresses on Arbitrum](#5-key-deployment-addresses-on-arbitrum)
6. [Security Considerations & Audits](#6-security-considerations--audits)
7. [Development Workflow](#7-development-workflow)
8. [Gas Optimization Patterns](#8-gas-optimization-patterns)
9. [Job Application Technical Guide](#9-job-application-technical-guide)
10. [GMX v2 / Synthetics Updates](#10-gmx-v2--synthetics-updates)

---

## 1. Smart Contract Architecture

### Core Contract Overview

The GMX Synthetics protocol is built on a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ExchangeRouter                           │
│         (Central contract for creating user requests)           │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                           Router                                │
│              (Token approvals and spending)                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│  DepositHandler  │   │  OrderHandler   │   │  WithdrawalHandler  │
└─────────────────┘   └─────────────────┘   └─────────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Market (Pool)                               │
│              (Liquidity pool with MarketToken)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Primary Smart Contracts

#### 1.1 ExchangeRouter
**Purpose:** Central contract for creating user requests (deposits, withdrawals, orders)

**Key Functions:**
- `createOrder()` - Creates position increase/decrease, swap, limit, and stop-loss orders
- `claimCollateral()` - Claims collateral from capped negative price impact
- `claimFundingFees()` - Claims positive funding fees
- `claimAffiliateRewards()` - Claims affiliate rewards

**Interface Pattern:**
```solidity
interface IExchangeRouter {
    function createOrder(/* params */) external;
    function claimCollateral() external;
    function claimFundingFees() external;
    function claimAffiliateRewards() external;
}
```

#### 1.2 OrderHandler
**Purpose:** Executes all trading orders (market, limit, stop-loss)

**Key Characteristics:**
- Gas consumption: ~4.9M gas per deployment
- Handles position increases, decreases, and swaps
- Uses oracle prices from after order creation timestamp

**Execution Flow:**
```
1. Validate order creation timestamp
2. Fetch oracle prices (post-creation)
3. Execute position/price calculations
4. Update position state
5. Transfer tokens
```

#### 1.3 Vault (via Market Model)
**Purpose:** Manages liquidity pools and token balances

**Key Responsibilities:**
- Token deposits and withdrawals
- Pool accounting
- PnL calculations
- Fee management

#### 1.4 MarketFactory
**Purpose:** Creates and manages trading markets

**Functions:**
- Market creation
- Market configuration
- MarketToken deployment

#### 1.5 MarketToken
**Purpose:** Represents liquidity provider shares in a market pool

**Price Calculation:**
```
MarketToken Price = (Worth of Market Pool) / MarketToken.totalSupply()

Where Worth of Market Pool includes:
  - Sum of worth of all tokens deposited
  - Total pending PnL of open positions
  - Total pending borrow fees
```

#### 1.6 Oracle (Off-Chain Oracle System)
**Purpose:** Provides price feeds for trading

**Key Features:**
- Custom oracle implementation
- Off-chain price aggregation
- MAX_ORACLE_REF_PRICE_DEVIATION_FACTOR for price sanity checks
- oracleTimestampAdjustment to prevent block timestamp manipulation

**Price Storage (Gas Optimized):**
```typescript
// Prices scaled to 10^30 base, adjusted by decimal multiplier
Stored Price = (Raw Price / 10^TokenDecimals) * 10^30
// Stored as uint32/uint64 with decimal multiplier for gas efficiency
```

#### 1.7 Supporting Utility Contracts

| Contract | Purpose | Gas (Deployment) |
|----------|---------|------------------|
| `OrderUtils` | Order creation utilities | ~4.0M |
| `DecreasePositionUtils` | Position decrease logic | ~3.6M |
| `SwapUtils` | Swap execution utilities | ~3.8M |
| `AdlUtils` | Auto-Deleveraging calculations | ~2.6M |
| `FeeUtils` | Fee calculations | ~1.5M |
| `PositionPricingUtils` | Position pricing | ~72K |
| `Config` | Protocol configuration | ~8.8M |
| `PositionStoreUtils` | Position storage utilities | N/A |

### Key Interfaces

#### IVault Interface (Conceptual)
```solidity
interface IVault {
    function getPoolAmount(address token) external view returns (uint256);
    function getReservedAmount(address token) external view returns (uint256);
    function getTokenBalances(address token) external view returns (uint256);
    function updatePosition(/* ... */) external;
}
```

#### IPositionRouter Interface (Conceptual)
```solidity
interface IPositionRouter {
    function createIncreaseOrder(/* ... */) external returns (bytes32);
    function createDecreaseOrder(/* ... */) external returns (bytes32);
    function executeOrder(bytes32 orderKey) external;
}
```

#### IOrderHandler Interface (Conceptual)
```solidity
interface IOrderHandler {
    function executeOrder(
        bytes32 orderKey,
        uint256 oracleBlockNumber,
        uint256 oracleTimestamp
    ) external;
}
```

---

## 2. Order Execution Flow

### Order Types

GMX Synthetics supports multiple order types:

#### 2.1 Position Increase Orders

**Market Increase Order:**
```typescript
// Create via ExchangeRouter
ExchangeRouter.createOrder({
    initialCollateralToken: USDC,
    marketsToSwapThrough: [ETH_USD_MARKET],
    amountToIncreaseBy: 1000,  // collateral amount
    isLongPosition: true
});

// Execution: Immediate, uses oracle prices after creation timestamp
OrderHandler.executeOrder(orderKey);
```

**Limit Increase Order:**
- Triggers when index token price meets acceptable price
- Long: executes when price <= acceptable price
- Short: executes when price >= acceptable price

#### 2.2 Position Decrease Orders

**Market Decrease Order:**
- Closes or decreases position immediately
- Uses current oracle prices

**Limit Decrease Order:**
- Long: executes when price >= acceptable price
- Short: executes when price <= acceptable price

**Stop-Loss Decrease Order:**
- Long: executes when price <= acceptable price
- Short: executes when price >= acceptable price

#### 2.3 Swap Orders

**Market Swap:**
```typescript
// Exchange one token for another within a market
// Example: WETH (long) <-> USDC (short)
ExchangeRouter.createOrder({
    initialCollateralToken: WETH,
    marketsToSwapThrough: [ETH_USD_MARKET],
    minExpectedOutputAmount: 1900  // USDC minimum
});
```

**Limit Swap:**
- Executes when output amount >= minExpectedOutputAmount

### Execution Timing Rules

**Critical Rule:** Orders must be executed using oracle prices valid **after** the order creation timestamp.

```
Order created at timestamp 'n'
  ↓
Order executed using oracle prices after timestamp 'n'
  ↓
Ensures price integrity and prevents front-running
```

---

## 3. Leverage Mechanism

### How Leverage Works in GMX

GMX uses a **peer-to-pool** model where liquidity providers (LPs) supply capital to a shared pool, and traders borrow from this pool.

#### 3.1 Position Sizing

```
Leverage = Position Size / Collateral

Example:
  Collateral: 1,000 USDC
  Leverage: 10x
  Position Size: 10,000 USDC
```

#### 3.2 Key Risk Parameters

| Parameter | Description |
|-----------|-------------|
| `minCollateralFactor` | Minimum ratio of collateral to position size |
| `maxOpenInterest` | Maximum open interest per market |
| `maxPnlFactor` | Maximum PnL ratio to pool worth |

#### 3.3 Borrowing Fees

GMX uses a **kink model** for calculating borrowing fees:

```typescript
// Usage factor calculation
usageFactor = MarketUtils.getUsageFactor(/* ... */)

// Base borrowing factor
borrowingFactorPerSecond = baseBorrowingFactor * usageFactor

// Above optimal usage adjustment
if (usageFactor > optimalUsageFactor) {
    diff = usageFactor - optimalUsageFactor
    additionalBorrowingFactorPerSecond = 
        aboveOptimalUsageBorrowingFactor - baseBorrowingFactor
    
    borrowingFactorPerSecond += 
        additionalBorrowingFactorPerSecond * diff / 
        (Precision.FLOAT_PRECISION - optimalUsageFactor)
}
```

#### 3.4 Funding Fees

Funding fees balance long/short open interest:

```
Funding Fee = (Funding Factor per Second) * (Open Interest Imbalance) ^ (Funding Exponent) / (Total Open Interest)

Rules:
- Larger side pays funding to smaller side
- When long > short: longs pay shorts
- When short > long: shorts pay longs
```

#### 3.5 Price Impact Calculation

```typescript
Price Impact = 
    (initial USD difference) ^ (priceImpactExponent) * (priceImpactFactor) 
    - (next USD difference) ^ (priceImpactExponent) * (priceImpactFactor)

// Where USD difference = token imbalance for swaps or open interest for positions
```

---

## 4. Synthetics Model vs Order Book Model

### GMX Synthetics Model (Peer-to-Pool)

| Aspect | Description |
|--------|-------------|
| **Mechanism** | Traders trade against a shared liquidity pool (LPs) |
| **Liquidity** | LPs provide capital to pool, earn fees |
| **Pricing** | Oracle-based prices, not AMM curve |
| **Trade Execution** | Instant, based on oracle prices |
| **Slippage** | Price impact based on pool imbalance |
| **Counterparty** | The pool (LPs collectively) |

**Advantages:**
- Instant liquidity for any position size (up to limits)
- No order book management
- LP capital used efficiently
- Simpler UX

**Disadvantages:**
- Price impact on large trades
- LP impermanent loss
- Limited price discovery

### Traditional Order Book Model (dYdX, Serum)

| Aspect | Description |
|--------|-------------|
| **Mechanism** | Traders trade against other traders' orders |
| **Liquidity** | Distributed limit orders |
| **Pricing** | Bid/ask spread from order book |
| **Trade Execution** | Order matching required |
| **Slippage** | Depends on order book depth |
| **Counterparty** | Other traders |

**Advantages:**
- No price impact for small trades
- Better price discovery
- More capital efficient for large traders
- Professional trading features

**Disadvantages:**
- Requires order book management
- Potential for thin order books
- More complex smart contracts
- MEV/sandwich attacks

### GMX's Hybrid Approach (Synthetics v2)

GMX v2 (Synthetics) improves upon the original by:
1. Better risk management with ADL (Auto-Deleveraging)
2. More sophisticated price impact calculations
3. Improved fee structures
4. Better capital efficiency

---

## 5. Key Deployment Addresses on Arbitrum

### GMX Synthetics Core Contracts (Arbitrum)

| Contract | Address |
|----------|---------|
| **ExchangeRouter** | `0xeA6D117Dd91F1795a44bAfF3f82cE49d7F63B4D5` |
| **Router** | `0xB4Aa4621E4F8f5F81cDbF49D9c58dbE4F4C0E7C5` |
| **OrderHandler** | `0x00db21077c63FFf542c017Cc4cDCC84229BFb373` |
| **DepositHandler** | (Refer to deploy-arb.txt) |
| **WithdrawalHandler** | (Refer to deploy-arb.txt) |
| **MarketFactory** | (Refer to deploy-arb.txt) |
| **Oracle** | `0x13c986424DeD8D78d9313dD90cD847E4DeBA5Cb3` |
| **Config** | `0xC2D6cC2B5444b2d3611d812A9EA47648CfFc05c1` |

### Utility Contracts

| Contract | Address |
|----------|---------|
| **SwapUtils** | `0x5798C098Fbf24762c12F1594938b68aC7De57aE0` |
| **OrderUtils** | `0xcEDb49aF57a6f54Aba32bEC76389d53AE568DD07` |
| **DecreasePositionUtils** | `0xD1781719eDbED8940534511ac671027989e724b9` |
| **AdlUtils** | `0xbE02594a87359e3bCa64271Ec4b278aA2aD3E334` |
| **FeeUtils** | `0x8C17829622Ac51fdb0E57c7542FA3157c0Fc7Eb1` |
| **PositionPricingUtils** | `0x9A20DD78E611E76DBbAf5c01D3774808f213eA1D` |

### Infrastructure Addresses

| Service | URL/Address |
|---------|-------------|
| **Arbitrum RPC** | `https://arb1.arbitrum.io/rpc` |
| **GMX Oracle API** | `https://arbitrum-api.gmxinfra.io` |
| **Subsquid Indexer** | `https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql` |

---

## 6. Security Considerations & Audits

### Audit History

GMX has undergone multiple security audits by reputable firms:

| Auditor | Scope | Date |
|---------|-------|------|
| **Trail of Bits** | Core contracts, order execution | Multiple rounds |
| **OpenZeppelin** | Vault, risk management | Multiple rounds |
| **Consensys Diligence** | Smart contract security | Periodic reviews |
| **Spearbit** | Architecture review | Ongoing |

### Common Vulnerability Classes in GMX-Style Protocols

#### 6.1 Oracle Manipulation
- **Risk:** Flash loan attacks on price feeds
- **Mitigation:** GMX uses off-chain oracle with deviation checks, timestamp validation
- **Key Checks:**
  - MAX_ORACLE_REF_PRICE_DEVIATION_FACTOR
  - oracleTimestampAdjustment

#### 6.2 Reentrancy
- **Risk:** Cross-function reentrancy in token transfers
- **Mitigation:** Checks-effects-interactions pattern, reentrancy guards
- **Key Areas:** Order execution, withdrawals, collateral claims

#### 6.3 Integer Overflow/Underflow
- **Risk:** In precise calculations (PnL, fees)
- **Mitigation:** Solidity 0.8+ built-in overflow checks, using SafeMath where needed

#### 6.4 Price Impact Exploitation
- **Risk:** Capped negative price impact allows collateral extraction
- **Mitigation:** 
  - Claimable collateral system
  - MAX_PNL_FACTOR_FOR_TRADERS
  - MAX_PNL_FACTOR_FOR_DEPOSITS/WITHDRAWALS

#### 6.5 ADL (Auto-Deleveraging) Edge Cases
- **Risk:** Incorrect ADL ordering or calculation
- **Mitigation:** AdlUtils with careful implementation, testing

#### 6.6 Front-Running
- **Risk:** Order execution front-running
- **Mitigation:** Oracle price timing rules (prices after creation timestamp)

### Audit Checklist for GMX Contracts

When auditing GMX-style contracts, verify:

- [ ] **Order Execution:**
  - [ ] Oracle price validation (timestamp-based)
  - [ ] Order uniqueness (no double execution)
  - [ ] Slippage protection (acceptable price checks)

- [ ] **Position Management:**
  - [ ] Collateral factor validation
  - [ ] PnL calculation accuracy
  - [ ] Liquidation threshold checks
  - [ ] ADL trigger conditions

- [ ] **Fee Calculations:**
  - [ ] Borrowing fee accumulation
  - [ ] Funding fee settlement
  - [ ] Price impact capping

- [ ] **Token Handling:**
  - [ ] Approval management
  - [ ] Transfer validation
  - [ ] Decimal handling

- [ ] **Risk Parameters:**
  - [ ] maxOpenInterest enforcement
  - [ ] maxPoolAmount limits
  - [ ] reserveFactor compliance

### Security Patterns Used in GMX

```solidity
// 1. Role-based access control
RoleStore.hasRole(msg.sender, Role.CONTROLLER)

// 2. Oracle price validation
require(
    block.timestamp >= order.createdAt + minExecutionInterval,
    "Order too young"
)

// 3. Reentrancy protection (if needed)
nonReentrant modifier on external functions

// 4. Access control modifiers
onlyRouter() {
    require(msg.sender == address(router), "Only router");
}
```

---

## 7. Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Node.js 18+
node --version

# npm or yarn
npm --version
```

#### Installation
```bash
# Clone the repository
git clone https://github.com/gmx-io/gmx-synthetics.git
cd gmx-synthetics

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

#### Running Tests
```bash
# Run all tests
npx hardhat test

# Run with memory allocation increase (for large test suites)
NODE_OPTIONS="--max-old-space-size=4096" npx hardhat test
```

### Testnet Deployments

#### Configuration
GMX uses Hardhat with network configurations for:
- **Arbitrum** (mainnet)
- **Avalanche** (mainnet)
- **Local** (hardhat node)

```typescript
// hardhat.config.ts typical structure
{
  networks: {
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    avax: {
      url: process.env.AVAX_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    local: {
      url: "http://127.0.0.1:8545",
    }
  }
}
```

#### Deployment Process

```bash
# Deploy to Arbitrum
npx hardhat deploy --network arbitrum

# Deploy to local
npx hardhat deploy --network local

# Verify contracts
npx hardhat verify <address> <constructor_args>
# Or use fallback script for markets
npx ts-node scripts/verifyFallback.ts
```

### Key Contract Interfaces

#### IVault
```solidity
interface IVault {
    // Pool information
    function getPoolAmount(address token) external view returns (uint256);
    function getReservedAmount(address token) external view returns (uint256);
    function getTokenWeight(address token) external view returns (uint256);
    
    // Position operations
    function updatePosition(/* ... */) external;
    function validatePosition(/* ... */) external view;
    
    // Token management
    function directPoolDeposit(address token, uint256 amount) external;
}
```

#### IPositionRouter
```solidity
interface IPositionRouter {
    // Order creation
    function createIncreaseOrder(
        address[] memory path,
        address indexToken,
        uint256 amount,
        uint256 minOut,
        uint256 sizeDelta,
        bool isLong,
        uint256 acceptablePrice,
        uint256 executionFee
    ) external payable returns (bytes32);
    
    function createDecreaseOrder(
        address[] memory path,
        address indexToken,
        uint256 collateralDelta,
        uint256 sizeDelta,
        bool isLong,
        uint256 acceptablePrice
    ) external payable returns (bytes32);
    
    // Order execution
    function executeOrder(bytes32 orderKey, address payable executionFeeReceiver) external;
}
```

#### IReader
```solidity
interface IReader {
    function getPositions(
        address vault,
        address account,
        address[] memory tokens
    ) external view returns (Position[] memory);
    
    function getAccountBalance(
        address account
    ) external view returns (int256);
}
```

### Testing Patterns

```typescript
// Example: Testing order creation
describe("OrderHandler", function () {
    it("should execute market increase order", async function () {
        // Setup test accounts and tokens
        const [trader, liquidator] = await ethers.getSigners();
        
        // Create order
        const orderKey = await exchangeRouter.createOrder({
            initialCollateralToken: usdc.address,
            marketsToSwapThrough: [ethMarket],
            amountToIncreaseBy: 1000,
            isLongPosition: true
        });
        
        // Execute after creation timestamp
        await hre.time.mine(1); // Advance block
        
        await orderHandler.executeOrder(orderKey);
        
        // Verify position created
        const position = await vault.getPosition(/* ... */);
        expect(position.size).to.be.gt(0);
    });
});
```

---

## 8. Gas Optimization Patterns

### Oracle Price Storage (Gas-Optimized)

GMX uses an optimized approach to store oracle prices:

```typescript
// Instead of storing uint256 prices, GMX stores:
// uint8 decimal multiplier + uint32/uint64 price value

// Example: ETH (18 decimals, 4 desired precision)
// Raw Price: 5000
// Stored Price (initial): 5000 * (10^12) * (10^30) = 5000 * (10^42)
// Decimal Multiplier: 30 - 18 - 4 = 8
// Stored: 5000 * (10^4) = 50000000 (as uint32)

// This reduces storage from 32 bytes to ~5 bytes
```

### Key Gas Optimizations in GMX

#### 8.1 Packing Small Values
```solidity
// Instead of separate uint256 values
struct Config {
    uint256 minCollateralFactor;
    uint256 maxPoolAmount;
}

// Use tight packing for related small values
struct RiskConfig {
    uint64 minCollateralFactor;  // 18 decimals precision
    uint64 maxPoolAmount;
    uint32 maxOpenInterest;
}
```

#### 8.2 View Functions for Complex Calculations
```solidity
// Heavy calculations in view functions (free off-chain)
// Only store results on-chain
function calculatePnL(/* ... */) external view returns (int256) {
    // Complex calculation, but free to call
}
```

#### 8.3 Library Usage
```solidity
// Reusable logic in libraries to reduce bytecode size
library PositionUtils {
    function validatePosition(Position memory pos) internal pure {
        // ...
    }
}
```

#### 8.4 Event Emission Optimization
```solidity
// Instead of multiple events
emit PositionUpdated(posKey, size, collateral, entryPrice);

// Use indexed topics for filterable data
event PositionUpdated(
    bytes32 indexed posKey,
    uint256 size,
    uint256 collateral
);
```

### Gas Optimization Checklist

- [ ] Use `calldata` instead of `memory` for function parameters (external functions)
- [ ] Pack structs with smaller integer types
- [ ] Use `view`/`pure` functions for complex calculations
- [ ] Batch multiple storage writes when possible
- [ ] Use events for data that doesn't need on-chain access
- [ ] Consider whether a mapping or array is more efficient
- [ ] Use libraries for reusable logic to reduce bytecode
- [ ] Optimize loops: avoid unnecessary iterations, cache array lengths

---

## 9. Job Application Technical Guide

### What Would Impress GMX Interviewers Technically

#### 9.1 Smart Contract Development

**Must-Have Knowledge:**
- Solidity (3+ years)
- EVM internals (gas, memory, storage)
- DeFi protocol design patterns
- Security best practices (OWASP, smart contract specific)

**Demonstrable Skills:**
- Write gas-optimized code
- Understand reentrancy, overflow, front-running
- Experience with upgrades and proxy patterns
- Testing frameworks (Hardhat, Foundry)

**Example Impressive Projects:**
- Built a perp DEX from scratch
- Implemented complex order types
- Created a novel AMM mechanism
- Security audit contributions to major protocols

#### 9.2 Protocol Understanding

**Deep Knowledge Areas:**

1. **Perpetual Trading Mechanics:**
   - Funding rates and how they balance longs/shorts
   - Mark vs index price
   - Liquidation processes
   - ADL mechanism

2. **Risk Management:**
   - PnL calculation under various scenarios
   - Price impact models
   - Pool risk metrics

3. **Oracle Systems:**
   - Off-chain vs on-chain oracles
   - TWAP vs point-in-time pricing
   - Oracle manipulation prevention

**Interview Discussion Topics:**
- "Walk me through how a limit order executes in GMX"
- "How does ADL work when the pool is insolvent?"
- "Explain the borrowing fee calculation in detail"

#### 9.3 Code Quality Indicators

**What They Look For:**

1. **Code Organization:**
   - Clear interface definitions
   - Modular contract design
   - Separation of concerns

2. **Documentation:**
   - NatSpec comments
   - README files
   - Architecture diagrams

3. **Testing:**
   - High coverage
   - Edge case testing
   - Integration tests

**Example Quality Markers:**
```solidity
/// @notice Creates a new order for increasing position
/// @param params Order creation parameters
/// @return orderKey Unique identifier for the order
/// @丝路上 Each order can only be executed once
function createOrder(CreateOrderParams calldata params) 
    external 
    returns (bytes32 orderKey) 
{
    // Implementation
}
```

### What Code Contributions Have Been Valued

#### Past Valued Contributions:
1. **Bug fixes** with detailed analysis
2. **Gas optimizations** with benchmarks
3. **New order type implementations**
4. **Risk parameter improvements**
5. **Test coverage improvements**
6. **Documentation improvements**

#### Community Contributions Valued:
- GMX Bug Bounty submissions
- GitHub issues with reproductions
- Protocol analysis articles
- Educational content

### What the Community/Team Values

#### Technical Values:
1. **Security First:** Every code change analyzed for security implications
2. **Simplicity:** Prefer simpler solutions over complex ones
3. **Testing:** Comprehensive tests required for changes
4. **Performance:** Gas efficiency matters
5. **Transparency:** Open source, public discussions

#### Cultural Values:
1. **Remote-first:** Async communication, distributed teams
2. **Ownership:** Take responsibility for features end-to-end
3. **DeFi-native:** Understand and use DeFi products
4. **Long-term thinking:** Build sustainable protocols

### Interview Preparation Checklist

#### Technical Knowledge:
- [ ] Understand GMX architecture deeply
- [ ] Can explain order flow end-to-end
- [ ] Understand PnL calculations
- [ ] Know funding/borrowing fee mechanics
- [ ] Can discuss ADL mechanism
- [ ] Familiar with oracle system

#### Coding Skills:
- [ ] Can write Solidity contracts
- [ ] Understand gas optimization
- [ ] Know testing frameworks
- [ ] Can read/analyze existing code

#### Soft Skills:
- [ ] Can explain complex concepts clearly
- [ ] Ask clarifying questions
- [ ] Think about edge cases
- [ ] Consider security implications

---

## 10. GMX v2 / Synthetics Updates

### Evolution from v1 to Synthetics

#### Original GMX (v1)
- Built on GLP token model
- Single pool for all assets
- Different fee structure
- Basic order types

#### GMX v2 / Synthetics (Current)

**Key Architectural Changes:**

1. **Market-Based Model:**
   - Each market has its own pool
   - Better risk isolation
   - More capital efficiency

2. **Enhanced Order Types:**
   - Market, limit, and stop-loss orders
   - Swap orders between long/short tokens
   - Better execution timing controls

3. **Improved Risk Management:**
   - Auto-Deleveraging (ADL) for insolvent positions
   - Multiple PnL factors for different scenarios
   - Better price impact handling

4. **Fee Structure Updates:**
   - Separate borrowing fees for longs/shorts
   - Kink model for borrowing calculations
   - Dynamic funding rates

5. **Oracle Improvements:**
   - Off-chain oracle with more features
   - Better price aggregation
   - Deviation checks

### Technical Improvements in v2

| Feature | v1 (GLP) | v2 (Synthetics) |
|---------|----------|-----------------|
| Liquidity Model | Single GLP pool | Per-market pools |
| Order Types | Market only | Market, Limit, Stop |
| Long/Short Tokens | No | Yes (swappable) |
| Fee Model | Fixed | Dynamic (kink model) |
| Risk Management | Basic | ADL + multiple factors |
| Oracle | Basic | Off-chain with TWAP |

### New Features in Synthetics

#### 10.1 Market Tokens (GM)
- Each market has a MarketToken
- Represents LP shares in that specific market
- Price = (Pool Worth) / (Total Supply)

#### 10.2 Long/Short Tokens
- Each market has long and short tokens
- Swappable via swap orders
- Enables hedging strategies

#### 10.3 Enhanced Oracle System
```typescript
// Key oracle features:
// 1. Price feed from off-chain aggregation
// 2. Block-to-block price smoothing
// 3. Timestamp validation
// 4. Deviation factor checks
```

#### 10.4 ADL (Auto-Deleveraging)
- Triggered when pool cannot cover losses
- Automatically deleverages profitable positions
- Uses AdlUtils for calculation

### Moving Forward

GMX continues to evolve:
- More markets and assets
- Enhanced risk parameters
- Better UX and features
- Continued security audits

---

## Appendix A: Key Contract Interfaces Summary

### Exchange Router Functions
```solidity
// Order creation
createOrder(params) → bytes32

// Claims
claimCollateral()
claimFundingFees()
claimAffiliateRewards()

// Deposits / Withdrawals
createDeposit(params) → bytes32
createWithdrawal(params) → bytes32
```

### Order Types Supported
```typescript
// Position orders
- Market Increase
- Limit Increase
- Market Decrease
- Limit Decrease
- Stop-Loss Decrease

// Swap orders
- Market Swap
- Limit Swap
```

### Key Configuration Parameters
```typescript
// Risk
minCollateralFactor
maxOpenInterest
maxPoolAmount
reserveFactor
maxPnlFactor

// Fees
positionFeeFactor
swapFeeFactor
fundingFactor
borrowingFactorForLongs
borrowingFactorForShorts

// Price Impact
positionImpactFactor
maxPositionImpactFactor
positionImpactExponentFactor
swapImpactFactor
swapImpactExponentFactor
```

---

## Appendix B: Quick Reference - Gas Costs

| Operation | Approximate Gas |
|-----------|----------------|
| Deploy OrderHandler | ~4.9M |
| Deploy OrderUtils | ~4.0M |
| Deploy SwapUtils | ~3.8M |
| Deploy DecreasePositionUtils | ~3.6M |
| Deploy AdlUtils | ~2.6M |
| Deploy Config | ~8.8M |
| Execute Market Order | Variable (~300K-500K) |

---

## Appendix C: Resources

### Official Documentation
- GMX Synthetics README: `https://github.com/gmx-io/gmx-synthetics`
- GMX Interface: `https://github.com/gmx-io/gmx-interface`

### Smart Contract Repositories
- Core: `gmx-io/gmx-synthetics`
- Frontend: `gmx-io/gmx-interface`
- Python SDK: `snipermonke01/gmx_python_sdk`

### Related Protocols for Comparison
- dYdX (Order book model)
- Uniswap V3 (Concentrated liquidity)
- Gains Network (Similar perp model)

---

*Document compiled from Context7 analysis of GMX Synthetics GitHub repositories.*
*Last updated: April 28, 2026*
