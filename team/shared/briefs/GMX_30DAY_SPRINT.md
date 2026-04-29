# GMX Developer 30-Day Sprint
**The exact plan to go from "interested in crypto" to "ready to apply to GMX"**

---

## Philosophy

This sprint is designed to maximize your chances of landing a GMX (or similar perpetual DEX) developer role within 30 days. It assumes you're working full-time on this, or dedicating 4-6 hours/day. If you're working part-time, double the timeline.

The goal is not to learn everything — it's to build the SPECIFIC knowledge and portfolio items that GMX cares about.

---

## Week 1: Foundation (Days 1-7)

### Day 1: DeFi Mental Model
**Goal:** Understand what GMX actually does. Not how it works yet — WHY it exists.

- [ ] Read the GMX documentation at docs.gmx.io (or archived version)
- [ ] Watch: "How GMX Works" video on YouTube (search "GMX perpetuals explained")
- [ ] Use GMX on testnet or mainnet: make a small deposit, place a market order, understand the UI
- [ ] Write a 1-page summary: "What is GMX and why does it matter?"

### Day 2-3: Solidity Fundamentals
**Goal:** Be able to read and write basic Solidity. You don't need to be an expert, but you need to be comfortable.

- [ ] Complete CryptoZombies (chapters 1-5): https://cryptozombies.io/
- [ ] Complete SpeedRunEthereum (challenges 1-3): https://speedrunethereum.com/
- [ ] Read: Solidity by Example (first 10 examples): https://solidity-by-example.org/
- [ ] Project: Write a simple smart contract that accepts deposits and tracks balances (like a mini-vault)
- [ ] Deploy it on a testnet using Hardhat

### Day 4-5: Hardhat & Testing
**Goal:** Set up a professional development environment and write tests.

- [ ] Set up a Hardhat project from scratch
- [ ] Write a Solidity contract with at least 3 functions
- [ ] Write comprehensive tests using Hardhat (at least 10 test cases)
- [ ] Deploy to Sepolia or Arbitrum Sepolia testnet
- [ ] Verify the contract on Arbiscan/Etherscan
- [ ] Project repo should be on GitHub with a clear README

### Day 6-7: DeFi Mechanics Deep Dive
**Goal:** Understand AMMs, perpetuals, and trading mechanics.

- [ ] Read the Uniswap v2 documentation — understand x*y=k thoroughly
- [ ] Build a mini-AMM in Solidity (constant product formula, swap function, addLiquidity)
- [ ] Test it with 5+ scenarios including price impact and edge cases
- [ ] Watch: 3Blue1Brown "Ever Wonder How Bitcoin and Cryptocurrencies Work?" (for intuition)
- [ ] Read: "How Does GMX Work" from their docs — take detailed notes
- [ ] Project: Add swap functionality to your AMM with a 0.3% fee

### Week 1 Deliverable:
- GitHub repo with: mini-vault contract + tests, mini-AMM contract + tests
- 1-page GMX summary document
- Hardhat environment set up and working

---

## Week 2: GMX Architecture (Days 8-14)

### Day 8-9: GMX Smart Contract Study
**Goal:** Understand GMX's contract architecture cold.

- [ ] Clone `https://github.com/gmx-io/gmx-synthetics`
- [ ] Read the README.md top to bottom
- [ ] For each contract below, read the source code and write 3 sentences explaining what it does:
  - ExchangeRouter.sol
  - DepositHandler.sol
  - WithdrawalHandler.sol
  - OrderHandler.sol
  - Vault.sol
  - PositionRouter.sol
  - RoleStore.sol
  - Oracle.sol
- [ ] Draw a diagram: how a deposit becomes a position, how an order gets executed

### Day 10-11: Interface Mastery
**Goal:** Be able to use GMX interfaces in your own contracts.

- [ ] Find all `I*.sol` files in the gmx-synthetics repo
- [ ] For each interface, note: what functions does it expose? What does each return?
- [ ] Write a "Hello GMX" contract: deploy it on testnet, interact with GMX testnet Vault via interface
- [ ] Read: How GMX does approvals (Router pattern)
- [ ] Project: Write a script that reads your GMX testnet position via the Reader contract

### Day 12-13: Security Patterns
**Goal:** Understand common vulnerabilities in GMX-style protocols.

- [ ] Study the most recent GMX audit report (find on Trail of Bits or GMX GitHub)
- [ ] For each HIGH or CRITICAL finding: understand what went wrong, how it was fixed
- [ ] Study: Ethernaut challenges 7 (Reentrancy), 10 (Telephone), 11 (Gatekeeper)
- [ ] Study: OpenZeppelin ReentrancyGuard — read the source code
- [ ] Write: What are 3 ways to steal funds from a protocol like GMX? (white-hat thinking)

### Day 14: Portfolio Project — Part 1
**Goal:** Start building a GMX-related portfolio piece.

- [ ] Design: "Mini GMX" — a simplified perpetual trading contract
- [ ] Spec it out: what features will it have? What's out of scope?
- [ ] Write the Solidity contracts (don't test yet, just get the code down)
- [ ] Commit to GitHub

### Week 2 Deliverable:
- Architecture diagram of GMX flow
- Notes on all major GMX interfaces
- Audit findings summary (3 pages)
- Mini GMX spec and skeleton contracts

---

## Week 3: Deep Work (Days 15-21)

### Day 15-17: Mini GMX Implementation
**Goal:** Build a working perpetual trading prototype.

- [ ] Implement the core: Vault (manage collateral), Position tracking (open/close/liquidate)
- [ ] Implement: market orders (execute immediately at oracle price)
- [ ] Implement: basic liquidation (margin ratio falls below threshold → liquidate)
- [ ] Add: events for all state changes
- [ ] Write tests: 20+ test cases covering normal paths AND attack vectors
- [ ] Deploy to testnet

### Day 18-19: Foundry Migration
**Goal:** Learn Foundry — industry standard for smart contract development.

- [ ] Install Foundry: https://book.getfoundry.sh/
- [ ] Migrate your Mini GMX to Foundry
- [ ] Write fuzz tests using Foundry (this is what GMX uses)
- [ ] Use `forge test --fuzz-runs 10000` to find edge cases
- [ ] Run `forge coverage` to see test coverage
- [ ] Write a formal audit-style report of your own code's vulnerabilities

### Day 20-21: The Graph & Indexing
**Goal:** Understand how DeFi frontends get on-chain data.

- [ ] Learn The Graph: https://thegraph.com/docs/en/
- [ ] Deploy a subgraph indexing your Mini GMM contract
- [ ] Query it with GraphQL from a simple React app
- [ ] Read: How GMX builds their dashboards
- [ ] Project: Create a simple dashboard showing your testnet positions

### Week 3 Deliverable:
- Mini GMX on testnet (tested with Foundry, fuzz tests)
- The Graph subgraph deployed
- Simple React dashboard showing positions

---

## Week 4: Application (Days 22-30)

### Day 22-23: Portfolio Polish
**Goal:** Clean up your GitHub for maximum impact.

- [ ] README files: every repo needs a clear description, architecture diagram, how to run
- [ ] Add screenshots/demo videos to repos
- [ ] Write a technical blog post about what you built
- [ ] Submit your Mini GMX as a finalist in an ETHGlobal or similar hackathon (even if not competing, submission gets visibility)

### Day 24-25: Network in GMX Discord
**Goal:** Get on the GMX team's radar.

- [ ] Join GMX Discord: https://discord.gg/gmx
- [ ] Introduce yourself in #introductions (keep it short, genuine, don't ask for a job)
- [ ] Help answer questions in #general or #development if you can
- [ ] Contribute something useful: a code snippet, a documentation fix, a translation
- [ ] DM 2-3 team members (genuinely) — ask about the protocol, not about jobs
- [ ] Look at the GMX governance forum — participate once with a thoughtful comment

### Day 26-27: Interview Prep
**Goal:** Be ready for a technical interview.

- [ ] Review all 40 questions in CRYPTO_INTERVIEW_PREP_DECK.md
- [ ] Practice answering the GMX-specific questions out loud (record yourself)
- [ ] Study the GMX technical deep dive notes from your Week 2 work
- [ ] Write a 1-page "Why GMX?" document — genuine reasons, not generic

### Day 28-29: Apply
**Goal:** Submit applications to 10+ roles.

- [ ] Apply directly on gmx.io/careers (bookmark and check weekly)
- [ ] Apply via LinkedIn to "GMX" company page jobs
- [ ] Apply to 5 similar protocols: Level Finance, Gains Network, ApolloX, Vertex, dFuture
- [ ] Apply to 3 broader DeFi roles: Uniswap, Aave, Synthetix
- [ ] Apply to 2 L2 roles: Arbitrum, Optimism (they hire solidity devs)
- [ ] Track all applications in a spreadsheet

### Day 30: Review & Plan
**Goal:** Assess where you are and plan next 30 days.

- [ ] What worked? What didn't? Update your approach
- [ ] Continue the daily intelligence routine (see crypto_daily_intelligence_routine.md)
- [ ] If no interviews yet: contribute more to GMX open source, try bug bounties
- [ ] If interviews: focus on feedback, refine, iterate

---

## Daily Non-Negotiables (All 30 Days)

1. **Every morning**: Check GMX Discord for technical discussions
2. **Every day**: Read one piece of on-chain data ( Dune dashboard, Etherscan transaction)
3. **Every week**: Submit at least one PR or contribution to an open DeFi repo
4. **Every week**: Read one audit report (find from OpenZeppelin, Trail of Bits, Cantina)
5. **Every week**: Write 1 technical note about something you learned

---

## What "Interview Ready" Looks Like

You are ready for a GMX technical interview when you can:

1. **Explain GMX architecture** in 5 minutes without notes
2. **Read a new GMX contract** and explain what it does in 10 minutes
3. **Find bugs** in a simplified GMX-like contract within 20 minutes
4. **Design a mini-perpetual** on a whiteboard with the key components
5. **Explain oracle manipulation** and how GMX prevents it
6. **Walk through a trade lifecycle** from deposit to close with PnL

---

## Signs You Should Apply NOW

- [ ] You can explain GMX's synthetics model in plain English
- [ ] You have at least one deployed and tested Solidity project on testnet
- [ ] You've read the GMX Synthetics README and understood 70%+
- [ ] You can explain what ADL is and when it triggers
- [ ] You've participated in GMX Discord in a non-lurker way

If all boxes checked: **apply today, don't wait**.
