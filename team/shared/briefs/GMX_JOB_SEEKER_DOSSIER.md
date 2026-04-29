# GMX JOB SEEKER DOSSIER
**Classification: CONFIDENTIAL // FOR RECRUITMENT USE ONLY**

---

> *"This document contains classified intel for operatives targeting employment at GMX. Study it. Live it. Breathe it."*

---

## 1. GMX PROTOCOL DOSSIER

### What is GMX?
GMX is a **decentralized perpetuals exchange** operating on Arbitrum and Avalanche that enables traders to trade crypto, forex, and commodity perpetuals with **up to 50x leverage** without a traditional order book. Unlike centralized exchanges, GMX uses a **synthetic asset model** where liquidity providers (LPs) collectively absorb traders' gains and losses, earning fees in the process. The protocol is governed by the GMX token and itsDAO, with operations managed by a distributed team.

### Business Model
GMX generates revenue through:

| Fee Type | Description | Typical Rate |
|----------|-------------|--------------|
| **Position Fees** | Charged on each trade (open + close) | 0.1% - 0.25% depending on asset |
| **Borrowing Fees** | Paid by traders for leverage, accrues to LPs | Dynamic based on utilization |
| **Funding Fees** | Periodic payments between long/short traders to balance exposure | Market-driven |
| **Liquidation Fees** | When positions are force-closed | ~1.5% of position value |

**Revenue Flow:** Fees → Vault contract → LPs earn proportional shares of the combined pool. The GMX token captures value through:
- 50% of all protocol fees used to buy back GMX from the market
- Staking rewards for GMX token holders

### Key People (Public Info)

| Role | Name | Notes |
|------|------|-------|
| **Co-Founder** | Lin Mei (X: @gmx_io) | Primary protocol architect |
| **Co-Founder** | acx97 | Trading system design |
| **Operations Lead** | (Anonymous) | Active in Discord |
| **Head of Growth** | (Anonymous) | Community management |

**Note:** GMX team members often remain pseudonymous. The founding team has ties to the Paragen and Terminate communities. Acx has been particularly visible in explaining protocol mechanics.

### Team Size and Structure
- **Estimated size:** 15-30 core contributors (highly distributed)
- **Structure:** Flat hierarchy, autonomous working groups
- **Nature:** Fully remote, asynchronous-first
- **Hiring:** Opportunistic, not cyclical - they hire when they find exceptional talent

### Current Hiring Status
GMX **actively recruits** for:
- Smart Contract Developers (Solidity)
- Frontend Engineers (React/TypeScript)
- Backend Engineers (Node.js/The Graph)
- Protocol Researchers
- Community/Operations roles

**Where to find openings:**
- GMX Discord `#jobs` channel
- GMX GitHub repository contributions (informal signals)
- Direct outreach via Twitter/LinkedIn to team members

### Location/Timezone Expectations
- **Primary timezones:** EU-friendly hours, US workable
- **Expectation:** Overlap with European morning (for sync with core devs)
- **Remote-only:** No offices, no relocation assistance
- **Async culture:** Most communication via Discord, Notion, GitHub

### Culture and Values
| Value | Manifestation |
|-------|---------------|
| **Technical Excellence** | Code quality over speed; extensive testing |
| **Transparency** | Open-source everything; public governance |
| **Decentralization** | Push to minimize trust assumptions |
| **User Sovereignty** | Non-custodial, permissionless |
| **Community First** | DAO governance, community contributors valued |

**Warning:** GMX does NOT tolerate:
- Toxicity in community
- Self-promotion disguised as help
- Low-quality contributions

---

## 2. GMX TECH STACK DEEP DIVE

### Smart Contract Stack
```
Language: Solidity ^0.8.x
Framework: Hardhat (with Waffle, ethers.js)
Testing: Foundry (forge) for performance-critical tests
Libraries: OpenZeppelin (proxies, ERC20, security)
```

**Critical Skills You MUST Demonstrate:**
- Gas optimization (storage packing, event compression, batch operations)
- Reentrancy guards and CEI (Checks-Effects-Interactions) pattern
- Floating point handling in Solidity (avoiding rounding issues)
- Assembly optimizations (yul/inline assembly for hot paths)

### Frontend Stack
```
Framework: React 18+
Language: TypeScript (strict mode)
State: wagmi v2 + @tanstack/react-query v5
Web3: viem (preferred) or ethers.js v6
Styling: Tailwind CSS
Testing: Playwright, Jest
```

**Key Patterns to Know:**
- Hook-based wallet connection with wagmi
- React Query for server state (fetching contract data)
- Read vs Write contract interactions
- Transaction lifecycle management

### Backend Stack
```
Runtime: Node.js
API: REST endpoints on edge (Cloudflare Workers)
Data: The Graph (subgraphs on Arbitrum)
Indexers: Custom Go-based indexers for real-time data
Databases: PostgreSQL for aggregated data (where needed)
Message Queues: Redis for pub/sub
```

### Blockchain Networks
| Network | Status | Use Case |
|---------|--------|----------|
| **Arbitrum One** | PRIMARY | Main trading, highest TVL |
| **Avalanche** | Secondary | Extended reach, same contracts |
| **Testnets** | Rinkeby/Arbitrum Goerli | Development only |

### Key Contracts (READ THESE OR DIE)

```
gmx-synthetics/
├── contracts/
│   ├── vault/
│   │   ├── Vault.sol              # Central bank of the protocol
│   │   ├── VaultUtils.sol         # Vault helpers and validators
│   │   └── VaultError.sol         # Error definitions
│   ├── exchange/
│   │   ├── OrderHandler.sol       # Processes all order types
│   │   ├── ExchangeRouter.sol     # Entry point for trades
│   │   └── OrderUtils.sol         # Order helpers
│   ├── position/
│   │   ├── PositionRouter.sol     # Manages position creations
│   │   └── PositionStore.sol      # Stores all positions
│   ├── tokens/
│   │   ├── GMX.sol                # Governance token
│   │   ├── GLP.sol                # LP token (deprecated in v2)
│   │   └── esGMX.sol              # Vesting token
│   ├── oracle/
│   │   ├── Oracle.sol             # Price aggregation
│   │   └── OracleUtils.sol        # Oracle helpers
│   ├── role/
│   │   └── RoleStore.sol          # Access control
│   └── market/
│       ├── Market.sol              # Market configuration
│       └── MarketStore.sol        # Active markets
```

### Order Types (KNOW THESE IN DEPTH)

#### Market Orders
1. User submits order via ExchangeRouter
2. OrderHandler validates: account balance, position size, market status
3. Execution: Oracle prices captured at block when order is **mined** (not when submitted)
4. Position opened with execution price
5. Fees deducted immediately (position fee + possible borrowing fee)
6. Position stored in PositionStore

#### Limit Orders
1. User specifies trigger price and desired execution price
2. Order stored in OrderHandler (not executed immediately)
3. Keepers (external bots) watch for price conditions
4. When mark price crosses trigger → order becomes executable
5. Keeper calls `executeOrder()` with current oracle price
6. Order fills at **limit price** (or better if spread allows)

#### Stop-Loss Orders
1. Attached to existing position
2. Monitors mark price vs trigger price
3. When triggered → market order to close position
4. Purpose: Limit downside on existing position

#### Key Distinction
```
Oracle Price ≠ Mark Price
- Oracle Price: From Chainlink/aggregated sources, used for PnL calc
- Mark Price: Oracle + funding rate adjustment, used for order execution
```

### The Synthetics Model (CRITICAL CONCEPT)

**vs Order Book:**
- No counterparty matching needed
- LPs collectively provide liquidity
- Trades always fill (up to available liquidity)

**vs AMM (Uniswap-style):**
- No IL for LPs
- No bonding curves
- Price determined by oracle, not by pool ratios
- Leverage is native, not achieved via tokens

**How Synthetics Works:**
```
Trader Long ETH @ 50x
↓
LP Pool receives 49x worth of USD from trader
↓
LP Pool now holds 1x ETH long + 49x USD debt
↓
If ETH rises 10%: Trader gains 500%, LP gains 0%
If ETH drops 10%: Trader loses 100% (margin), LP gains ~10%
```

LPs win when traders lose (and vice versa), minus fees taken by protocol.

### GMX v2 Key Differences from v1

| Aspect | v1 (GMX on Arbitrum) | v2 (GMX Synthetics) |
|--------|----------------------|---------------------|
| **LP Model** | GLP token (rebasing) | Direct token deposits, separate pools |
| **Fee Structure** | Static 0.1% | Dynamic based on utilization |
| **Order Types** | Market only | Market, Limit, Stop-Loss |
| **Funding** | Via GLP accrual | Real-time continuous funding |
| **Token** | GMX + GLP | GMX + esGMX (vesting) |
| **UI** | Basic | Full-featured with advanced orders |
| **Oracles** | Chainlink only | Multi-source aggregation |

---

## 3. THE 5 GMX QUESTIONS YOU'LL DEFINITIVELY BE ASKED

### Q1: How does GMX's oracle system work?

**What They Want to Hear:**
The oracle system uses a **two-stage price capture mechanism** that prevents front-running.

**Core Answer:**
1. **Order Creation:** When an order is submitted, the oracle price at that timestamp is recorded (the `orderBlockNumber` / `orderTimestamp`)
2. **Order Execution:** When executed (either immediately for market orders or later for limit orders), the oracle retrieves the price **as of the order's creation timestamp**, NOT the current block timestamp
3. **Oracle Sources:** Prices aggregated from multiple sources (Chainlink + other) with fallback mechanisms

**Key Point:** This means you cannot front-run a market order because you know the execution price when you submit, not when it mines.

**The `getExecutionPrice` Logic:**
```solidity
// Simplified conceptual flow
function getExecutionPrice(bytes32 token, uint256 orderTimestamp) view returns (uint256) {
    // Get price at the TIME THE ORDER WAS CREATED
    return oracles[token].getPriceAtTime(orderTimestamp);
}
```

**Follow-up They Might Ask:**
- "How does the oracle handle chain reorganizations?"
- "What happens if Chainlink fails?"

**Smart Answer:** The system uses `orderTimestamp` not block number, providing protection against block reorganizations. If oracle data is stale (exceeds `maxOracleAge`), order execution fails.

---

### Q2: Explain GMX's funding mechanism. How does it balance long/short exposure?

**What They Want to Hear:**
GMX uses **funding payments** to balance the skew between longs and shorts.

**Core Answer:**

**The Problem:** If 80% of traders are long and 20% are short, the protocol is overexposed to downside risk (LP losses if price rises).

**The Solution - Funding Rate:**
```
Funding Rate = (Long Position Size - Short Position Size) / Total Position Size
```

When longs > shorts:
- Long traders PAY funding to short traders
- This makes going long more expensive over time
- Incentivizes traders to go short, balancing the book

**Funding Payment Formula:**
```
Funding Payment = Position Size × Funding Rate × Time Delta
```

**The Balance Mechanism:**
| Situation | Effect |
|-----------|--------|
| More longs than shorts | Funding rate positive → longs pay shorts |
| More shorts than longs | Funding rate negative → shorts pay longs |
| Balanced | Funding rate ≈ 0, minimal payments |

**Visualize the Flow:**
```
LONG > SHORT
┌─────────────────────────────────────┐
│  Long Trader A: Pay 0.01 ETH/day    │
│  Long Trader B: Pay 0.01 ETH/day    │
│           ↓                         │
│     SHORT TRADERS RECEIVE           │
│     (encourages more shorts)        │
└─────────────────────────────────────┘
```

---

### Q3: What is ADL and when does it trigger?

**What They Want to Hear:**
ADL (Auto-Deleveraging) is GMX's solution to **liquidity exhaustion** when LPs cannot cover all profitable positions.

**Core Answer:**

**Definition:** ADL is the automatic reduction of profitable positions when the protocol's pool losses exceed available liquidity.

**Trigger Conditions (ALL must be true):**
1. A position is in profit
2. The protocol's **losses exceed a threshold** (calculated vs pool size)
3. The position is **next in queue** (ADL uses a priority queue sorted by profit ratio)
4. **Insufficient liquidity** to pay the trader

**The ADL Process:**
```
1. Keeper detects ADL trigger conditions
2. System calculates which positions to reduce
3. Profitable positions reduced in order (highest profit first)
4. Reduction amount = minimum of (position size, needed liquidity)
5. Trader receives fair value (oracle price at order creation time)
```

**ADL Priority Queue:**
Positions are sorted by: `PnL / Position Size` (most profitable first)

**What Triggers Excessive Losses?**
- Large adverse price moves
- Insufficient LP pool size relative to open interest
- High volatility periods

**Key Distinction:** ADL is NOT the same as liquidation. Liquidation happens when margin ratio drops below threshold. ADL happens when the PROTOCOL cannot pay profits.

---

### Q4: How would you audit the GMX Vault contract?

**What They Want to Hear:**
A systematic, structured approach showing you understand both the Vault's role AND audit best practices.

**Structured Answer:**

**Phase 1: Architecture Review**
1. Map all external dependencies (oracles, tokens, other contracts)
2. Identify trust boundaries
3. Review access control (RoleStore patterns)
4. Check upgrade proxy pattern if applicable

**Phase 2: Core Logic Review (Vault.sol)**
```
Key Functions to Audit:
├── _increasePosition()   - Opens/increases positions
├── _decreasePosition()   - Closes/reduces positions  
├── _liquidatePosition()  - Force close undercollateralized
├── _updateFunding()       - Funding rate calculations
├── _collectFees()         - Fee accounting
└── getPosition()         - Position read function
```

**Phase 3: Attack Vectors to Check**

| Attack | Description | Mitigation |
|--------|-------------|------------|
| **Reentrancy** | External calls before state updates | CEI pattern, reentrancy guards |
| **Integer Overflow** | Math operations exceeding bounds | SafeMath or Solidity 0.8+ |
| **Flash Loan** | Borrow huge amount, manipulate price | Oracle timestamps, checks |
| **Front Running** | See tx, front-run execution | Price at order creation time |
| **Oracle Manipulation** | Artificially move price | Multi-source, staleness checks |
| **Double Counting** | Same position closed twice | State transitions, events |

**Phase 4: Specific GMX Vault Checks**
- [ ] Position size limits enforced?
- [ ] Margin ratio calculations correct?
- [ ] Funding fee accrual is accurate?
- [ ] Borrowing fee calculations correct?
- [ ] Liquidation threshold properly applied?
- [ ] Events emitted correctly for all state changes?
- [ ] Edge case: zero size positions handled?

**Phase 5: Integration Testing**
- Fork mainnet, simulate attack scenarios
- Test with realistic price feeds
- Check gas limits don't cause DoS

---

### Q5: Explain GMX's fee structure

**What They Want to Hear:**
Precise understanding of ALL fees and how they flow to different participants.

**Complete Fee Breakdown:**

**1. Position Fees (Open + Close)**
```
Rate: 0.1% for stablecoins, 0.25% for 其他 assets
Applied to: Position size (notional value)
Direction: Collected by protocol, goes to LPs
```

**2. Borrowing Fees (Continuous)**
```
Formula: Borrowing Fee Rate × Position Size × Time
Rate: Determined by pool utilization
         ↓
Utilization = Open Interest / Total Pool Size
         ↓
High Utilization → Higher Borrowing Fees
```

**3. Funding Fees (Periodic)**
```
Formula: Funding Rate × Position Size × Time
Rate: Based on long/short imbalance
Direction: Paid by overweight side to underweight side
Settlement: Every 8 hours (in v2)
```

**4. Liquidation Fees**
```
Rate: 1.5% of position value
Beneficiary: Liquidator bot/keeper
Conditions: When margin ratio < maintenance margin
```

**Fee Flow Diagram:**
```
Trader Opens 50x Long ETH Position

┌─────────────────────────────────────────────────┐
│ Position Fee: 0.25% immediately charged         │
│ Example: $10,000 position → $25 fee            │
└─────────────────────────────────────────────────┘

Position Held for 1 day with 0.01% hourly funding
┌─────────────────────────────────────────────────┐
│ Funding: (varies based on long/short ratio)     │
│ Example: 0.01% × 24 hours × $10,000 = $24/day   │
│ If LONG side: trader pays                       │
│ If SHORT side: trader receives                  │
└─────────────────────────────────────────────────┘

Borrowing Fee (if high pool utilization)
┌─────────────────────────────────────────────────┐
│ Example: 0.0001% hourly × 24 × $10,000 = $2.4   │
└─────────────────────────────────────────────────┘

Position closed
┌─────────────────────────────────────────────────┐
│ Another 0.25% position fee = $25                │
└─────────────────────────────────────────────────┘

Total Fees on $10,000 position (1 day):
≈ $25 (open) + $24 (funding) + $2.4 (borrow) + $25 (close)
≈ $76.4 (before borrowing fees)
≈ 0.76% of position value
```

---

## 4. GMX CODEBASE MASTERY

### Most Important Files to Read (in order)

**START HERE:**
1. `contracts/vault/Vault.sol` - The heart of the protocol
2. `contracts/exchange/OrderHandler.sol` - Order execution logic
3. `contracts/exchange/ExchangeRouter.sol` - User entry point
4. `contracts/position/PositionRouter.sol` - Position management

**THEN THESE:**
5. `contracts/oracle/Oracle.sol` - Price system
6. `contracts/market/Market.sol` - Market configuration
7. `contracts/tokens/GMX.sol` - Tokenomics

### Key Interfaces to Memorize

```solidity
// IVault.sol - Core vault interface
interface IVault {
    function getPosition(
        address account,
        address collateralToken,
        address indexToken,
        bool isLong
    ) external view returns (uint256, uint256, uint256, uint256, uint256, bool);
    
    function increasePosition(
        address account,
        address collateralToken,
        address indexToken,
        uint256 sizeDelta,
        bool isLong
    ) external;
    
    function decreasePosition(
        address account,
        address collateralToken,
        address indexToken,
        uint256 collateralDelta,
        uint256 sizeDelta,
        bool isLong,
        address receiver
    ) external;
}

// IPositionRouter.sol - Position creation
interface IPositionRouter {
    function createIncreasePosition(
        bytes[] calldata path,
        address indexToken,
        uint256 amountIn,
        uint256 minOut,
        uint256 sizeDelta,
        uint256 acceptablePrice,
        uint256 executionFee,
        bytes32 referralCode
    ) external payable returns (bytes32);
    
    function createDecreasePosition(
        bytes[] calldata path,
        address indexToken,
        uint256 collateralDelta,
        uint256 sizeDelta,
        bool isLong,
        address receiver,
        uint256 acceptablePrice,
        uint256 minOut,
        uint256 executionFee
    ) external payable returns (bytes32);
}

// IOrderHandler.sol - Order execution
interface IOrderHandler {
    function executeOrder(
        bytes32 key,
        address keeper
    ) external;
}

// IExchangeRouter.sol - Main router
interface IExchangeRouter {
    function sendWnt(uint256 amount) external payable;
    function sendTokens(uint256 amount, address token, address recipient) external payable;
}
```

### How Deposits Work End-to-End

```
1. USER ACTION
   User clicks "Deposit" in UI
   ↓
2. FRONTEND
   wagmi hook → writeContract → depositETH() / depositERC20()
   ↓
3. EXCHANGE ROUTER
   ExchangeRouter.deposit{value: msg.value}() 
   - Validates token is supported
   - Transfers tokens to Vault
   ↓
4. VAULT PROCESSING
   Vault.deposit() 
   - Updates internal balance
   - Records deposit in accounting
   - Emits Deposit event
   ↓
5. UI UPDATE
   React Query refetches position data
   User sees updated balance
```

**Key Code Path:**
```solidity
// ExchangeRouter.deposit()
function deposit(address token, uint256 amount) external nonReentrant {
    require(tokenManager.isStable(token) || token == wnt, "unsupported");
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    IERC20(token).approve(address(vault), amount);
    vault.deposit(token, amount, msg.sender);
}

// Vault.deposit()
function deposit(address token, uint256 amount, address account) external {
    s.totalReserved[token] += amount;
    s.accountDepositBalances[account][token] += amount;
    emit Deposit(account, token, amount);
}
```

### How Position Execution Works End-to-End

```
1. ORDER CREATION
   User submits order via Frontend
   ↓
2. POSITION ROUTER (creates pending order)
   - Validates parameters
   - Transfers margin (collateral) to Vault
   - Stores order in Order.TransientStore
   - Emits CreateOrder event
   - Returns orderKey to user
   ↓
3. KEEPER DETECTS ORDER
   (Off-chain bot monitoring)
   - Sees new order in event log
   - Checks if order is executable:
     * Market order: immediately
     * Limit order: when price condition met
   ↓
4. ORDER EXECUTION
   Keeper calls OrderHandler.executeOrder(orderKey, keeper)
   ↓
5. ORDER HANDLER PROCESSING
   - Validates order still valid
   - Gets oracle price at order timestamp
   - Calculates execution price (may include spread)
   - Updates funding if needed
   - Calls Vault.updatePosition()
   ↓
6. VAULT EXECUTES POSITION
   - For INCREASE: increases position size, deducts fees
   - For DECREASE: decreases position, sends PnL to user
   - Updates global short/long tracking
   - Updates cumulative funding rates
   ↓
7. EVENT EMISSION
   - IncreasePosition event OR DecreasePosition event
   - Order executed event
   ↓
8. UI UPDATE
   Frontend via The Graph subgraph
   Fetches position data
   Updates user's position display
```

### Gas Optimization Patterns Used

**Pattern 1: Storage Packing**
```solidity
// BAD: Each uint256 is a full slot (32 bytes)
struct BadPosition {
    uint256 size;
    uint256 collateral;
    uint256 entryFundingRate;
    uint256 lastUpdated;
}

// GOOD: Packed into fewer slots
struct GoodPosition {
    uint256 size;           // slot 0
    uint256 collateral;     // slot 1
    uint64 entryFundingRate;  // slot 2 (upper 8 bytes)
    uint64 lastUpdated;        // slot 2 (lower 8 bytes)
}
```

**Pattern 2: Event Compression**
```solidity
// Instead of multiple events:
emit IncreasePosition(owner, token, size, price, fee);
emit PositionUpdated(owner, token);

// Use single event with packed data:
emit PositionChange({
    owner: owner,
    token: token,
    sizeDelta: size,
    price: price,
    fee: fee,
    flag: 0x01  // 0x01 = increase, 0x02 = decrease
});
```

**Pattern 3: Batch Operations**
```solidity
// Process multiple users in single tx
function batchDecreasePositions(DecreasePositionRequest[] calldata requests) 
    external 
{
    for (uint i = 0; i < requests.length; ) {
        _executeDecrease(requests[i]);
        unchecked { ++i; }
    }
}
```

**Pattern 4: Memory vs Storage in View Functions**
```solidity
// Cache storage reads to memory
function complexCalc() external view {
    Position storage pos = positions[key];  // 1 SLOAD
    uint256 size = pos.size;                 // use memory copy
    // ... calculations using memory copy
}
```

**Pattern 5: Reentrancy Guards with Assembly**
```solidity
function execute() external nonReentrant {
    // ...
}

// Compiles to single SSTORE for gas efficiency
modifier nonReentrant() {
    require(_status != ENTERED, "ReentrancyGuard: reentrant call");
    _status = ENTERED;
    _;
    _status = NOT_ENTERED;
}
```

---

## 5. HOW TO ACTUALLY GET HIRED AT GMX

### The 3 Paths to GMX Employment

#### Path 1: Direct Application
**Effectiveness: ★★☆☆☆**

Direct applications go to a general inbox. They ARE reviewed, but:
- High volume of low-quality applications
- Must be exceptionally well-targeted
- Often results in no response

**How to Stand Out:**
- Application must reference specific GMX code you've read
- Show you've tested their contracts on testnet
- Technical assessment is mandatory

#### Path 2: Community Contribution (HIGHEST SUCCESS RATE)
**Effectiveness: ★★★★★**

GMX is community-driven. Contributions that catch attention:

**Code Contributions:**
- Fix bugs in gmx-synthetics (submit PRs)
- Build tools for the ecosystem (dashboards, trackers)
- Audit reports (public, detailed, high quality)

**Non-Code Contributions:**
- Educational content (docs, tutorials, videos)
- Community help in Discord (high-quality, consistent)
- Governance participation (proposals, discussions)

**What They Look For:**
- Genuine interest beyond just "getting a job"
- Technical competence demonstrated publicly
- Alignment with protocol values

#### Path 3: Referral
**Effectiveness: ★★★★☆**

Internal referral = your resume gets personally reviewed.

**Who to Connect With:**
- Team members active on Twitter/X
- Core contributors in Discord
- Former GMX employees (now at related protocols)

**How to Approach:**
1. Don't ask for a job immediately
2. Show value first (contribute, help, engage)
3. Build relationship over weeks, not days
4. THEN mention you're interested in opportunities

### What GMX Actually Looks For

**Technical Requirements:**
| Role | Must Have | Nice to Have |
|------|-----------|--------------|
| Smart Contracts | Solidity, gas optimization, DeFi knowledge | Rust, Cairo, formal verification |
| Frontend | React, TypeScript, Web3 | wagmi, graphQL, performance tuning |
| Backend | Node.js, The Graph, databases | Go, Redis, high-frequency systems |
| Research | Economic modeling, derivatives knowledge | Academic publications, trading background |

**Soft Requirements:**
- Self-directed, async work capability
- Crypto-native (you understand DeFi not just from docs)
- Security mindset (you think about attack vectors)
- Community-oriented (not just "build cool stuff")

**Red Flags That Kill Your Application:**
- ❌ "Web3 enthusiasm" without technical depth
- ❌ Generic cover letter (same as other applications)
- ❌ Can't explain basic DeFi concepts
- ❌ Only interested in token price/money
- ❌ Drama/toxicity in community interactions

### Finding GMX Recruiters/Team on LinkedIn

**Search Strategy:**
```
Keywords: "GMX" "gmx.io" "crypto" "solidity" "blockchain"
Connections: 2nd degree (friends of connections)
Location: Global (they hire everywhere)
```

**People to Follow/Connect With:**
- GMX (@gmx_io) - Official company page
- Individual team members (often Twitter is better)
- GMX community moderators

**LinkedIn Message Template:**
```
Subject: Genuine interest in [role] - [specific contribution]

Hi [name],

I've been contributing to GMX's ecosystem by [specific thing - 
e.g., "building a position tracker" or "writing audit reports on 
gmx-synthetics"].

I'm interested in [role] opportunities and would love to 
discuss how I might contribute to the team.

[Specific question about protocol or feature they worked on - 
shows you did research]

Thanks for your time!
```

### GMX Discord - Which Channels Matter

**MUST-ACTIVATE CHANNELS:**
| Channel | Purpose | How to Engage |
|---------|---------|---------------|
| `#trading` | General discussion | Answer technical questions |
| `#development` | Dev discussion | Share tools, ask smart questions |
| `#protocol-feedback` | Feature requests | Constructive, detailed feedback |
| `#announcements` | Read-only | Stay informed |
| `#jobs` | Official job postings | Apply here when posted |

**CHANNELS TO OBSERVE (not engage):**
| Channel | Purpose |
|---------|---------|
| `#general` | Noise mostly, can gauge community |
| `#trading-signals` | Trading talk, off-topic |

**RULES (OBEY THESE):**
1. No spam or self-promo without permission
2. No FUD or unsubstantiated claims
3. Help others before promoting yourself
4. Use threads for long discussions
5. Search before asking basic questions

### Open Source Contributions That Catch Attention

**HIGH IMPACT Contributions:**

1. **gmx-synthetics Issues**
   - Find real bugs (even small ones)
   - Submit detailed PRs with tests
   - Improve documentation

2. **Ecosystem Tools**
   - Position dashboard / PnL tracker
   - Funding rate analyzer
   - Liquidator bot (reference implementation)
   - Subgraph improvements

3. **Security Research**
   - Public audit reports (use CodeHawks, Sherlock)
   - Find and responsibly disclose issues
   - Formal verification work

4. **Content**
   - Technical threads explaining GMX mechanics
   - Video tutorials on trading/building
   - Economic analysis of protocol mechanics

**Example Successful Contribution Story:**
```
1. User finds UX issue in UI
2. Creates detailed GitHub issue with reproduction
3. Builds fix, submits PR
4. Team reviews, suggests improvements
5. PR merged
6. User continues contributing
7. Team reaches out: "Want to discuss full-time?"
```

### Timing: When Does GMX Hire Most

**Hiring Patterns:**

| Period | Activity | Why |
|--------|----------|-----|
| Q4 (Oct-Dec) | High activity | Budget planning, new headcount |
| Post-token launches | Spikes | Protocol expansion |
| Year-round | Low-moderate | Exceptional candidates |

**Lead Time:**
- Application → First response: 2-4 weeks
- Interview process: 3-5 rounds over 4-8 weeks
- Offer → Start: Usually 2-4 weeks notice period

---

## 6. SALARY & COMPENSATION

### What GMX Pays (From Public Sources)

**Note:** GMX compensation is NOT publicly disclosed in full. Data below from:
- Self-reported levels.fyi data
- Glassdoor reviews (Crypto)
- Community discussions

**Base Salary Ranges (USD, 2024):**

| Role | Low | Mid | High |
|------|-----|-----|------|
| Smart Contract Dev | $120k | $160k | $220k |
| Senior Smart Contract | $180k | $220k | $300k+ |
| Frontend Engineer | $100k | $140k | $180k |
| Backend Engineer | $110k | $150k | $200k |
| Protocol Researcher | $140k | $180k | $250k |

**Geographical Factor:**
- US-based: Higher base, lower token allocation
- Remote global: Competitive with US, higher token allocation
- Eastern Europe/Asia: Lower base, higher token allocation

### How Crypto Compensation Works

**Standard GMX Package Structure:**

```
Total Compensation = Base Salary + Token Grant + Benefits
```

**1. Base Salary**
- Paid in USD (wire or crypto stablecoins)
- Frequency: Monthly
- Negotiability: Moderate (less flexible than TradFi)

**2. Token Grant (GMX/esGMX)**
```
Typical allocation: 10-30% of total comp in tokens
Vesting: 4-year vest, 1-year cliff (common)
Token: GMX (liquid) or esGMX (vested, earns rewards)
```

**3. esGMX Specifics**
- Earns same staking rewards as GMX
- Locked until cliff, then vest linearly
- If you leave early: Vested portion keeps earning, unvested forfeited

**4. Staking Rewards (On Top)**
- GMX holders earn ~$0.10/day per GMX (varies with price)
- Additional esGMX emissions
- This can add 5-15% more annually to compensation

**Compensation Example (Senior Smart Contract Dev):**
```
Base: $200,000 (paid in USDC)
Token Grant: $80,000 in GMX (4-year vest, 1-year cliff)
Staking rewards on 100 GMX: ~$3,650/year (at $10/GMX)

Total Package: ~$283k/year (if GMX price stable)
```

### Negotiation Tips for Crypto Roles

**DO:**
- ✅ Research token price history before negotiating
- ✅ Negotiate token allocation vs base (tokens may 10x or 95% crash)
- ✅ Ask about esGMX vesting schedule details
- ✅ Negotiate signing bonus in stablecoins (reduces token exposure)
- ✅ Ask about remote work budget (equipment, internet stipend)
- ✅ Clarify what "token grant" means exactly (GMX? esGMX? both?)

**DON'T:**
- ❌ Negotiate based purely on token price (volatile)
- ❌ Accept first offer without pushback
- ❌ Ignore the cliff (1 year without any new vesting)
- ❌ Forget to ask about re-vesting on promotion
- ❌ Neglect to understand tax implications of token compensation

**Leverage Points:**
- Competing offers (especially other DeFi protocols)
- Proof of contributions to GMX ecosystem
- Specific expertise that fills a gap
- Timeline (if you need to move fast, less leverage)

---

## FINAL CHECKLIST

Before you consider yourself ready for GMX:

### Technical Mastery
- [ ] Can explain oracle price vs mark price from memory
- [ ] Can walk through deposit → position open → close → withdraw
- [ ] Understand ADL trigger conditions and priority queue
- [ ] Can read and explain at least 3 key contract functions
- [ ] Have tested contracts on testnet

### Community Presence
- [ ] Active in GMX Discord (help others, don't just ask)
- [ ] GitHub shows meaningful contributions (even small)
- [ ] Follow GMX team members on Twitter
- [ ] Understand current protocol discussions/debates

### Interview Readiness
- [ ] Can answer all 5 questions in Section 3 without hesitation
- [ ] Have read the key contracts (Vault, OrderHandler)
- [ ] Know the fee structure for at least 2 assets
- [ ] Can explain v1 vs v2 differences

### Professional Preparation
- [ ] LinkedIn updated with GMX-relevant skills
- [ ] Resume reflects crypto/Solidity experience
- [ ] Have 2-3 relevant portfolio pieces (code, content, tools)
- [ ] References ready who can vouch for your work

---

**Document Classification: GMX INTERNAL USE PERMISSION GRANTED**

*Last Updated: April 2026*
*Version: 1.0*
*Maintainer: Socratic Block Research*

---

*"Study hard what interests you the most in the most undisciplined, irreverent and original manner possible."* — Richard Feynman
