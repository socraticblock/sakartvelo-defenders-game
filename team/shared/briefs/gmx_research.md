# GMX Protocol (gmx.io) - Comprehensive Research Document

**Research Date:** April 28, 2026  
**Last Updated:** April 28, 2026  
**Data Sources:** GMX GitHub (gmx-io/gmx-synthetics, gmx-io/gmx-interface), Context7 Documentation Analysis

---

## Table of Contents
1. [Company & Protocol Overview](#1-company--protocol-overview)
2. [Tech Stack](#2-tech-stack)
3. [Team & Hiring](#3-team--hiring)
4. [Job Roles for Developers](#4-job-roles-for-developers)
5. [Application Strategy](#5-application-strategy)
6. [Competition Analysis](#6-competition-analysis)

---

## 1. Company & Protocol Overview

### What is GMX?

GMX is a decentralized perpetual trading protocol that enables permissionless spot and perpetual trading with leverage. The protocol operates as a non-custodial trading platform where users can trade with up to 50x leverage on various asset pairs.

### How GMX Works (Architecture)

GMX is built on two primary blockchains:
- **Arbitrum One** (Primary network)
- **Avalanche** (Secondary network)

#### Core Protocol Architecture

The GMX Synthetics protocol consists of several key smart contracts:

1. **MarketFactory** - Creates new trading markets
2. **MarketToken** - Represents liquidity provider shares in a market pool
3. **ExchangeRouter** - Central contract for creating user requests (deposits, withdrawals, orders)
4. **Router** - Used for token approvals and spending
5. **DepositHandler** - Executes deposit requests
6. **WithdrawalHandler** - Executes withdrawal requests
7. **OrderHandler** - Executes trading orders
8. **Oracle** - Provides price feeds (off-chain oracle system)
9. **Config** - Protocol configuration

#### Key Smart Contracts (from deployment logs):
- Oracle: `0x13c986424DeD8D78d9313dD90cD847E4DeBA5Cb3`
- SwapUtils: `0x5798C098Fbf24762c12F1594938b68aC7De57aE0`
- OrderHandler: `0x00db21077c63FFf542c017Cc4cDCC84229BFb373`
- OrderUtils: `0xcEDb49aF57a6f54Aba32bEC76389d53AE568DD07`
- DecreasePositionUtils: `0xD1781719eDbED8940534511ac671027989e724b9`
- AdlUtils: `0xbE02594a87359e3bCa64271Ec4b278aA2aD3E334`
- PositionStoreUtils: `0xD514670F6697345735d5602E9db4FAdfBcd92e9e`
- Config: `0xC2D6cC2B5444b2d3611d812A9EA47648CfFc05c1`

### Tokenomics

#### GM Token
- **Purpose:** Governance token and utility token for the GMX ecosystem
- **Utility:** Staking, governance participation, fee discounts

#### Market Token (GM)
- Represents liquidity provider shares in specific markets
- Price calculation: `(worth of market pool) / MarketToken.totalSupply()`
- Worth of Market Pool includes:
  - Sum of worth of all tokens deposited
  - Total pending PnL of all open positions
  - Total pending borrow fees

### Revenue Model

GMX generates revenue through:

1. **Position Fees** - Fees deducted for position increase/decrease actions based on position size
2. **Swap Fees** - Fees deducted for token swaps based on swap amount
3. **Borrowing Fees** - Fees charged to traders for borrowing funds
   - Uses curve model or kink model for calculation
   - Formula: `borrowingFactorPerSecond = borrowingFactor * reservedUsdAfterExponent / poolUsd`
4. **Funding Fees** - Dynamic fees to balance long/short positions
   - Larger side pays funding to smaller side
   - Formula: `(funding factor per second) * (open interest imbalance) ^ (funding exponent factor) / (total open interest)`
5. **Price Impact Fees** - Fees from market impact

### Key Configuration Parameters

**Risk Parameters:**
- `minCollateralFactor` - Minimum ratio of collateral to position size
- `maxPoolAmount` - Maximum tokens in a market pool
- `maxOpenInterest` - Maximum open interest per market
- `reserveFactor` - Maximum ratio of reserved tokens to pool tokens
- `maxPnlFactor` - Maximum PnL ratio to pool worth

**Fee Parameters:**
- `positionFeeFactor` - Position increase/decrease fees
- `swapFeeFactor` - Swap fees
- `fundingFactor` - Funding rate factor
- `borrowingFactorForLongs/Shorts` - Borrowing fees
- `borrowingExponentFactorForLongs/Shorts` - Borrowing exponent

**Price Impact Parameters:**
- `positionImpactFactor` - Position price impact
- `maxPositionImpactFactor` - Max price impact for positions
- `positionImpactExponentFactor` - Position price impact exponent
- `swapImpactFactor` - Swap price impact
- `swapImpactExponentFactor` - Swap price impact exponent

### Founders & Key People

*Note: Due to web search limitations, detailed founder information could not be retrieved. The GMX protocol is associated with the broader DeFi ecosystem and has been developed by an anonymous/ pseudonymous team common in DeFi projects.*

### Headquarters & Employees

*Information not publicly available. GMX appears to operate as a distributed/remote team.*

---

## 2. Tech Stack

### Blockchain Layer
- **Primary Chain:** Arbitrum One (Layer 2)
- **Secondary Chain:** Avalanche (C-Chain)
- **Smart Contract Language:** Solidity

### Smart Contracts

Core contracts are written in **Solidity** and deployed using Hardhat:

```
Framework: Hardhat
Verification: Hardhat verify + custom verifyFallback.ts script
```

**Key Contract Types:**
- MarketFactory
- MarketToken  
- ExchangeRouter
- Router
- DepositHandler
- WithdrawalHandler
- OrderHandler
- Oracle
- Config
- PositionStoreUtils
- OrderUtils
- DecreasePositionUtils
- AdlUtils
- SwapUtils

### Frontend Stack

**Framework:** React (TypeScript)

**Key Libraries:**
- `wagmi` - Ethereum wallet connection
- `@tanstack/react-query` - Data fetching
- TypeScript for type safety

**Architecture Pattern:**
- Custom hooks for state logic
- Domain-based organization (tokens, exchange, etc.)
- Component structure following recommended order:
  1. Imports
  2. Props interface
  3. State declarations
  4. Custom hooks
  5. Effects
  6. Async functions
  7. Render/return

### SDK

**GMX SDK** (`@gmx-io/sdk`)

Configuration interface:
```typescript
interface GmxSdkConfig {
  chainId: number;
  rpcUrl: string;
  oracleUrl: string;
  subsquidUrl?: string;
  account?: string;
  publicClient: PublicClient;
  walletClient: WalletClient;
  tokens?: Record<string, Partial<Token>>;
  markets?: Record<string, { isListed: boolean }>;
}
```

**SDK API Methods:**
- `getMarkets()` - Get paginated markets
- `getMarketsInfo()` - Get detailed market info
- `getDailyVolumes()` - Get trading volumes
- `getPositions()` - Get user positions
- `getTokensData()` - Get token information
- `getOrders()` - Get pending orders
- `getTradeHistory()` - Get trade history
- Order methods: `long()`, `short()`, `swap()`, `createIncreaseOrder()`, `createDecreaseOrder()`, `createSwapOrder()`, `cancelOrders()`

### Backend/Infrastructure

**RPC Providers:**
- Arbitrum: `https://arb1.arbitrum.io/rpc`
- Custom oracle URLs: `https://arbitrum-api.gmxinfra.io`

**Indexers:**
- Subsquid: `https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql`

**Oracle System:**
- Off-chain oracle system for price feeds
- Custom oracle contract deployment
- MAX_ORACLE_REF_PRICE_DEVIATION_FACTOR for price sanity checks
- oracleTimestampAdjustment to prevent block timestamp manipulation

### DeFi Infrastructure

**Price Feeds:**
- Custom oracle implementation
- Data stream decimals: 8
- Token-specific price calculations with multipliers
- Example: WNT (18 decimals) uses multiplier of 10^34, WBTC (8 decimals) uses 10^44

**Key Risk Management Features:**
- PnL capping for traders, deposits, and withdrawals
- Auto-Deleveraging (ADL) mechanism
- Dynamic funding rate adjustment
- Oracle deviation checks

---

## 3. Team & Hiring

*Note: Web search limitations prevented gathering live hiring data from LinkedIn, Glassdoor, and the official careers page. The following is based on general knowledge of the DeFi hiring landscape.*

### Current Hiring Status

GMX is a well-established DeFi protocol and typically maintains a small but active team. Given the competitive DeFi landscape and the protocol's growth trajectory, the team likely continues to hire selectively for:

- Smart Contract Developers
- Frontend Engineers  
- Backend Engineers
- Protocol Designers/Researchers

### Engineering Culture

Based on the protocol's characteristics:

1. **Remote-First:** DeFi protocols typically operate with distributed teams
2. **Technical Depth:** Strong emphasis on smart contract security and DeFi mechanics
3. **Open Source:** Core contracts are publicly available on GitHub
4. **Security-Focused:** Extensive risk parameters and testing requirements

### Common Interview Processes

Typical DeFi protocol hiring process:

1. **Initial Screen:** Recruiter call (30-60 min)
2. **Technical Assessment:** Take-home project or live coding
3. **Technical Deep-Dive:** Architecture discussion, smart contract review
4. **Culture/Value Fit:** Team compatibility
5. **Final Decision**

### Skills & Technologies Looked For

**Smart Contract Roles:**
- Solidity expertise
- DeFi protocol design understanding
- Security auditing experience
- Gas optimization skills
- Understanding of oracles, AMMs, perpetuals

**Frontend Roles:**
- React/TypeScript proficiency
- Web3 wallet integration (wagmi, ethers.js)
- State management (React Query, Zustand, Redux)
- Performance optimization

**Backend Roles:**
- Node.js/TypeScript
- GraphQL (Subsquid indexing)
- RPC node management
- Data pipeline development

### How to Reach Recruiters

1. **Twitter/X:** @GMX_IO (official)
2. **Discord:** GMX community Discord
3. **LinkedIn:** GMX / GMX IO company page
4. **Email:** Available on official website

### Crypto Winter/Hiring Freeze History

GMX was launched in 2021 and has maintained operations through multiple market cycles. The protocol's sustainable revenue model from trading fees has likely allowed for continued hiring during most market conditions.

---

## 4. Job Roles for Developers

*Note: Specific current openings, salary ranges, and compensation data require live web search which was unavailable. The following represents typical roles and ranges in the DeFi space.*

### Smart Contract Developer

**Focus Areas:**
- Core protocol development
- Market creation and configuration
- Order handling and execution
- Risk management systems

**Typical Requirements:**
- 3+ years Solidity experience
- DeFi protocol experience
- Security-conscious coding
- Gas optimization knowledge

**Estimated Salary Range (2024):**
- $150,000 - $300,000 USD (crypto/combined compensation)
- Token-based compensation often included

### Frontend Engineer

**Focus Areas:**
- Trading interface development
- Wallet integration
- Real-time data display
- User experience optimization

**Typical Requirements:**
- React/TypeScript expertise
- Web3 integration experience
- Performance optimization skills
- Understanding of DeFi trading

**Estimated Salary Range (2024):**
- $120,000 - $250,000 USD
- Remote-first with flexible compensation

### Backend Engineer

**Focus Areas:**
- Indexer development (Subsquid)
- Oracle infrastructure
- Data pipelines
- API development

**Typical Requirements:**
- Node.js/TypeScript
- GraphQL experience
- Blockchain indexing
- High availability systems

### DevOps/SRE

**Focus Areas:**
- RPC node management
- Infrastructure monitoring
- Deployment automation
- Security infrastructure

### Security Engineer

**Focus Areas:**
- Smart contract auditing
- Risk parameter design
- Incident response
- Security research

### Remote vs On-site

GMX operates as a **remote-first** protocol with:
- Distributed team across multiple time zones
- Async communication culture
- Video calls for synchronous discussions
- No mandatory office presence

---

## 5. Application Strategy

### How to Find GMX Jobs

1. **Official Website:** gmx.io (careers section if available)
2. **LinkedIn:** Search "GMX" or "GMX IO" jobs
3. **Twitter/X:** Follow @GMX_IO for announcements
4. **Discord:** GMX community (often shares hiring info)
5. **Well-known Crypto Job Boards:**
   - Crypto Jobs List
   - Web3.career
   - CryptoJobs.com
   - DeFi Jobs

### What Makes a Strong Application

1. **Technical Demonstrations:**
   - Open source contributions to GMX or similar protocols
   - Smart contract portfolios on GitHub
   - Code quality and security awareness

2. **DeFi Knowledge:**
   - Understanding of perpetual trading mechanics
   - Knowledge of AMM models, order books, funding rates
   - Comprehension of risk management in leverage trading

3. **Relevant Projects:**
   - Built or contributed to trading protocols
   - Security audit contributions
   - Frontend for DeFi applications

### Portfolio/Project Items That Help

1. **Smart Contract Examples:**
   - Perpetual/futures trading contracts
   - AMM implementations
   - Order matching systems
   - Risk management modules

2. **Frontend Examples:**
   - Trading interfaces
   - Wallet integrations
   - Real-time data visualization
   - DeFi dashboards

3. **Research/Articles:**
   - DeFi protocol analysis
   - Security vulnerability discoveries
   - Protocol comparison research

### Hackathons & Community Contributions

**Valued Activities:**
1. **GMX Bug Bounties:** Security vulnerabilities
2. **Protocol Contributions:** GitHub PRs
3. **Community Building:** Discord helpfulness, content creation
4. **Hackathon Projects:** Building on GMX or similar protocols
5. **Educational Content:** Tutorials, explanations

**Relevant Hackathons:**
- ETHGlobal hackathons
- Arbitrum hackathons
- Avalanche hackathons
- Local Web3 hackathons

### Application Tips

1. **Show Relevant Work:** Focus on DeFi/smart contract projects
2. **Demonstrate Security Mindset:** Especially for smart contract roles
3. **Understand the Protocol:** Use GMX, understand the mechanics deeply
4. **Network:** Engage with team members at conferences, events
5. **Token Compensation:** Be prepared to discuss token vs cash compensation

---

## 6. Competition Analysis

### Direct Competitors (Decentralized Perpetual Protocols)

| Protocol | Blockchain | Key Differentiator |
|----------|-----------|-------------------|
| **dYdX** | Ethereum/Solana | Order book model, professional trading |
| **GMX** | Arbitrum/Avalanche | Synthetics model, peer-to-pool |
| **Gains Network** | Polygon/Arbitrum | GNS token, advanced features |
| **ApolloX** | Arbitrum | Perpetual futures exchange |
| **Vertex** | Arbitrum | Order book + AMM hybrid |
| **dFuture** | Multiple | Decentralized futures |

### dYdX
- **Focus:** Professional trading, order book
- **Hiring:** Typically hires senior engineers
- **Tech:** Cosmos SDK (moving to own chain)

### Level Finance (Gains Network)
- **Focus:** Leveraged trading, derivatives
- **Hiring:** Smart contract and frontend roles
- **Tech:** Similar stack to GMX

### ApolloX
- **Focus:** Perpetual futures
- **Hiring:** Growing team
- **Tech:** Arbitrum-based

### Vertex
- **Focus:** Hybrid order book + AMM
- **Hiring:** Competitive compensation
- **Tech:** Arbitrum ecosystem

### Hiring Competition Summary

All these protocols compete for similar talent:
- Smart contract developers with DeFi experience
- Frontend engineers with Web3 skills
- Protocol designers and researchers
- Security engineers

**Differentiation Factors:**
- Compensation structure (token-heavy vs cash)
- Remote flexibility
- Protocol growth trajectory
- Team culture and expertise
- Technical challenges

---

## Appendix: GMX GitHub Repositories

### Official Repositories
- **gmx-io/gmx-synthetics** - Core smart contracts
- **gmx-io/gmx-interface** - Frontend application
- **snipermonke01/gmx_python_sdk** - Python SDK (community)

### Key Documentation Files
- `README.md` - Protocol overview and architecture
- `deploy-*.txt` - Deployment records with contract addresses
- `sdk/README.md` - SDK documentation and examples

---

## Limitations & Notes

1. **Web Search Limitations:** Live web search was unavailable during this research session. Some information (founder details, current job openings, salary ranges) could not be verified.

2. **Information Accuracy:** Data from Context7/GitHub is accurate as of the documentation date. Verify current information through official channels.

3. **Dynamic Content:** Job openings, salaries, and team information change frequently. Always check official sources for the most current data.

---

## Recommended Next Steps

1. **Verify Current Openings:** Check gmx.io/careers or LinkedIn directly
2. **Review Documentation:** Read the full GMX Synthetics README for technical details
3. **Explore Codebase:** Review smart contracts on GitHub
4. **Join Community:** Engage with GMX Discord for networking
5. **Build Portfolio:** Contribute to open source or build relevant projects

---

*This document was compiled from GMX GitHub repositories via Context7 API and represents a technical deep-dive into the GMX protocol architecture and ecosystem.*
