# Research Findings Summary

**Date:** April 28, 2026  
**Research Focus:** GMX Protocol Technical Architecture & Smart Contracts  
**Methodology:** Context7 MCP documentation analysis, GitHub repository review

---

## Executive Summary

This document summarizes research findings on GMX protocol's smart contract architecture, development practices, and technical depth. The research was conducted using Context7 to query official GMX Synthetics documentation and related protocols.

---

## Key Findings

### 1. Smart Contract Architecture

**Core Finding:** GMX Synthetics uses a modular peer-to-pool architecture distinct from traditional order book models.

**Key Contracts Identified:**
- **ExchangeRouter** - Central order creation hub
- **OrderHandler** - Executes all order types (~4.9M gas deployment)
- **MarketFactory** - Creates trading markets
- **Oracle** - Off-chain price feed system
- **Config** - Protocol configuration (~8.8M gas deployment)
- Utility contracts: OrderUtils, SwapUtils, AdlUtils, FeeUtils, DecreasePositionUtils

**Architecture Pattern:** 
```
ExchangeRouter → Router → [DepositHandler | OrderHandler | WithdrawalHandler] → Market Pool
```

### 2. Order Execution Model

**Critical Design:** Oracle prices used for execution must be from **after** order creation timestamp.

**Order Types Supported:**
- Market Increase/Decrease
- Limit Increase/Decrease  
- Stop-Loss Decrease
- Market/Limit Swaps (long/short token exchange)

**Execution Timing Rule:**
```
Order created at timestamp 'n'
→ Executed using oracle prices after timestamp 'n'
→ Prevents front-running
```

### 3. Leverage & Risk Management

**Leverage Mechanism:** Peer-to-pool model
- Traders borrow from liquidity pool
- LPs earn fees from trading activity
- Borrowing fees use kink model
- Funding fees balance long/short exposure

**Key Risk Parameters:**
- `minCollateralFactor` - Collateral/position size ratio
- `maxOpenInterest` - Per-market limits
- `maxPnlFactor` - PnL caps
- `reserveFactor` - Pool reserve requirements

**Fee Structure:**
- Position fees (increase/decrease)
- Swap fees
- Borrowing fees (kink model)
- Funding fees (dynamic)

### 4. Synthetics vs Order Book

GMX's Synthetics model differs fundamentally from dYdX-style order books:

| Aspect | GMX Synthetics | Order Book (dYdX) |
|--------|----------------|-------------------|
| Counterparty | Pool (LPs) | Other traders |
| Pricing | Oracle-based | Bid/ask spread |
| Execution | Instant | Order matching |
| Large Trades | Price impact | Better for large |
| Complexity | Lower | Higher |

### 5. Security Approach

**Audit History:**
- Multiple audit rounds with Trail of Bits, OpenZeppelin, Consensys Diligence
- Ongoing security reviews

**Key Security Mechanisms:**
- Oracle deviation checks (MAX_ORACLE_REF_PRICE_DEVIATION_FACTOR)
- Timestamp validation (oracleTimestampAdjustment)
- Role-based access (RoleStore)
- PnL capping factors for different scenarios
- Auto-Deleveraging (ADL) for insolvency

**Common Vulnerability Classes:**
1. Oracle manipulation
2. Reentrancy
3. Integer overflow/underflow
4. Price impact exploitation
5. ADL edge cases
6. Front-running

### 6. Development Workflow

**Tech Stack:**
- **Framework:** Hardhat
- **Language:** Solidity
- **Frontend:** React + TypeScript
- **Indexing:** Subsquid
- **Wallet:** wagmi

**Development Commands:**
```bash
npx hardhat compile   # Compile contracts
npx hardhat test     # Run tests
npx hardhat verify   # Verify on Etherscan
```

**Gas Optimization Patterns:**
- Optimized oracle price storage (uint8 multiplier + uint32/uint64 price)
- Tight struct packing
- View functions for complex calculations
- Library usage for reusable logic

### 7. GMX v2 / Synthetics Updates

**v1 → v2 Evolution:**
- Single GLP pool → Per-market pools
- Market orders only → Market, Limit, Stop orders
- Basic risk mgmt → ADL + multiple PnL factors
- Fixed fees → Dynamic kink model

**New in Synthetics:**
- MarketToken (LP shares per market)
- Long/short tokens (swappable)
- Enhanced oracle with TWAP
- Improved ADL mechanism

### 8. Key Deployment Addresses (Arbitrum)

| Contract | Purpose |
|----------|---------|
| `0x00db21077c63FFf542c017Cc4cDCC84229BFb373` | OrderHandler |
| `0x5798C098Fbf24762c12F1594938b68aC7De57aE0` | SwapUtils |
| `0xcEDb49aF57a6f54Aba32bEC76389d53AE568DD07` | OrderUtils |
| `0x13c986424DeD8D78d9313dD90cD847E4DeBA5Cb3` | Oracle |
| `0xC2D6cC2B5444b2d3611d812A9EA47648CfFc05c1` | Config |

---

## Recommendations for Technical Interviews

### What Will Impress:
1. **Deep protocol understanding** - Can trace order flow end-to-end
2. **Security mindset** - Understands manipulation vectors, can analyze risk
3. **Gas optimization awareness** - Knows storage vs memory tradeoffs
4. **DeFi mechanics** - Funding rates, PnL calculations, ADL mechanism
5. **Quality code samples** - Clean, documented, well-tested

### Valued Code Contributions:
- Bug fixes with detailed analysis
- Gas optimizations with benchmarks
- Test coverage improvements
- Documentation enhancements
- Security improvements

### Team Values:
- Security-first mentality
- Simple over complex solutions
- Comprehensive testing
- Async, remote-first culture
- Long-term protocol thinking

---

## Documents Produced

1. **`gmx_technical_deep_dive.md`** - Comprehensive technical document covering:
   - Smart contract architecture
   - Order execution flow
   - Leverage mechanism
   - Synthetics vs order book comparison
   - Deployment addresses
   - Security considerations
   - Development workflow
   - Gas optimizations
   - Job application guide
   - v1 vs v2 differences

2. **`research_findings_summary.md`** - This summary document

---

## Data Sources

- GMX Synthetics GitHub (`gmx-io/gmx-synthetics`)
- GMX Interface GitHub (`gmx-io/gmx-interface`)
- Uniswap V3 Core (`uniswap/v3-core`)
- Context7 MCP tool queries

---

*Research completed: April 28, 2026*
