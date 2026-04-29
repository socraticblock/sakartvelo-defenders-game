# Smart Contract Security & Auditing Guide for GMX-Level DeFi

> **Practical Reference for DeFi Security Professionals**  
> *Last Updated: April 2026*

---

## Table of Contents

1. [Top 10 Smart Contract Vulnerabilities in DeFi](#1-top-10-smart-contract-vulnerabilities-in-defi)
2. [GMX-Specific Security Considerations](#2-gmx-specific-security-considerations)
3. [How to Become a Smart Contract Auditor](#3-how-to-become-a-smart-contract-auditor)
4. [GMX Contract Audit Reports](#4-gmx-contract-audit-reports)
5. [Interview Questions for Security-Focused DeFi Roles](#5-interview-questions-for-security-focused-defi-roles)

---

## 1. Top 10 Smart Contract Vulnerabilities in DeFi

### 1.1 Reentrancy

**What it is:** A vulnerability where a contract can be re-entered via a recursive call before the original transaction completes, allowing an attacker to drain funds.

**GMX-Style Example:**
In a perpetual DEX, if a position withdrawal doesn't update the user's balance before making an external call (e.g., transferring tokens), an attacker can create a malicious contract that repeatedly calls the withdrawal function.

```solidity
// VULNERABLE pattern
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    (bool success, ) = msg.sender.call{value: amount}("");
    if (success) {
        balances[msg.sender] -= amount; // State update AFTER external call
    }
}

// SECURE pattern (Checks-Effects-Interactions)
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State update FIRST
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

**Prevention:**
- Follow Checks-Effects-Interactions pattern
- Use `ReentrancyGuard` from OpenZeppelin
- Update state before external calls
- Use `transfer()` or `sendValue()` instead of low-level `.call()`

---

### 1.2 Oracle Manipulation

**What it is:** Attackers manipulate asset prices in decentralized oracles to exploit protocols that rely on those prices.

**GMX-Style Example:**
GMX uses a Fast Price Feed with emergency nodes. An attacker could:
1. Manipulate the spot price on a DEX
2. Trigger a large position liquidation at the manipulated price
3. Profit from the incorrect liquidation

**Attack Vectors:**
- **Sandwich attacks:** Insert transactions before and after a victim's trade
- **Flash loan price manipulation:** Borrow massive amounts to move prices briefly
- **TWAP manipulation:** Gradually build up price manipulation over blocks

**Prevention:**
- Use Time-Weighted Average Prices (TWAPs) with sufficient duration
- Implement circuit breakers and price deviation thresholds
- Use multiple independent oracle sources (Chainlink + Fast Price Feed)
- Addslippage protection and maximum price change limits

---

### 1.3 Integer Overflow/Underflow

**What it is:** Solidity <0.8.x doesn't auto-revert on arithmetic overflow/underflow, allowing attackers to bypass checks.

**GMX-Style Example:**
```solidity
// Before Solidity 0.8 (needs SafeMath)
uint256 public totalShares;
function calculateProfit(uint256 shares) external view returns (uint256) {
    return totalShares - shares; // Underflow if shares > totalShares
}
```

**Prevention:**
- Use Solidity 0.8+ which has built-in overflow/underflow checks
- Or use OpenZeppelin's `SafeMath` library
- Implement bounds checking on all arithmetic operations
- Use `require` statements to validate input ranges

---

### 1.4 Access Control Issues

**What it is:** Missing or improperly configured access controls allow unauthorized users to execute privileged functions.

**GMX-Style Example:**
Critical functions in GMX like `setGov()` or `setHandler()` must only be callable by the governance address. If `onlyGov` modifier is missing or flawed:

```solidity
// VULNERABLE - missing access control
function setHandler(address _handler, bool _isActive) external {
    isHandler[_handler] = _isActive;
}

// SECURE - proper access control
function setHandler(address _handler, bool _isActive) external onlyGov {
    isHandler[_handler] = _isActive;
}

// Proper modifier implementation
modifier onlyGov() {
    require(msg.sender == gov, "unauthorized");
    _;
}
```

**Prevention:**
- Use OpenZeppelin's `AccessControl` or `Ownable` contracts
- Implement role-based access control (RBAC) for complex permissions
- Use multi-sig wallets for critical governance functions
- Implement timelocks for sensitive parameter changes

---

### 1.5 Flash Loan Attacks

**What it is:** Attackers borrow massive amounts from flash loan providers to manipulate prices or exploit logic vulnerabilities within a single transaction.

**GMX-Style Example:**
1. Borrow 10M USDT via flash loan
2. Use funds to manipulate ETH price on a linked DEX
3. Open a large long position on GMX at manipulated price
4. Price returns to normal
5. Close position at profit
6. Repay flash loan

**Prevention:**
- Use TWAPs instead of spot prices for critical calculations
- Implement price deviation checks between oracle sources
- Add limits on maximum position size
- Use commit-reveal schemes for price-sensitive operations
- Implement cooldown periods between actions

---

### 1.6 Price Manipulation

**What it is:** Systematic manipulation of asset prices to exploit protocol logic, often through coordinated trading.

**GMX-Style Example:**
- **Threshold Amplification:** When large liquidations are triggered, push price beyond seeders to maximize liquidation gains
- **Funding Rate Arbitrage:** Manipulate funding rates to force position closures

**Attack Patterns:**
```
1. Identify liquidation thresholds
2. Accumulate position in one direction
3. Manipulate price to trigger liquidations
4. Take opposing position at better entry
```

**Prevention:**
- Diversified price feeds with deviation alerts
- Liquidation threshold buffers
- Maximum price impact limits per block
- Monitoring and automated circuit breakers

---

### 1.7 Liquidation Attacks

**What it is:** Exploiting the liquidation mechanism to force-unliquidate or grief other users' positions.

**GMX-Style Example:**
1. Monitor for positions approaching liquidation threshold
2. Front-run liquidation transaction with higher gas
3. Attacker's position takes priority in ADL queue
4. Victim's healthy position becomes target for ADL instead

**Prevention:**
- Randomize liquidation keeper selection where possible
- Implement minimum health factor buffers before liquidation eligibility
- Use batch liquidation processing
- Monitor for unusual liquidation clustering

---

### 1.8 Griefing Attacks

**What it is:** Attacking protocol economics or用户体验 without direct profit, often by exploiting griefing-friendly mechanics.

**GMX-Style Example:**
- **ADL Griefing:** Continuously triggering ADL to push profitable positions into ADL queue, forcing losers to close at bad times
- **Order Book Spam:** Placing and canceling many orders to front-run legitimate traders
- **Position Hoarding:** Holding positions to manipulate funding rate calculations

**Prevention:**
- Implement minimum order sizes
- Add cancellation fees or gas costs
- Limit ADL queue manipulation through timing randomness
- Monitor for unusual activity patterns

---

### 1.9 Upgradeable Contract Risks

**What it is:** Proxy patterns introduce new attack surfaces including storage collisions, initialization flaws, and governance takeovers.

**GMX-Style Example:**
GMX uses the Diamond Proxy pattern (EIP-2535). Risks include:

1. **Storage Collisions:** Incorrect storage layout causes state corruption
2. **Initialization Attacks:** Proxy not initialized after deployment
3. **Selector Clash:** Different functions with same function selector
4. **Access Control on Upgrade:** Who can upgrade? How?

```solidity
// VULNERABLE - proxy without initializer protection
function initialize() external {
    // Anyone can call this!
    _transferOwnership(msg.sender);
}

// SECURE - initializer protection
function initialize() external initializer {
    _transferOwnership(msg.sender);
}
```

**Prevention:**
- Use proxy patterns from established libraries (OpenZeppelin)
- Implement `immutable` for critical variables
- Comprehensive storage layout audits before upgrades
- Multi-sig upgrade governance with timelocks
- Event monitoring for upgrade execution

---

### 1.10 Liquidity Pool Drain Attacks

**What it is:** Complete draining of a protocol's liquidity through various attack vectors.

**GMX-Style Example:**
1. **Route through GMX pools:** Attacker identifies vulnerability in pool exit logic
2. **Exploit withdrawal sequencing:** Withdraw before accounting updates
3. **Manipulate pool invariants:** Break constant product formula through manipulation

**Attack Vectors:**
- **Worker attack:** Exploit yield farming mechanics
- **Borrowing exploit:** Flash borrow to bypass collateral checks
- **Reward manipulation:** Claim more rewards than deposited

**Prevention:**
- Comprehensive access controls on all fund-moving functions
- Withdrawal limits and cooldown periods
- Integration security audits for all external protocol interactions
- Real-time monitoring with emergency shutdown capabilities

---

## 2. GMX-Specific Security Considerations

### 2.1 GMX Oracle System

**Architecture Overview:**
GMX uses a **multi-layer oracle system**:

1. **Primary: Aggregated Price Feed**
   - Combines prices from multiple sources
   - Weighted averages based on confidence scores
   
2. **Secondary: Fast Price Feed**
   - Used for position execution and liquidations
   - Updated by authorized "validators"
   - Lower latency but higher trust assumption

3. **Fallback: Chainlink Integration**
   - Backup price source
   - Used when Fast Price Feed is unavailable

**Attack Vectors:**

| Vector | Description | Severity |
|--------|-------------|----------|
| Validator Collusion | Multiple validators coordinate to report false prices | Critical |
| Single Validator Compromise | One validator's key is stolen | High |
| Price Feed Delay Exploitation | Front-run price updates to exploit stale prices | Medium |
| Emergency Oracle Attack | Force usage of backup oracle with manipulated data | High |

**Security Measures in GMX:**
- Multiple independent validators
- Price deviation limits between feeds
- Block-by-block price consistency checks
- Automatic switchover to Chainlink on deviation

---

### 2.2 ADL (Auto-Deleveraging) Mechanism

**What is ADL?**
When a position is being liquidated but no liquidators are available (or liquidator capacity is exceeded), ADL allows profitable traders' positions to be automatically closed in the opposite direction to maintain market balance.

**Risk Vectors:**

1. **Priority Queue Manipulation**
   - Attackers structure positions to always be first in ADL queue
   - Force unfavorable ADL on competitors

2. **ADL Timing Exploitation**
   - Trigger ADL at moments most advantageous to attacker
   - Force victims into ADL during high volatility

3. **Cascade ADL**
   - Multiple positions triggered simultaneously
   - Market impact causes cascading liquidations

**GMX's ADL Implementation:**
```solidity
// ADL occurs when:
- Position is profitable (loss for pool)
- Pool has too much liability
- No liquidators available OR liquidation limit exceeded
- ADL queue is triggered based on position size and profitability
```

**Security Considerations:**
- ADL should only trigger as last resort
- Queue ordering must be unpredictable
- Transparent ADL execution and events
- Maximum ADL execution limits per block

---

### 2.3 Liquidation Security

**GMX Liquidation Process:**
1. Keeper detects position below `minCollateral` or above `maxLeverage`
2. Keeper calls `liquidatePosition()`
3. Position's collateral is used to pay fees
4. Remaining collateral returned to user
5. Pool absorbs position's PnL

**Security Concerns:**

| Concern | Description |
|---------|-------------|
| Liquidation Threshold Manipulation | Push price just past threshold to grief trader |
| Partial Liquidation Exploits | Liquidate minimum to trigger cascade |
| Fee Extraction | Extract excessive fees through sandwiching |
| Liquidation Reserve Theft | Manipulation causes incorrect reserve accounting |

**GMX's Protections:**
- Minimum liquidation threshold buffer
- Liquidation fees incentivize proper liquidations
- Keeper network provides redundancy
- Emergency shutdown procedures

---

### 2.4 Funding Rate Manipulation

**Mechanism:**
GMX uses funding rates to balance long/short exposure. Every 8 hours, longs pay shorts (or vice versa) based on funding rate calculations.

**Attack Vectors:**

1. **Funding Rate Skew**
   - Accumulate large one-sided position
   - Manipulate funding rate calculation
   - Force opposite side to pay maximum funding
   - Squeeze competitors out of positions

2. **Funding Payment Timing**
   - Exploit timing window in funding rate calculation
   - Avoid funding payments while collecting from others

3. **Cross-Exchange Manipulation**
   - Manipulate prices on CEX to affect GMX funding calculation
   - Profit from resulting GMX funding payment

**Prevention:**
- Capped maximum funding rate per period
- Funding rate based on market-wide exposure, not just GMX
- Regular funding rate updates with buffers
- Monitoring for unusual position clustering

---

### 2.5 Order Front-Running

**GMX Order Types:**
- **Market Orders:** Execute immediately at current price
- **Limit Orders:** Execute at specified price or better
- **Stop Orders:** Trigger market order on price breach

**Front-Running Vectors:**

1. **Order Signature Sniping**
   - Monitor mempool for pending orders
   - Copy order with higher gas price
   - Execute before original order

2. **Price Impact Front-Running**
   - Detect large incoming order
   - Trade ahead to move price
   - Profit from victim's worse execution price

3. **Liquidation Front-Running**
   - Monitor for positions approaching liquidation
   - Front-run keeper liquidation
   - Claim liquidation bonus

**GMX's Protections:**
- Order execution off-chain or through private tx pools
- TWAPs reduce impact of large orders
- MEV protection through partner integrations
- On-chain order batching

---

## 3. How to Become a Smart Contract Auditor

### 3.1 Certifications

**CertiK**
- **CertiK Audit Certification:** Entry-level recognition for completing audits
- **CertiK KYC:** Background verification for projects
- Focus: Formal verification and automated analysis

**Trail of Bits**
- **Trail of Bits Security Audit Apprenticeship:** Intensive training program
- **ToB CTF Certifications:** Competitive security challenges
- Focus: Deep manual review and exploit development

**Consensys Diligence**
- **Smart Contract Audit Training:** Comprehensive curriculum
- **MythX Integration:** Automated security analysis tool training
- Focus: Smart contract specific auditing methodology

**Other Certifications:**
- **ICEBAR (Security Blue Team):** Intermediate audit skills
- **SANS SEC 555:** SIEM and security operations
- **Certified Blockchain Security Professional (CBSP):** Broad blockchain security

---

### 3.2 Practice Platforms

**Ethernaut (OpenZeppelin)**
- **Level:** Beginner to Intermediate
- **URL:** https://ethernaut.openzeppelin.com/
- **Focus:** Each level teaches a specific vulnerability pattern
- **Recommended Levels:**
  1. Fallback - Reentrancy basics
  2. Telephone - Access control
  3. Token - Integer overflow
  4. Delegation - Delegatecall vulnerabilities
  5. Force - Selfdestruct attacks
  6. Gatekeeper One - EVM mechanics
  7. Naught Coin - ERC20 vulnerabilities

**QuillCTF**
- **Level:** Intermediate to Advanced
- **URL:** https://quillctf.co/
- **Focus:** Real-world protocol vulnerabilities
- **Recommended Challenges:**
  - Puppy Raffle
  - Free Rider (NFT)
  - System
  - Damn Valuable NFT

**Sword of the Builder (Code4rena)**
- **Level:** Intermediate to Advanced
- **URL:** https://swordofthBuilder.code4rena.com/
- **Focus:** Audit contest simulations
- **Features:** Timed competitions, team play, realistic bug bounty scenarios

**Additional Practice Resources:**
- **SlowMist:** CTF challenges
- **Blockchain CTF:** Various blockchain vulnerabilities
- **Remix IDE:** Practice deploying and testing
- **Foundry/Chisel:** Advanced Solidity testing

---

### 3.3 Audit Reports to Study

**Foundational Reports:**

| Report | Why Study It |
|--------|--------------|
| OpenZeppelin Contracts Audit (Trail of Bits) | Gold standard for contract auditing |
| Uniswap V2 Audit (Trail of Bits) | DEX architecture and flash loan analysis |
| Compound Finance Audit (Quantstamp) | Lending protocol patterns |
| Aave V2 Audit | Lending and flash loan security |

**GMX-Specific Reports:**

| Report | Key Learnings |
|--------|---------------|
| GMX Audit by Trail of Bits | Oracle security, ADL mechanism, order execution |
| GMX Audit by CertiK | Proxy patterns, access control |
| OpenZeppelin GMX Review | Upgradeable contract security |

**How to Study Audit Reports:**
1. Read the executive summary first
2. Understand the scope and methodology
3. For each finding:
   - Understand the vulnerability
   - Review the affected code
   - Study the recommended fix
   - Consider how you would have found it

---

### 3.4 How to Get Your First Paid Audit

**Path 1: Bug Bounties First**
1. Start with Code4rena or Immunefi
2. Find low-complexity issues in established protocols
3. Build reputation with consistent quality findings
4. Receive invites to private audits
5. Transition to paid audits

**Path 2: Open Source Contributions**
1. Contribute to OpenZeppelin, Solmate, or similar
2. Build relationships with core developers
3. Get recommended for audit opportunities
4. Start with smaller scope audits

**Path 3: Training → Entry-Level**
1. Complete Ethernaut, QuillCTF, and certifications
2. Apply to audit firms (Trail of Bits, Consensys, CertiK)
3. Join as junior auditor
4. Shadow senior auditors
5. Take co-audit responsibility

**Portfolio Building Checklist:**
- [ ] Complete 5+ Ethernaut levels
- [ ] Solve 10+ QuillCTF challenges
- [ ] Find 3+ valid bug bounty issues
- [ ] Contribute to 1+ open source audit
- [ ] Write analysis of public audit reports
- [ ] Create proof-of-concept exploits

**Where to Find Work:**
- Code4rena (https://code4rena.com)
- Immunefi (https://immunefi.com)
- HackerOne (https://hackerone.com)
- LinkedIn: Search "smart contract auditor"
- Twitter: Follow @the_ethernaut, @quillctf, @code4rena

---

## 4. GMX Contract Audit Reports

### 4.1 Who Audited GMX?

**Primary Auditors:**

| Auditor | Date | Scope |
|---------|------|-------|
| Trail of Bits | 2021-2022 | Full protocol |
| CertiK | 2022 | Security review |
| OpenZeppelin | 2022 | Governance and proxy |

**Additional Reviews:**
- Internal security team reviews
- Community-driven security contests
- Ongoing bug bounty via Immunefi

### 4.2 Key Findings

**Trail of Bits Findings (Summary):**

| Severity | Finding | Status |
|----------|---------|--------|
| High | Price feed manipulation via emergency shutdown | Fixed |
| Medium | ADL queue can be gamed via multiple positions | Mitigated |
| Medium | Improper input validation in order execution | Fixed |
| Low | Front-running potential in order matching | Acknowledged |

**CertiK Findings (Summary):**

| Severity | Finding | Status |
|----------|---------|--------|
| High | Upgradeable proxy initialization vulnerability | Fixed |
| Medium | Insufficient event emission for critical actions | Fixed |
| Low | Missing replay protection on some functions | Fixed |

**Common Patterns Across Audits:**
1. Oracle price manipulation vectors
2. ADL mechanism fairness concerns
3. Access control on upgrade functions
4. Gas optimization opportunities

### 4.3 Verifying GMX's Security Posture

**On-Chain Verification Steps:**

1. **Verify Proxy Implementation**
```
- Check implementation address on Etherscan
- Confirm proxy is using approved pattern (Diamond/EIP-1167)
- Verify implementation is audited version
```

2. **Verify Governance Controls**
```
- Check multisig address (Gnosis Safe expected)
- Review timelock delay (48-72 hours typical)
- Monitor governance activity
```

3. **Monitor Security Parameters**
```
- Liquidation threshold changes
- Fee parameter modifications
- New token additions
- Handler/partner approvals
```

**External Verification:**
- Check Immunefi for active bug bounty
- Review Code4rena for any recent contests
- Monitor for new audit announcements
- Track security incident history

**Real-Time Monitoring:**
```javascript
// Example: Monitor GMX events
const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const gmxContract = new ethers.Contract(GMX_ADDRESS, GMX_ABI, provider);

// Watch for upgrade events
gmxContract.on("Upgraded", (implementation) => {
  console.log("New implementation:", implementation);
  // Alert security team
});

// Watch for large liquidations
gmxContract.on("LiquidatePosition", (account, size, collateral) => {
  if (size.gt(ethers.utils.parseEther("1000000"))) {
    // Alert for unusual activity
  }
});
```

---

## 5. Interview Questions for Security-Focused DeFi Roles

### Question 1: "How would you audit a perpetual DEX like GMX?"

**Expected Answer Structure:**

**1. Scope Definition**
- Identify all smart contracts in scope
- Map contract dependencies and upgrade proxy pattern
- Define audit timeline and methodology

**2. Information Gathering**
- Study protocol documentation and whitepaper
- Review previous audit reports
- Understand tokenomics and economic model

**3. Automated Analysis**
- Run Mythril, Slither, CertiK audit tool
- Check for common vulnerability patterns
- Verify compiler version and settings

**4. Manual Code Review**
```
Priority areas for perpetual DEX:
├── Oracle System
│   ├── Price feed aggregation logic
│   ├── Fast price feed trust assumptions
│   └── Fallback oracle behavior
├── Position Management
│   ├── Open/close position logic
│   ├── Collateral calculations
│   └── PnL accounting
├── Liquidation Mechanism
│   ├── Liquidation triggers
│   ├── Keeper incentives
│   └── Liquidation sequencing
├── ADL System
│   ├── ADL trigger conditions
│   ├── Queue ordering algorithm
│   └── Fairness considerations
├── Funding Rate
│   ├── Calculation methodology
│   ├── Update frequency
│   └── Cross-exchange manipulation
└── Order Execution
    ├── Front-running protection
    ├── Order matching logic
    └── Slippage protection
```

**5. Economic/Business Logic Review**
- Check for economic attack vectors
- Verify incentive alignment
- Review governance security

**6. Integration Testing**
- Test with mainnet fork
- Verify integrations with oracles
- Stress test edge cases

---

### Question 2: "Explain flash loan attacks and how to prevent them"

**Expected Answer:**

**Definition:**
Flash loan attacks exploit the ability to borrow unlimited funds within a single transaction with no upfront collateral, using the temporary capital to manipulate markets or exploit protocol logic.

**Classic Example (Beanstalk):**
```
Attack flow:
1. Flash borrow 1B+ in various stablecoins
2. Use funds to pass malicious governance proposal
3. Steal $182M from protocol treasury
4. Repay flash loans in same transaction
```

**Prevention Strategies:**

| Strategy | Implementation |
|----------|----------------|
| TWAP Oracles | Use time-weighted average prices instead of spot prices |
| Price Deviation Checks | Revert if price moves beyond threshold |
| Volume-Weighted Average | Weight prices by trading volume |
| Multiple Sources | Require consensus between independent oracles |
| Activity Limits | Cap maximum position size per block |
| Cooldown Periods | Require time between related actions |
| Commit-Reveal | Hide intent until block commitment |

**Code Example (TWAP Protection):**
```solidity
function getPrice(address token) internal view returns (uint256) {
    (uint256 price, uint256 updateTime) = chainlink.getLatestPrice(token);
    
    // Prevent stale prices
    require(
        block.timestamp - updateTime < MAX_PRICE_AGE,
        "Price is stale"
    );
    
    // Use TWAP for critical operations
    uint256 twapPrice = getTWAP(token, TWAP_DURATION);
    
    // Deviation check
    uint256 deviation = price > twapPrice 
        ? price - twapPrice 
        : twapPrice - price;
    require(
        deviation <= price * MAX_DEVIATION / 10000,
        "Price deviation too large"
    );
    
    return price;
}
```

---

### Question 3: "How does GMX's funding mechanism prevent manipulation?"

**Expected Answer:**

**Funding Rate Mechanism:**
GMX's funding rate is designed to balance long/short exposure by making one side pay the other based on the difference between mark and index prices.

**Formula:**
```
Funding Rate = (Mark Price - Index Price) * Funding Factor
Funding Payment = Position Size * Funding Rate
```

**Manipulation Prevention Techniques:**

| Technique | How it Works |
|-----------|-------------|
| **Mark-Index Spread Limiting** | Capped maximum difference between mark and index |
| **Funding Factor** | Reduces impact of small price differences |
| **8-Hour Settlement Period** | Prevents intraday manipulation cycles |
| **Market-Wide Funding** | Calculated across all positions, not per-trade |

**Attack Vectors Considered:**

1. **Mark Price Manipulation**
   - Problem: Attacker tries to move mark price to affect funding
   - Defense: Mark price is averaged across multiple sources and time periods

2. **Index Price Manipulation**
   - Problem: Manipulate underlying asset price on reference exchanges
   - Defense: Index is weighted average of multiple CEX/DEX prices

3. **One-Sided Position Buildup**
   - Problem: Accumulate large position to force funding rate extreme
   - Defense: Position size limits and market depth requirements

**Residual Risks:**
- Funding rate can still be gamed over longer timeframes
- Cross-exchange correlation allows some manipulation
- ADL system creates complex interactions with funding

---

### Bonus Questions

**Q: What is the difference between reentrancy and cross-function reentrancy?**

A: 
- **Reentrancy:** Same function is called recursively (e.g., `withdraw()` calling `withdraw()`)
- **Cross-function reentrancy:** Different functions on same/different contract share state and can be exploited (e.g., `withdraw()` and `transferTokens()` both modify balance)

**Q: How would you audit a proxy upgrade pattern?**

A:
1. Verify implementation is properly initialized
2. Check storage collision risks
3. Verify access control on upgrade function
4. Test upgrade execution in staging environment
5. Review new implementation for additional vulnerabilities

**Q: What is the most critical vulnerability class in DeFi today?**

A: Oracle manipulation remains critical because:
- Most protocols depend on external price data
- Manipulation can happen in single transactions
- Profits from manipulation can far exceed attack costs
- Defenses (TWAPs, multisource) are not universally implemented

---

## Appendix: Key Security Tools

| Tool | Purpose | Link |
|------|---------|------|
| Slither | Solidity static analyzer | trails of bits/slither |
| Mythril | EVM bytecode symbolic analysis | mythril.ai |
| Echidna | Fuzzing for smart contracts | trailofbits/echidna |
| Foundry | Development and testing framework | getfoundry.sh |
| CertiK | Automated audit tools | certik.com |
| OZ Defender | Security monitoring | openzeppelin.com/defender |

---

*This document is for educational purposes. Always conduct fresh research for specific audit engagements as the DeFi landscape evolves rapidly.*
