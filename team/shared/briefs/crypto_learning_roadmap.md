# Crypto Solidity/Blockchain Developer Learning Roadmap

**Target**: Land a blockchain developer job at a protocol like GMX or a perpetual DEX  
**Prerequisite**: General software engineering background  
**Timeline**: 16 weeks (4 months) of dedicated study  

---

## Table of Contents

1. [Phase 1: Solidity Fundamentals (Week 1-4)](#phase-1-solidity-fundamentals-weeks-1-4)
2. [Phase 2: DeFi Deep Dive (Week 5-8)](#phase-2-defi-deep-dive-weeks-5-8)
3. [Phase 3: Advanced & Specialization (Week 9-12)](#phase-3-advanced--specialization-weeks-9-12)
4. [Phase 4: Portfolio & Job Hunt (Week 13-16)](#phase-4-portfolio--job-hunt-weeks-13-16)
5. [Daily/Weekly Study Schedule](#dailyweekly-study-schedule)
6. [Free vs Paid Resources](#free-vs-paid-resources)
7. [Proof of Work Ideas](#proof-of-work-ideas)
8. [Mental Models](#mental-models)

---

## Phase 1: Solidity Fundamentals (Weeks 1-4)

**Goal**: Build a solid foundation in Solidity, understand EVM basics, deploy your first contracts

### Exact Resources

#### Courses (in order of priority)

1. **Free: Cryptozombies** (https://cryptozombies.io/)
   - Best interactive tutorial for absolute beginners
   - Complete all lessons (6 modules)
   - Time: ~1 week, 2-3 hours/day

2. **Free: Solidity by Example** (https://solidity-by-example.org/)
   - Read every contract example from "Hello World" through "English Auction"
   - This is your daily reference手册 for the first 2 months

3. **Free: SpeedRunEthereum** (https://speedrunethereum.com/)
   - Completes the "Basic" and "Intermediate" tracks
   - Teaches full-stack with Hardhat + Ethers.js + React
   - Time: ~3-5 days full-time or 1.5 weeks part-time

4. **Paid (Worth It): Alchemy's Solidity Bootcamp**
   - https://docs.alchemy.com/solidity-bootcamp
   - Free resources available, but their paid track adds structure
   - ~$100-300 if you opt for certificate track
   - Alternative free path: Combine SpeedRunEthereum + Solidity docs

5. **Free: OpenZeppelin's Contracts Wizard** (https://wizard.openzeppelin.com/)
   - Generate standard contracts (ERC20, ERC721, Ownable) and study the code it generates

#### Books (Optional but Valuable)

- **"Mastering Ethereum"** by Andreas Antonopoulos — Free online at https://github.com/ethereumbook/ethereumbook
- **"Solidity Commplicity"** by Hahn-Tech (free blog series on medium.com)

#### Documentation

- **Solidity Docs**: https://docs.soliditylang.org/ — Read the Language Description section fully
- **Ethers.js Docs**: https://docs.ethers.io/ — For frontend interaction

### Portfolio Projects (Build These)

#### Project 1: Simple Storage Contract (Week 1-2)
```
Contract: SimpleStorage
- Store and retrieve a uint256 value
- Emit events on state changes
- Deploy to a testnet (Sepolia or Goerli)
- Write a simple test suite with Hardhat
```
**What it demonstrates**: Basic syntax, storage, events, testing, deployment

#### Project 2: Token Faucet with Timelock (Week 2-3)
```
Contract: TokenFaucet
- ERC20 token distribution with cooldown period
- Owner can deposit tokens
- Users can claim once per 24 hours
- Reentrancy guard protection
```
**What it demonstrates**: ERC20 integration, access control, timing constraints, reentrancy awareness

#### Project 3: Simple Voting System (Week 3-4)
```
Contract: DecentralizedVoting
- Create proposals with description
- Token holders cast votes (yes/no/abstain)
- Vote counting with delegation option
- Proposal execution after quorum
```
**What it demonstrates**: Governance concepts, vote tracking, execution logic

### Practice Platforms (Ethernaut + CTFs)

#### Ethernaut (OpenZeppelin)
- **URL**: https://ethernaut.openzeppelin.com/
- **Target**: Complete levels 1-10 by end of Week 3, 11-15 by Week 4
- **Focus**: Each level teaches a specific vulnerability
- **Study approach**: Solve first, then read shared solutions on GitHub

#### Additional CTF Platforms
- **CaptureTheEther**: https://capturetheether.com/ (older but foundational)
- **Blocklahax**: https://blockchain-learning.org/ (more recent)
- **Paradigm CTF**: Look for past challenges on GitHub

### Common Pitfalls (Avoid These)

1. **Ignoring gas costs early** — Get in the habit of estimating gas for every function
2. **Not writing tests** — No tests = no credibility in crypto hiring
3. **Skipping events** — Events are critical for indexing; always emit meaningful events
4. **Using SafeMath in Solidity 0.8+** — Built-in overflow protection makes this redundant
5. **Hardcoding values** — Use constants and constructor parameters, not magic numbers
6. **Forgetting access control** — Every state-changing function needs modifiers
7. **Not understanding EVM storage layout** — Slot collision in proxy contracts is fatal

---

## Phase 2: DeFi Deep Dive (Weeks 5-8)

**Goal**: Understand how DeFi protocols work under the hood, especially AMMs and perpetual exchanges

### How AMMs Work (Uniswap v2/v3)

#### Learning Sequence

1. **Uniswap v2 Core** (study the contracts directly):
   - Factory: https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
   - Router: https://github.com/Uniswap/v2-periphery/blob/master/contracts/UniswapV2Router02.sol
   - Pair: Understand `mint()`, `burn()`, `swap()`, `getReserves()`
   - The x*y=k formula implementation

2. **Uniswap v3 Core** (new concepts):
   - Concentrated liquidity (liquidity in price ranges)
   - Tick-based pricing
   - Position NFTs (ERC721)
   - Study: https://github.com/Uniswap/v3-core

3. **Reading Material** (in order):
   - Uniswap v2 whitepaper (short, math-focused)
   - Uniswap v3 whitepaper (more complex, worth reading twice)
   - Blog: "How Uniswap Works" by Pintail on Medium

#### Key Concepts to Master
- Constant Product AMM: `x * y = k`
- Liquidity provision: LP tokens representing share of reserves
- Impermanent loss: calculation and implications
- Flash loans: atomic borrowing with repayment in single transaction
- Slippage and price impact
- TWAP vs market price

### Perpetual/Futures Protocols (GMX Model)

#### GMX Architecture (Study This Pattern)
GMX is a decentralized perpetuals exchange. Key components:

1. **Pool (GMX.sol)** — Handles deposits, withdrawals, collateral
2. **PositionRouter** — Accepts user orders (increase/decrease)
3. **OrderBook** — Manages limit orders
4. **Vault** — Risk management, price execution, liquidation

#### Key GMX Resources
- Main contract: https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/GmxVault.sol
- Read the protocol documentation at https://gmx.io/gmx-protocol
- Study the order flow: how user signal → execution → PnL settlement

#### GMX-Specific Concepts to Understand
- **Spot/exchange tokens**: GMX uses ETH, BTC, etc. as collateral
- **PnL calculation**: Realized vs unrealized profit/loss
- **Funding fees**: Balance long/short exposure
- **Liquidation threshold**: 80% of position value
- **Keepers**: External actors that execute orders (you'll write keeper code)
- **Referral rewards**: Code-based referral system

#### Other Perpetual Protocols to Study
- **dYdX** (now layer 3) — Order book model
- **GMX** — Decentralized Oracle model
- **Perpetual Protocol** — v1 was vAMM, v2 uses Curve's base
- **Kwenta** — Synthetix-based perpetuals

### Lending Protocols (Aave)

#### Aave v2 Architecture
- **LendingPool**: Core borrowing/lending logic
- **AToken**: Interest-bearing token (1:1 with deposited asset)
- **Health Factor**: `totalCollateral * liquidationThreshold / totalBorrows`
- **Liquidation**: Pay off unhealthy position, get collateral + bonus

#### Study Resources
- Aave v2 contracts: https://github.com/aave/aave-v2-core
- Aave v3 contracts: https://github.com/aave/aave-v3-core
- Documentation: https://docs.aave.com/

#### Key Lending Concepts
- Supply/borrow rates (interest rate models)
- Collateral switching
- Isolation mode (Aave v3)
- Credit delegation (Aave v3)

### How to Read Audit Reports

#### Reading Strategy
1. **Start with reports from top firms**: OpenZeppelin, Trail of Bits, Consensys Diligence, Certik
2. **Find a protocol you know** (Uniswap, Aave, Compound) and read their audit report
3. **Look for High/Medium severity findings** first — understand what went wrong
4. **Note remediation patterns**: What did the protocol do to fix issues?

#### Where to Find Reports
- Protocol GitHub repos (usually in `audits/` folder)
- Trail of Bits blog: https://blog.trailofbits.com/category/security-reviews/
- OpenZeppelin blog: https://blog.openzeppelin.com/
- Sherlock.xyz (audits for protocols on Sherlock)

#### What to Look For
- **Severity classification**: Critical, High, Medium, Low, Informational
- **Vulnerability categories**: Reentrancy, access control, oracle manipulation, arithmetic overflow
- **Fix verification**: Did the protocol actually implement the fix correctly?

### Mini-DeFi Project (Build This)

**Project: Build a Simplified AMM (Weeks 5-8)**

```
Tech Stack: Solidity + Hardhat + Ethers.js + React (frontend optional)

Core Contracts:
├── SimpleFactory.sol        — Create trading pairs
├── SimplePair.sol           — x*y=k AMM logic
│   ├── addLiquidity()       — Mint LP tokens
│   ├── removeLiquidity()    — Burn LP tokens, reclaim assets
│   ├── swap()               — Token exchange
│   └── getReserves()        — View current reserves
└── SimpleRouter.sol         — User-facing interface

Features to implement:
1. Create any ERC20/ERC20 pair via factory
2. Add/remove liquidity (mint/burn LP tokens)
3. Swap with slippage tolerance
4. View price and liquidity info
5. Emit comprehensive events for all actions
6. Full test suite (use Foundry for speed, or Hardhat)
7. Deploy to Sepolia testnet

Bonus stretch goals:
- Liquidity mining rewards (mint extra tokens to LP providers)
- Swap fee (take 0.3% of each trade)
```

**This project demonstrates**: Core AMM math, ERC20 handling, events for indexing, testing, deployment

---

## Phase 3: Advanced & Specialization (Weeks 9-12)

**Goal**: Master security, gas optimization, testing frameworks, and proxy patterns

### Smart Contract Security

#### The Big Vulnerability Categories

1. **Reentrancy**
   - External calls to untrusted contracts
   - Classic: EtherStore hack (Google it)
   - Patterns: Checks-Effects-Interactions, reentrancy guards
   - Tools: Slither reentrancy detectors

2. **Access Control**
   - Missing or flawed modifiers (onlyOwner, onlyAdmin)
   -tx.origin vs msg.sender
   - Initializing proxies incorrectly
   - **Famous case**: Parity Multisig hack (~$30M)

3. **Oracle Manipulation**
   - Flash loan attacks on price oracles
   - TWAP manipulation
   - **Famous case**: Mango Markets hack (~$117M)

4. **Arithmetic Bugs**
   - Overflow/underflow (mostly mitigated in 0.8+)
   - Rounding errors in fee calculations
   - **Famous case**: Beauty Chain (BEC) token overflow

5. **Logic Errors**
   - Wrong condition checks
   - State machine bugs
   - **Famous case**: Chainlink VRF bug (funds at risk)

6. **Front-Running**
   - MEV (Miner Extractable Value)
   - Sandwich attacks on DEX swaps
   - **Famous case**: Various DeFi exploits

#### Security Learning Resources

1. **SWC Registry**: https://swcregistry.io/ — Every Smart Contract Weakness
2. **Trail of Bits "How to Prevent" series**: Search their blog
3. **Sigma Prime's Solidity security blog**: https://www.sigmaprime.io/
4. **Cyfrin Updraft** (Patrick Collins' security course — free): https://updraft.cyfrin.io/

#### How Auditors Think

Auditors follow a methodology:

1. **Information gathering**: Specs, existing tests, previous audits, code review history
2. **Automate first**: Run Slither, Mythril, Semgrep for known patterns
3. **Manual review**: Trace every external call, every state change
4. **Attack thinking**: "How would I break this?"
5. **Report writing**: Categorize by severity, provide proof of concept, suggest fix

**To practice**: Read 3 audit reports line-by-line, then try finding bugs in contracts before reading the findings

### Gas Optimization

#### Common Techniques

1. **Storage packing**
   ```
   // Bad: 3 slots
   uint256 public a;
   uint256 public b;
   uint128 public c;
   
   // Good: 2 slots (c fits in a's slot with a)
   uint256 public a;
   uint128 public c;
   uint128 public b; // reordered
   ```

2. **Use events over storage for readable data**
   - Events cost less gas than storage writes
   - Can't read events from within contract (use for external consumption)

3. **Short-circuiting in conditionals**
   ```solidity
   // Put cheap operation first
   if (checkCheap() && checkExpensive()) { ... }
   ```

4. **Unchecked blocks for known-safe arithmetic**
   ```solidity
   // In 0.8+, overflow checked. Use unchecked for gas when you know it's safe:
   unchecked { counter++; }
   ```

5. **Memory vs calldata for function parameters**
   - calldata is cheaper (read-only, doesn't copy)
   - Use calldata for external function parameters

6. **Loop optimization**
   - Cache array length outside loop
   - Unchecked increment when safe

#### Gas Optimization Resources
- **Audit Book "Solidity Gas Optimization"**: https://github.com/0xMicrofase/solidity-gas-optimization
- **Y Hague's Gas Golfing GitHub**: https://github.com/y Hague/gas-golfing
- **Vitalik's "An Explainer for the Solidity Gas Optimization Differences"**

### Testing (Foundry/Hardhat + Coverage)

#### Foundry (Recommended — Faster and More Powerful)

**Why Foundry:**
- Written in Rust = blazing fast
- Fuzz testing built-in
- Inline test debugging
- Forge Std for clean testing syntax

**Learning Path:**
1. Install: https://github.com/foundry-rs/foundry
2. Read: https://book.getfoundry.sh/
3. Convert your Hardhat project to Foundry (optional but valuable exercise)

**Test Coverage Targets:**
- Aim for 90%+ line coverage
- 100% branch coverage for critical functions
- Fuzz tests for all arithmetic operations

#### Hardhat (Still Industry Standard, Especially for Frontend Teams)

**When to use Hardhat:**
- Team is already using TypeScript heavily
- Need extensive Truffle compatibility
- Frontend integration with Hardhat Runtime Environment

**Testing Stack:**
- Hardhat + ethers.js + Waffle + Chai
- For coverage: `hardhat-coverage` plugin
- For invariant testing: `hardhat-invariant`

#### Testing Best Practices
```solidity
// Example Foundry test structure
contract TestMyContract is Test {
    MyContract public myContract;
    
    function setUp() public {
        myContract = new MyContract();
    }
    
    // Unit test
    function testBasicFunction() public {
        vm.prank(user);
        myContract.deposit(100);
        assertEq(myContract.balanceOf(user), 100);
    }
    
    // Fuzz test (Foundry generates random inputs)
    function testFuzzDeposit(uint256 amount) public {
        vm.assume(amount > 0 && amount < 1e18);
        vm.prank(user);
        myContract.deposit(amount);
        assertEq(myContract.balanceOf(user), amount);
    }
    
    // Invariant test (property-based testing)
    function testInvariant_totalSupply() public {
        // Define a handler that calls contract functions
        // Assert that totalSupply never goes negative
    }
}
```

### Upgradeable Contracts / Proxy Patterns

#### Why Proxies Exist
- EVM can't upgrade contract code in place
- Proxy delegates calls to implementation while keeping state
- Used for protocol upgrades without migration

#### Proxy Patterns

1. **Transparent Proxy (openzeppelin)**
   - Admin can upgrade
   - Users interact with proxy directly
   - Gas: ~50k more per call than direct

2. **UUPS (Universal Upgradeable Proxy Standard)**
   - Implementation contains upgrade logic
   - More gas-efficient than transparent
   - Risk: buggy upgrade function can brick contract

3. **Diamond Pattern (EIP-2535)**
   - Multiple implementation contracts (facets)
   - Cut/add/remove functions
   - Complex but powerful (used by some large protocols)

#### Study Resources
- OpenZeppelin Proxy docs: https://docs.openzeppelin.com/upgrades-plugins/
- "Proxy Patterns" by OpenZeppelin (medium article)
- EIP-1967: Standard proxy storage slots

#### Security Considerations (Critical)
- Storage collisions (most common proxy bug)
- Initialize functions (uninitialized proxy can be taken over)
- Selector clashing

### EIP Standards

#### Essential EIPs to Know

| EIP | Name | When to Use |
|-----|------|-------------|
| ERC-20 | Token Standard | Most fungible tokens |
| ERC-721 | NFT Standard | One-of-a-kind tokens |
| ERC-1155 | Multi-token Standard | Mixed fungible/NFT |
| ERC-4626 | Tokenized Vault Standard | Yield-bearing vaults |
| ERC-721A | Cheaper NFT minting | NFT collections |
| ERC-4337 | Account Abstraction | Smart contract wallets |
| ERC-1271 | Signature Validation | Verify off-chain signatures |

#### DeFi-Specific EIPs

| EIP | Name | When to Use |
|-----|------|-------------|
| ERC-4626 | Tokenized Vaults | Lending protocols, yield strategies |
| ERC-2612 | Permit | Gasless approvals |
| ERC-3156 | Flash Loans | Flash lending standard |

#### How to Stay Current
- Monitor EIP repository: https://github.com/ethereum/EIPs
- Read "EIP Spotlight" posts on ethereum.org
- Follow EIP authors on Twitter

---

## Phase 4: Portfolio & Job Hunt (Weeks 13-16)

**Goal**: Build a compelling portfolio, network effectively, ace interviews

### What Portfolio Projects Stand Out

#### Tier 1: Impressive (Gets Interviews)

**1. Full AMM Implementation**
- Uniswap-style constant product AMM
- Includes liquidity provision, swapping, LP tokens
- Frontend or at minimum detailed README
- GitHub stars/help from community

**2. Perpetual/Options Protocol**
- Simplified perpetual futures
- Or binary options with pricing oracle
- Risk management logic included

**3. Yield Aggregator / Strategy Vault**
- ERC-4626 compliant vault
- Multiple strategy implementations
- Yield optimization logic

**4. Cross-chain Bridge or Message Passing**
- LayerZero or Wormhole integration
- Send messages across chains
- Verification logic on receiving chain

#### Tier 2: Good (Passes Screening)

- Governance system (DAO with voting, timelock, execution)
- Lending protocol (simplified Aave-like)
- NFT marketplace with Dutch auction / English auction
- Prediction market (binary outcomes)

#### Tier 3: Basic (Minimum Viable)

- Token contract with custom features (minting schedule, vesting)
- Multi-sig wallet
- Raffle/lottery contract with randomness

### Open Source Contributions That Matter

#### High-Impact Contributions

1. **OpenZeppelin Contracts** (https://github.com/OpenZeppelin/openzeppelin-contracts)
   - Improve documentation
   - Add test coverage
   - Small enhancements to existing contracts
   - Very selective, but PRs look great

2. **Solmate** (https://github.com/transmissions11/solmate)
   - Gas-optimized, minimalist contracts
   - Accepts contributions for new utilities
   - Shows you care about gas optimization

3. **Foundry** (https://github.com/foundry-rs/foundry)
   - Documentation improvements
   - Bug reports with reproduction cases
   - Test contributions

4. **Protocol Bug Bounties**
   - GMX Bug Bounty on Immunefi
   - Even finding low/medium bugs demonstrates skill

#### How to Find Meaningful Contributions

1. Look for issues labeled "good first issue" or "help wanted"
2. Read CONTRIBUTING.md files
3. Fork, develop, open PR with clear description
4. Engage in protocol Discord dev channels

### How to Network in Crypto

#### Online Presence (Start Now)

1. **Twitter/X**: Follow and engage with protocol founders and devs
   - @gmx_io, @Uniswap, @aave, @VitalikButerin
   - Share your learning progress
   - Post about projects you're building
   - Minimum: lurk and engage thoughtfully

2. **GitHub**: Make all your work public
   - Clean commit history
   - README files that explain what/why
   - Link to deployed contracts on Etherscan

3. **Warroom Discords**: Join protocol dev channels
   - GMX Discord (especially #dev-chat)
   - Uniswap Discord
   - Aave Discord
   - Contribute to technical discussions

#### In-Person Networking

1. **ETHGlobal Hackathons** (https://ethglobal.com/)
   - Attend 1-2 hackathons
   - Even 2nd place submissions get attention
   - Team members often get hired together

2. **Local Ethereum Meetups**
   - Find via https://www.meetup.com/
   - Present your learning projects

3. **Devcon (Annual)**: Major Ethereum conference

### Resume/CV for Crypto Apps

#### Structure (1-page max for ATS compatibility)

```
[Your Name] — Blockchain Developer
[Email] | [Twitter handle] | [GitHub] | [LinkedIn] | [Portfolio URL]

EXPERIENCE
[Previous Job Title] — [Company] | [Dates]
- Built [X] that [impact metric]
- Contributed to [protocol/team]

PROJECTS
[Project Name] | [GitHub] | [Deployed URL]
- What it does and tech stack
- Notable: [users, TVL, awards]

SKILLS
Solidity, Foundry, Hardhat, Ethers.js, Chainlink, OpenZeppelin, 
TypeScript, React, The Graph, IPFS

EDUCATION
[Degree] — [University] | [Year] (only if < 3 years exp)

ADDITIONAL
- ETHGlobal [Event] — [Award if any]
- [Open source contributions]
```

#### Crypto-Specific Resume Tips

- **Include deployed contract addresses** (verify on Etherscan)
- **Link to audit reports** if your code was audited
- **Show measurables**: TVL held, transactions processed, users
- **List bug bounties found** (even low severity)
- **Add wallet address** for ERC-20 verification (some teams check)

### Interview Preparation

#### Technical Interview Formats in Crypto

**Format 1: Live Coding**
- Similar to LeetCode but Solidity-specific
- Problems: gas optimization, fixing buggy contracts, building mini-protocols
- Example: "Write a function that returns true if the address is a contract"

**Format 2: Protocol Deep Dive**
- Explain how Uniswap calculates price impact
- Walk through the Aave liquidation process
- How would you build a limit order on GMX?

**Format 3: Security Review**
- Given a contract with bugs, find and fix vulnerabilities
- 30-60 minutes with a vulnerable contract
- Whiteboard attack scenarios

**Format 4: Take-Home Project**
- Build a specific thing in 1-2 weeks
- More common at larger companies
- Usually followed by code review interview

#### Common Technical Questions

1. **Solidity Basics**
   - Explain memory vs storage vs calldata
   - What is the receive function vs fallback?
   - How do you prevent reentrancy?

2. **EVM Mechanics**
   - What happens when you call a non-existent function?
   - Explain EVM storage layout
   - What is extcodesize check?

3. **DeFi Mechanics**
   - How does impermanent loss occur?
   - Explain how a flash loan works
   - How would you calculate slippage?

4. **Security**
   - Walk through a typical audit process
   - What tools do you use for security analysis?
   - Describe a vulnerability class and how to prevent it

#### General Crypto Knowledge to Know

- **Block building**: What do validators/sequencers do?
- **Finality**: Different finality guarantees across L1s
- **Layer 2**: Optimistic rollups vs ZK rollups
- **MEV**: What is it, how does it affect users?
- **Oracles**: Chainlink, Uniswap TWAP, custom
- **Current events**: Major hacks, protocol launches, regulatory news

---

## Daily/Weekly Study Schedule

### Realistic Time Commitment

| Situation | Hours/Day | Hours/Week | Feasibility |
|-----------|-----------|------------|-------------|
| Full-time study | 6-8 hours | 40-50 hours | 4 months |
| Part-time (job) | 3-4 hours | 20-25 hours | 6-8 months |
| Intensive (bootcamp) | 8-10 hours | 50-60 hours | 3 months |

### Weekly Structure

#### For Full-Time Learners

```
Monday-Friday:
├── 09:00-12:00  — Deep work: Reading source code, building
├── 12:00-13:00  — Lunch + Twitter/News
├── 13:00-16:00  — Coding: Projects, tutorials follow-along
├── 16:00-17:00  — Exercise/break
├── 17:00-19:00  — CTFs, Ethernaut challenges
└── 20:00-21:00  — Content: YouTube, podcasts, newsletters

Weekends:
├── Saturday     — Light: Read blog posts, review week's work
└── Sunday       — Rest day (important for retention)
```

#### For Part-Time Learners (After Work)

```
Daily (2-3 hours):
├── 19:00-20:00  — Structured learning (course, tutorial)
├── 20:00-21:00  — Coding (project work, exercises)
└── 21:00-21:30  — Reading (newsletter, docs)

Weekend (4-6 hours total):
├── Saturday AM  — Project work
└── Sunday PM    — Review + light reading
```

### How to Stay Current

#### Daily (15-30 min)

1. **Twitter/X Feed** (curated list)
   - Create a list: "Crypto Devs" with protocol accounts
   - Check morning and evening
   - Engage with thoughtful comments (not moon farming)

2. **Email Newsletter**
   - **Week in Ethereum** (https://weekinethereum.substack.com/) — Weekly
   - **The Defiant** — Daily (DeFi focus)
   - **Bankless** — Weekly podcast + newsletter

#### Weekly (2-4 hours)

1. **Podcasts**
   - **Zero Knowledge** (ZK, privacy tech)
   - **The Breakroom** (development focused)
   - **Into the Ether** (Ethereum ecosystem)

2. **Community Calls**
   - Protocol governance calls (open to observers)
   - Aave, Uniswap, Compound governance

3. **Research Papers**
   - arXiv crypto category: https://arxiv.org/list/cs.CR/recent
   - Read abstracts of relevant DeFi papers

### Best Communities for Learning

#### Discords

| Server | Focus | Link |
|--------|-------|------|
| Ethereum Cat Herders | General ETH, governance | ethereumblockchaincommunity.com |
| Developer DAO | Builders community | developerdao.com |
| Learn Web3 DAO | Learning together | learnweb3.io |
| CodeHawke | Auditing, security | (search Discord) |
| GMX | Protocol-specific dev chat | gmx.io |

#### Telegram Groups

| Group | Focus |
|-------|-------|
| Solidity Developers | General Solidity Q&A |
| Ethereum Research | Deep technical discussion |
| DeFi Saver | Lending, liquidation |
| MEV Watch | Block builder news |

#### Subreddits

- r/ethdev — Developer questions
- r/defi — DeFi news and discussion
- r/ethereum — General ETH
- r/solidity — Solidity questions

---

## Free vs Paid Resources

### Paid Courses — Worth It?

| Course | Price | Verdict | When to Use |
|--------|-------|---------|-------------|
| **Alchemy University** | Free core, $200 for certificate | ✅ Worth it | Core curriculum after SpeedRunEthereum |
| **Patrick Collins (Cyfrin) Courses** | Free YouTube | ✅ Best free | Primary learning resource |
| **Chainlink Bootcamp** | Free | ✅ Good | Oracle integration |
| **Questbook** | Free | ✅ Good | Quest-based learning |
| **Ivan on Tech Academy** | $30-50/mo | ⚠️ Mixed | Some good content, some outdated |
| **Moralis Academy** | $99-299/mo | ⚠️ Overpriced | Better free options exist |
| **Buildspace** | Free | ✅ Great | Project-based, good community |

### Best Free Resources

#### Documentation & Tutorials

1. **SpeedRunEthereum** (speedrunethereum.com) — ⭐ Start here
2. **Solidity by Example** (solidity-by-example.org) — ⭐ Daily reference
3. **Crypto Zombies** (cryptozombies.io) — ⭐ First week
4. **OpenZeppelin Contracts Wizard** — Generate and study code

#### YouTube Channels

| Channel | Focus |
|---------|-------|
| **Patrick Collins** | All-around Solidity, security |
| **Smart Contract Programmer** | Advanced Solidity, Gas, Yul |
| **Dapp University** | Full-stack dapp tutorials |
| **Chainlink** | Oracle integration |
| **Alchemy** | Developer tutorials |

#### Interactive Learning

- **Ethernaut** — Security through hacking
- **CaptureTheEther** — Older but solid
- **ChainShot** — Browser-based compiler

#### blogs & Long-form

- **OpenZeppelin Blog** — Security, upgrades
- **Trail of Bits Blog** — Security research
- **Vitalik's Blog** — Protocol design, philosophy
- **Penn Blockchain Blog** — Academic rigor

---

## Proof of Work Ideas

### Specific Projects with Tech Specs

#### Project 1: Yield-Bearing Token Vault (ERC-4626)

```
Specification:
- Deposit ERC-20, receive yield-bearing token
- Strategy interface for yield sources
- Weekly yield distribution
- Keepers trigger harvest()

Tech Stack: Solidity + Foundry + OpenZeppelin
Timeline: 2-3 weeks

Success Metrics:
- Completes ERC-4626 compliance tests
- Integrates with at least one real yield source (e.g., Aave)
- Gas optimized (< 200k gas for deposit)
```

#### Project 2: Prediction Market

```
Specification:
- Binary outcomes (Yes/No)
- Market creation with liquidity
- Pyth Network price oracle integration
- Settlement after event resolution

Tech Stack: Solidity + Chainlink or Pyth + Foundry
Timeline: 3-4 weeks

Success Metrics:
- Creates and resolves markets
- Integrates real oracle data
- Frontend for trading
```

#### Project 3: Multi-sig Wallet with Time-lock

```
Specification:
- M-of-N approvals required
- Time-lock queue for large tx (> 1 ETH)
- Cancel functionality
- ERC-1271 signature validation

Tech Stack: Solidity + Hardhat + Ethers.js
Timeline: 1-2 weeks

Success Metrics:
- Works with hardware wallet signing
- All edge cases tested
- Frontend for tx management
```

#### Project 4: Liquidity Gauge (Curve-style staking)

```
Specification:
- Stake LP tokens, earn protocol rewards
- Reward distribution weighted by lock time
- Gauge weight voting for emissions allocation

Tech Stack: Solidity + Foundry + OpenZeppelin
Timeline: 2-3 weeks

Success Metrics:
- Correct reward calculations
- Integration with voting system
- Gas efficient at scale
```

### How to Demonstrate Impact in Crypto

#### Dune Analytics Dashboards

- Create public dashboards showing protocol metrics
- Example: Your AMM's trading volume, unique traders, TVL over time
- Share on Twitter with contract addresses

#### Code Reviews / Blog Posts

- Write analysis of how a protocol works (Medium, Hashnode, personal blog)
- "How GMX Calculates PnL" or "Understanding Uniswap v3 Ticks"
- These demonstrate you understand the "why"

#### Bounty Hunting

- Register on Immunefi, HackerOne, or CodeHawke
- Even $50 bounties show up on your profile
- Shows real-world security mindset

#### Audit Participation

- Read audits and note findings
- Try finding bugs in past audit targets before reading the report
- Share analysis in blog post

---

## Mental Models

### How Crypto Hiring Differs from Traditional Tech

| Aspect | Traditional Tech | Crypto |
|--------|------------------|--------|
| **Hiring Timeline** | 2-4 months | 1-8 weeks (fast-moving) |
| **Resume Importance** | High (filter through ATS) | Medium (work speaks louder) |
| **Code Test Format** | LeetCode algorithms | Live Solidity, protocol design |
| **Culture Fit** | Interviews in sterile rooms | Twitter check, Discord presence |
| **Remote** | Sometimes | Almost always |
| **Compensation** | Salary + RSUs | Salary + protocol tokens (vested) |
| **Location** | Hub-dependent | Fully remote friendly |
| **Hierarchy** | Formal, siloed | Flat, collaborative |

### What Interviewers Actually Look For

#### Primary Indicators

1. **You can write Solidity without Google** — Syntax fluency
2. **You understand security** — Can identify attack vectors
3. **You know gas costs** — Not wasteful with storage
4. **You read docs and source code** — Not tutorial-dependent
5. **You ship things** — Portfolio with deployed contracts

#### Secondary Indicators

1. **You understand DeFi mechanics** — Not just Solidity syntax
2. **You're plugged in** — Know current events, standards
3. **You collaborate well** — Discord communication skills
4. **You ask good questions** — About the protocol, the team, the challenges

#### Red Flags

- Can't explain their own code
- Only followed tutorials, no original work
- Doesn't know what a proxy is
- Thinks "blockchain" means "database"
- Only cares about crypto prices, not tech

### Crypto Community Culture

#### What "Getting It" Means

**1. Philosophical Alignment**
- Care about decentralization, trust-minimization
- Believe in permissionless innovation
- Understand tradeoffs (UX vs decentralization)

**2. Technical Humility**
- "I don't know, let me check" is valid
- Admit when you haven't tested something
- Willing to read source code over relying on docs

**3. Community Participation**
- Help others learn (answer questions, write posts)
- Give credit to work you build on
- Engage in governance thoughtfully

**4. Long-term Thinking**
- Not chasing airdrops or quick gains
- Building for sustainability
- Care about protocol longevity

#### How to Demonstrate You "Get It"

1. **Write** — Blog posts, README improvements, documentation
2. **Contribute** — Issues, PRs, bug reports
3. **Engage** — Thoughtful Twitter presence, Discord help
4. **Build** — Ship code that works, not just for show
5. **Learn Publicly** — Share your learning journey

#### Signs You're Ready for a Job

- Can read a Uniswap pair contract and explain every line
- Can identify at least 5 potential attack vectors in an unfamiliar contract
- Have deployed and verified contracts on mainnet
- Have contributed to a codebase (even docs)
- Can explain what happens when you call `transfer()` on an ERC-20

---

## Appendix: Quick Reference

### Essential Tools to Install (Week 1)

```bash
# Node.js (via nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Foundry (fast Solidity testing/deployment)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Hardhat (industry standard)
npm install -g hardhat

# Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# VSCode Extensions
# - Solidity (Juan Blanco)
# - Prettier
# - GitLens
```

### Key Contract Patterns (Bookmark These)

```solidity
// Checks-Effects-Interactions pattern
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    
    // Effect first
    balances[msg.sender] -= amount;
    
    // Interaction last
    payable(msg.sender).transfer(amount);
}

// Reentrancy guard
uint256 private constant _NOT_ENTERED = 1;
uint256 private constant _ENTERED = 2;
uint256 private _status;

modifier nonReentrant() {
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
}

// Pull payment pattern (safer than push)
mapping(address => uint256) public payments;
function withdraw() external {
    uint256 payment = payments[msg.sender];
    payments[msg.sender] = 0;
    payable(msg.sender).transfer(payment);
}
```

### Security Checklist (Before Every Deployment)

- [ ] All functions have access control modifiers
- [ ] All external calls are checked for revert
- [ ] Events emitted for all state changes
- [ ] Overflow checks in place (or using 0.8+)
- [ ] Gas costs considered for all functions
- [ ] Test suite covers >80% of code
- [ ] Contracts verified on Etherscan
- [ ] Admin keys are multisig, not single EOA

---

**Document Version**: 1.0  
**Last Updated**: 2026  
**Maintainer**: Hermes Agent — SocraticBlock Workspace  
**License**: CC BY-SA 4.0 — Share freely, attribute required
