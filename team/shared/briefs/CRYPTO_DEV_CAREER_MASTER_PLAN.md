# 🚀 CRYPTO DEVELOPER CAREER MASTER PLAN
### From Zero to GMX Developer — The Complete Roadmap

---

> **Tone**: Direct, practical, no fluff
> **Time investment**: 16 weeks at 20-30 hrs/week for full roadmap; 30 days for accelerated sprint
> **End goal**: Land a smart contract developer role at GMX or a similar perpetual DEX protocol

---

## 📁 ALL RESEARCH DOCUMENTS

This master plan references the following deep-dive documents:

| Document | Size | What It Covers |
|---|---|---|
| `gmx_research.md` | 16KB | GMX company overview, tech stack, hiring, application strategy |
| `gmx_technical_deep_dive.md` | 31KB | GMX smart contract architecture, audits, development workflow |
| `GMX_JOB_SEEKER_DOSSIER.md` | 35KB | **THE GMX BIBLE** — tech stack, 5 interview questions, getting hired |
| `GMX_30DAY_SPRINT.md` | 10KB | Day-by-day 30-day action plan |
| `crypto_jobs_research.md` | 15KB | Perpetual DEX landscape, salaries, job boards, skills in demand |
| `crypto_learning_roadmap.md` | 35KB | 16-week learning plan with resources, projects, mental models |
| `crypto_security_audit.md` | 28KB | Smart contract vulnerabilities, auditing skills, GMX-specific risks |
| `crypto_daily_intelligence_routine.md` | 22KB | Daily information diet, weekly activities, community playbook |
| `CRYPTO_INTERVIEW_PREP_DECK.md` | 41KB | 40+ interview questions with detailed answer frameworks |

---

## ⚡ QUICK START — Choose Your Timeline

### 🖥️ If You Have 30 Days (Use `GMX_30DAY_SPRINT.md`)
The 30-day sprint is an accelerated path. Follow it exactly. Do not deviate. Every day is mapped out.

### 📅 If You Have 3 Months (Use `crypto_learning_roadmap.md`)
The 16-week roadmap is the comprehensive version. It goes deeper on fundamentals and gives you more time to absorb.

### 🎯 If You Have 6+ Months (Blend Both)
Start with the 16-week roadmap, then do the 30-day sprint as a final review before applying.

---

## 🏢 PRIORITY APPLICATION LIST

**Tier 1 — Apply First (Highest probability + best fit):**
1. **GMX** — Primary target. Dossier: `GMX_JOB_SEEKER_DOSSIER.md`
2. **Arbitrum Foundation** — Core L2, huge team, smart contracts in Solidity
3. **Optimism (OP Labs)** — Similar to Arbitrum
4. **Base (by Coinbase)** — Growing fast, onchain development
5. **Uniswap Labs** — Golden standard DeFi, hires Solidity devs

**Tier 2 — Apply Second (Strong companies, slightly harder to get into):**
6. **Level Finance** — Perpetual DEX on BNB Chain, aggressive hiring
7. **Gains Network** — gTrade, perpetual FX
8. **ApolloX** — Perp DEX on Arbitrum
9. **Aave Companies** — Protocol V3, lens, more
10. **Synthetix** — Derivatives liquidity protocol

**Tier 3 — Apply Third (Premium but harder):**
11. **dYdX** — Moving to Cosmos v4, Rust not Solidity (shift skills)
12. **Vertex Protocol** — Perpetual + spot DEX
13. **zkSync (Matter Labs)** — ZK rollup, Cairo skills premium
14. **StarkNet (StarkWare)** — Cairo, different paradigm
15. **Jump Crypto / Wintermute** — Trading firms, high comp

---

## 💼 GMX APPLICATION DOSSIER

*(Full version in `GMX_JOB_SEEKER_DOSSIER.md`)*

### What GMX Builds
GMX is a decentralized perpetual trading protocol allowing up to 50x leverage on crypto forex, commodities, and indices. It's built on **Arbitrum** (primary) and **Avalanche**. Revenue comes from position fees, borrowing fees, swap fees, and funding fees.

### Tech Stack
- **Smart Contracts**: Solidity + Hardhat
- **Frontend**: React, TypeScript, wagmi, @tanstack/react-query
- **Backend**: Node.js, The Graph, custom Subsquid indexers
- **Blockchain**: Arbitrum One, Avalanche C-Chain

### The 5 GMX Questions (You'll Be Asked These)
1. **How does GMX's oracle system work?** → Oracle prices must be from AFTER order creation timestamp
2. **Explain GMX's funding mechanism** → Long/short balance, funding rate payments every 8 hours
3. **What is ADL and when does it trigger?** → Auto-Deleveraging when pool can't cover profitable positions
4. **How would you audit the GMX Vault contract?** → Focus on PnL capping, liquidation logic, ADL trigger conditions
5. **Explain GMX's fee structure** → Position fees (0.1-1%) + borrowing fees (kink model) + funding fees

### How to Actually Get Hired at GMX
**Path 1 — Community Contribution (BEST)**: Contribute to GMX GitHub, participate in governance forums, answer questions in Discord genuinely. GMX values people who show up and contribute before asking for a job.

**Path 2 — Referral**: Find someone who works at GMX on LinkedIn. Message them about the protocol, not about a job. After genuine conversation, ask if they can refer you.

**Path 3 — Direct Apply**: Apply at gmx.io/careers. Less effective but still viable. Check weekly — postings appear and disappear.

### Salary Ranges (From Public Sources)
- **Junior-Mid Solidity Dev**: $120K-$180K base + token grants
- **Senior Solidity Dev**: $180K-$300K base + significant token grants
- **Total comp can reach $400K+** at top protocols with bull market token prices

---

## 📚 EXACT STUDY PATH

### Week 1-4: Solidity Fundamentals
See `crypto_learning_roadmap.md` Phase 1 for exact resources.

**Must complete:**
- Cryptozombies (chapters 1-8)
- SpeedRunEthereum (challenges 1-5)
- Solidity by Example (first 15 examples)
- Build: MiniVault contract with Hardhat (deposit/withdraw/balance)
- Build: MiniAMM contract with swap + addLiquidity
- Deploy both to Sepolia testnet
- Ethernaut challenges 1-10

### Week 5-8: DeFi Deep Dive
See `crypto_learning_roadmap.md` Phase 2.

**Must complete:**
- Read and understand Uniswap v2 and v3 (whitepapers + source code)
- Study GMX Synthetics architecture: read README, trace through deposit/withdraw/order execution flows
- Build: Mini Perpetual (simplified) — open/close/liquidate positions
- Audit: Read 3 GMX audit reports (from Trail of Bits, OpenZeppelin, CertiK)
- Ethernaut challenges 11-15

### Week 9-12: Advanced + Security
See `crypto_learning_roadmap.md` Phase 3 and `crypto_security_audit.md`.

**Must complete:**
- Security: Reentrancy, oracle manipulation, access control, flash loan attacks
- Foundry: Rewrite your Mini Perpetual with Foundry, write fuzz tests
- Gas optimization: Apply to your contracts, measure with `forge test --gas-report`
- Study: OpenZeppelin contracts (ERC20, Ownable, ReentrancyGuard, Pausable)
- Study: EIP-2535 Diamond Pattern, UUPS proxy pattern

### Week 13-16: Portfolio + Interview Prep
See `crypto_learning_roadmap.md` Phase 4 and `CRYPTO_INTERVIEW_PREP_DECK.md`.

**Must complete:**
- Portfolio: Clean GitHub with 3 projects (MiniVault, MiniAMM, MiniPerp)
- Apply to 20+ positions (use priority list above)
- Practice: Answer all 40 interview questions out loud
- Network: Active in GMX Discord, governance forums, Twitter

---

## 🎤 INTERVIEW PREP CRAM SHEET

*(Full deck in `CRYPTO_INTERVIEW_PREP_DECK.md`)*

### GMX-Specific Must-Know

**Technical Concepts:**
- Oracle prices must be set AFTER order creation (prevents front-running)
- ADL triggers when poolPnl / poolCollateral exceeds threshold
- Funding fees paid every 8 hours to balance long/short exposure
- GMX v2 has per-market pools vs v1's single GLP pool
- Key contracts: Vault, OrderHandler, DepositHandler, ExchangeRouter, RoleStore

**Design Questions They Love:**
- "How would you prevent oracle manipulation in a perpetual protocol?"
- "Design a liquidation mechanism that prevents flash loan attacks"
- "Walk through the lifecycle of a GMX trade from deposit to PnL settlement"

### General Solidity Must-Know
- call vs delegatecall vs staticcall
- Checks-Effects-Interactions (CEI) pattern
- Storage vs memory vs calldata
- Reentrancy + how to prevent it
- Overflow in Solidity 0.8+ (checked) vs 0.7 (wrapping)
- Mapping + struct patterns for position tracking
- Access control (onlyOwner, roles)
- Proxy patterns (UUPS vs Transparent)

### DeFi Mechanics Must-Know
- AMM x*y=k formula and price impact
- Uniswap v2 vs v3 key differences
- Flash loan attack anatomy
- Liquidation mechanism (health factor, bonus)
- MEV and sandwich attacks
- TWAP vs spot price for oracle protection

---

## 📋 90-DAY SPRINT

### Days 1-30: Foundation
Follow `GMX_30DAY_SPRINT.md` exactly.

### Days 31-60: Deep Work
- Build and deploy Mini Perpetual with Foundry
- Deploy to Arbitrum Sepolia testnet
- Write 50+ test cases + fuzz tests
- Study GMX contract architecture end-to-end

### Days 61-90: Interview Mode
- Practice all interview questions daily
- Apply to Tier 1 + Tier 2 positions
- Engage in GMX governance and Discord
- Submit bug reports to GMX bug bounty if available

---

## 🗓️ DAILY INTELLIGENCE ROUTINE

*(Full version in `crypto_daily_intelligence_routine.md`)*

**Every Morning (15 min):**
- Check GMX Discord for new discussions
- Scan Twitter feed for GMX and DeFi news
- Read one newsletter (The Block, Bankless, or Week in DeFi)

**Every Week (2-4 hrs):**
- Build: 1 feature or fix in your portfolio project
- Network: 2 genuine outreach messages to people in crypto
- Track: Update application tracking spreadsheet

**Every Month:**
- Review your learning progress
- Adjust study focus based on job requirements
- Read 1 audit report from a major protocol

---

## 🔑 THE ONE THING

If you do ONE thing and skip everything else: **build a Mini GMX**.

A working perpetual trading contract that you can demonstrate:
- Open a position with leverage
- Close with PnL
- Liquidate when margin is insufficient
- All deployed on testnet with tests

This is worth more than any certification or course completion. Ship it.

---

## 📍 FIRST 90 DAYS AT GMX (What Success Looks Like)

*(If you get hired)*

**Month 1:**
- Understand the deposit/withdrawal flow end-to-end
- Submit your first PR (even if small — docs, tests, refactors count)
- Shadow one production deployment or incident
- Be active in team channels, ask questions

**Month 2:**
- Own a feature from spec to deployment
- Write tests for 80%+ coverage on your feature
- Contribute to an audit response or security review
- Understand the GMX tokenomics and revenue model

**Month 3:**
- Ship something users interact with
- Begin taking on oncall rotation
- Identify one area for improvement and propose a solution
- Understand how the team makes decisions (governance, proposals)

---

## ✅ YOUR CHECKLIST — START HERE

- [ ] Read `GMX_JOB_SEEKER_DOSSIER.md` (35KB — THE bible)
- [ ] Read `CRYPTO_INTERVIEW_PREP_DECK.md` (41KB — 40 questions)
- [ ] Follow `GMX_30DAY_SPRINT.md` if 30 days or `crypto_learning_roadmap.md` if 3+ months
- [ ] Start building today — deploy a contract to testnet this week
- [ ] Join GMX Discord and introduce yourself
- [ ] Apply to first 3 jobs within 2 weeks of starting

---

*Last updated: 2026-04-28*
*Documents compiled from: GMX GitHub (official), Context7 docs, DeFi protocol research, smart contract security standards*
