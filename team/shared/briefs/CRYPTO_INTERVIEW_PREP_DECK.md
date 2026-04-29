# Solidity & DeFi Interview Prep Deck
**For GMX, dYdX, Uniswap, Aave, and Top Protocol Roles**

---

## How to Use This Deck

For each question:
- **Why it matters** — why interviewers ask it
- **Must-hit concepts** — what your answer must include  
- **Answer framework** — how to structure it
- **Good vs Great** — the difference

---

## Category 1: Solidity Fundamentals

### Q1: What is the difference between `memory`, `storage`, and `calldata`?

**Why:** Tests understanding of EVM memory model — fundamental.

**Must-hit concepts:**
- `storage` = persistent state on the blockchain, expensive (SSTORE/SLOAD ~20k/200 gas cold, 100 gas warm)
- `memory` = temporary, function-scoped, cheap (MLOAD/MSTORE ~3 gas), wiped between calls
- `calldata` = read-only, function parameters only, cheapest (no copies made), can't be modified

**Answer framework:**
"Storage is persistent state on the blockchain — think of it as a database. Each SLOAD reads from a slot, each SSTORE writes. It's the most expensive. Memory is temporary working space for a function call — it gets allocated and freed per call. Calldata is specifically for function input parameters and is read-only and most efficient because the EVM doesn't need to copy or manage it."

**Good answer:** Mentions all three and that calldata is cheapest.
**Great answer:** Also explains that `calldata` is required for external function parameters (can't modify them), and that `memory` strings/arrays copy on assignment while `storage` pointers reference state directly.

---

### Q2: Explain `call` vs `delegatecall` vs `staticcall`.

**Why:** Critical for proxy patterns, multisigs, and understanding smart contract composition.

**Must-hit concepts:**
- `call`: Execute external code in another contract's context. msg.sender is preserved, msg.value is preserved, state changes persist to the called contract.
- `delegatecall`: Execute external code BUT in YOUR own storage context. msg.sender/msg.value from original caller preserved. Used for libraries and proxy patterns.
- `staticcall`: Read-only call. Cannot modify state. Returns success/failure without reverting on read-only violations. Used for oracle reads, price feeds.

**Answer framework:**
"All three invoke external contract code. The critical difference is what state context they use. Call uses the target's storage — changes go there. Delegatecall uses YOUR storage — this is why libraries must be deployed first and why proxies use it to inherit your state. Staticcall is a read-only variant that reverts if you try to write — essential for price oracles to prevent price manipulation during the read."

**Good answer:** Explains all three clearly.
**Great answer:** Mentions how `proxy` contracts use `delegatecall` to forward calls to an implementation while keeping the proxy's storage. Mentions OpenZeppelin's proxy contracts.

---

### Q3: How does `receive()` vs `fallback()` work in Solidity?

**Why:** Handles ETH deposits and proxy forwarding — common in GMX-style protocols.

**Must-hit concepts:**
- `receive()`: triggered when calldata is empty (plain ETH transfer). Must be `external payable`.
- `fallback()`: triggered when no function matches, OR when receiving with calldata but no `receive`. Must be `external payable`.
- Priority: if `receive` exists and empty calldata → `receive`. Otherwise → `fallback`.

**Answer framework:**
"`receive()` is the entry point for plain ETH transfers — when someone sends ETH with no function call data. If there's no `receive()` or the calldata isn't empty, `fallback()` gets triggered. Both must be marked `payable` to accept ETH. In proxy patterns, the fallback function typically does `delegatecall` to the implementation."

---

### Q4: What is reentrancy and how do you prevent it?

**Why:** One of the most dangerous classic vulnerabilities — critical for DeFi security.

**Must-hit concepts:**
- Reentrancy: contract A calls contract B, B calls back into A before A updates state
- Cross-function reentrancy: same principle across multiple functions in the same contract
- Checks-Effects-Interactions (CEI) pattern: update state BEFORE external calls
- Reentrancy guard (OpenZeppelin `ReentrancyGuard`)
- Mutex locks

**Answer framework:**
"Reentrancy happens when a malicious contract is called and callbacks back into the caller before the first execution completes. Classic example: a withdrawal function sends ETH before updating the balance — the attacker contract's fallback re-enters the withdrawal function repeatedly. Prevention: always update ALL state before making any external call. Use OpenZeppelin's ReentrancyGuard as a mutex. Never assume external contracts are trusted."

**Good answer:** Explains CEI pattern and ReentrancyGuard.
**Great answer:** Mentions cross-function reentrancy, and gives a real example (The DAO hack or a more recent DeFi exploit). Explains that even `transfer`/`send` in Solidity older versions were vulnerable because they only forwarded 2300 gas.

---

### Q5: How does a Cross-Contract Call work? Show how you'd call an external contract.

**Why:** GMX is all about contract composition — Vault, PositionRouter, OrderHandler, etc.

**Must-hit concepts:**
- Interface definition (`interface IVault { ... }`)
- Cast the address to the interface: `IVault(vaultAddress).functionName()`
- Or use low-level `.call()` with encoded data
- Need the function signature and parameters matching exactly

**Answer framework:**
"You define an interface with the function signatures you need, then cast the contract address to that interface type. For example: `IVault(vault).getPosition(owner, ...)` — the compiler checks at compile time that the call matches the interface. For more control, you can use low-level `address.functionCall(abi.encodeWithSignature(...))` or `abi.encodeCall()`."

**Great answer:** Mentions that for GMX specifically, you'd use their published interfaces like `IVault`, `IPositionRouter`, etc.

---

### Q6: What are the different visibility specifiers and when would you use each?

**Why:** Basic Solidity competency test.

**Must-hit concepts:**
- `public`: Can be called internally AND externally. Generates a getter function automatically. Most gas expensive.
- `external`: Can ONLY be called externally (from other contracts or transactions). More gas efficient for large data because parameters go straight to calldata.
- `internal`: Can ONLY be called from within the same contract or derived contracts. Not in bytecode.
- `private`: Can ONLY be called from within the SAME contract (not even derived).

**Answer framework:**
"Internal is the most common for helper functions. Public for state-changing operations that need external access. External is best for functions that only read parameters and don't need to be called internally — saves gas. Private is for functions that should never be callable even by child contracts, though note: private is NOT truly private — all data is visible on-chain."

---

### Q7: What is the difference between `pure` and `view` functions?

**Why:** Gas saving mechanisms — interviewers want to know you understand optimization.

**Must-hit concepts:**
- `view`: Promises NOT to modify state. Reading state is free in some contexts but `view` prevents writes. Costs gas when called from a transaction (state modification).
- `pure`: Promises neither to read NOR modify state. No access to state variables at all.

**Answer framework:**
"`view` means the function reads state but doesn't write — like reading from storage. `pure` means it neither reads nor writes state — purely computational with inputs only. Both are promises to the compiler; violations cause reverts. Gas: calling `view`/`pure` externally costs 0 gas IF the EVM's static analysis can confirm no state change, but a transaction that calls them still costs gas for the whole transaction."

---

### Q8: How do Enums work in Solidity and what are their limitations?

**Why:** Common in GMX for order types, market states, etc.

**Must-hit concepts:**
- Enums are explicitly convertible to/from integers
- Enum values are uint8 (0 to 255), so max 256 values
- Default value is the first element
- Gas: enum values are stored as uint8

**Answer framework:**
"Enums create a custom type with named values stored as uint8. They're useful for code readability — GMX uses them for order types (MARKET, LIMIT, STOP). Limitation: maximum 256 values. Also, Solidity doesn't enforce that you cover all cases in a switch, so always have a default case. Gas efficiency: enums are cheap uint8 values."

---

### Q9: How do Structs and Mappings work in Solidity?

**Why:** Foundation of how DeFi state is organized — positions, orders, accounts.

**Must-hit concepts:**
- Structs: custom composite types grouping related fields
- Mappings: key-value hash table, O(1) access, only allowed as contract state variables
- Mapping keys can be any scalar type (address, uint256, bytes32)
- Mapping values can be any type (including nested mappings or structs)
- Mappings are always initialized to zero values

**Answer framework:**
"Structs let you group related data — like a Position struct with size, collateral, entryPrice. Mappings are like hash tables: `mapping(address => uint256)` lets you look up a user's balance in O(1). In GMX, positions are stored as `mapping(bytes32 => Position)` where the key is a hash of the account + market. Mappings can't be iterated directly — if you need that, you maintain a separate array of keys."

---

### Q10: What is the Diamond Pattern (EIP-2535) and why would you use it?

**Why:** Advanced upgradeability — GMX v2 uses a form of this.

**Must-hit concepts:**
- Diamond pattern allows multiple implementation contracts ("facets")
- Single proxy contract ("Diamond") delegates calls to facets
- `DiamondCutFacet` allows adding/replacing/removing facet functions
- Storage is in the Diamond proxy, not in facets
- Can exceed 24KB contract size limit by distributing across facets

**Answer framework:**
"The Diamond pattern solves two problems: the 24KB contract size limit and upgradeability. Instead of one implementation, you have multiple 'facet' contracts, each with a subset of functions. The proxy (Diamond) stores the mapping of `selector → facet address` and forwards calls. When you upgrade, you deploy a new facet and update the selector mapping. Storage is centralized in the proxy — facets just have logic. GMX Synthetics uses something conceptually similar for upgradeability."

---

### Q11: What is the difference between UUPS and Transparent Proxy patterns?

**Why:** Upgradeability patterns — critical for production DeFi protocols.

**Must-hit concepts:**
- **Transparent Proxy**: Proxy is admin-gated; upgrades require admin transaction; 2 separate contracts (proxy + implementation). Admin could be multisig or timelock.
- **UUPS (Universal Upgradeable Proxy Standard)**: Upgrade logic is in the implementation itself. Proxy just forwards. If implementation has upgrade function, anyone with the right permission can upgrade. Cheaper gas (one less deployment).
- **Drawback of UUPS**: If implementation doesn't have upgrade logic, upgrades are impossible. If implementation has a bug in upgrade function, you're stuck.

**Answer framework:**
"Transparent proxy keeps upgrade logic in the proxy itself — the admin is a separate entity that must sign upgrade transactions. UUPS puts the upgrade function in the implementation contract, so the proxy is dumber — it just forwards. UUPS is cheaper to deploy but riskier because if your implementation doesn't have upgrade capability, you can't upgrade. OpenZeppelin recommends UUPS for most cases and uses it for their upgradeable contracts."

---

### Q12: How would you optimize gas in a heavily-used DeFi contract?

**Why:** Gas optimization directly impacts user profitability — critical skill.

**Must-hit concepts:**
- Storage reads/writes are expensive — batch reads, cache in memory
- Events are cheaper than storage for logging
- `external` vs `public` for gas efficiency
- Unchecked blocks for math that can't overflow (Solidity 0.8+)
- Short revert messages to save gas
- Packed struct encoding
- Custom errors (Solidity 0.8.4+) instead of string revert messages

**Answer framework:**
"Storage is the biggest gas cost — each SLOAD is ~2100 cold gas, SSTORE up to 20k. So: batch reads at the start, cache in memory. Pack structs tightly — use uint128 instead of uint256 where possible to allow struct packing. Use `external` not `public` for functions only called externally. Use `unchecked` for arithmetic you know can't overflow in Solidity 0.8+. Emit events instead of writing to storage for non-critical state. Use custom errors instead of string messages."

---

### Q13: What are Libraries in Solidity and when would you use them?

**Why:** Code reuse pattern — also relevant for GMX's modular architecture.

**Must-hit concepts:**
- Libraries are deployed once at a specific address
- Calling library functions uses `delegatecall` — runs in the calling contract's context
- Libraries can't have state or inherit
- Built-in libraries (Math, SignedMath in OpenZeppelin)
- Used for reusable pure/View functions

**Answer framework:**
"Libraries let you reuse common code without duplicating deployment. When you call a library function, it executes with `delegatecall`, so it operates on your contract's storage. Libraries can't have state variables — they're purely logic. Use them for math utilities, data transformation, or any pure function you want to reuse across contracts. OpenZeppelin's Math library is a common example."

---

### Q14: What happens when you call `this.f()` vs just calling `f()` in Solidity?

**Why:** Tests understanding of external vs internal calls and the CALL opcode.

**Must-hit concepts:**
- `f()` (direct): internal call, no CALL opcode, uses JUMP not DELEGATECALL
- `this.f()`: external call via CALL opcode — more expensive because it crosses contract boundary
- Gas difference: internal calls are essentially free (JUMP), external calls cost ~2600 gas base

**Answer framework:**
"Direct function calls `f()` within the same contract use an internal jump — no gas overhead beyond the function execution itself. Calling `this.f()` forces an external CALL, which costs ~2600 gas base plus potential security checks. You'd use `this.f()` when you need the call to be externally callable — for example, to trigger a reentrancy guard check, or when the function needs to be called from outside. Otherwise, always prefer direct internal calls."

---

### Q15: How does a Mapping with Struct look in memory vs storage?

**Why:** Practical pattern for DeFi position tracking (GMX stores positions this way).

**Answer framework:**
"Mappings are only valid as contract-level state variables — they're always in storage, not memory. When you read `positions[key]`, the EVM looks up the storage slot hash(key). If the key doesn't exist, you get a zero-initialized struct back (all values 0). To check existence, you'd store a boolean flag or check if a field like `size > 0`. In memory, you could have `mapping` types inside structs, but that's less common. GMX stores positions as `mapping(bytes32 => Position)` where the key is `keccak256(abi.encode(account, market, collateral))`."

---

## Category 2: DeFi Mechanics

### Q16: How does an AMM (Automated Market Maker) work? Explain the x*y=k formula.

**Why:** Foundation of all DeFi — Uniswap, Curve, GMX pools.

**Must-hit concepts:**
- Constant product formula: `x * y = k` (or variant)
- As one asset increases, the other decreases, setting price
- No order book — liquidity providers supply both assets
- Price impact determined by trade size relative to pool reserves
- LP tokens represent proportional share of pool

**Answer framework:**
"An AMM replaces the order book with a mathematical formula. The simplest is x*y=k — the product of the two asset reserves stays constant. If I add 100 USDC and 1 ETH to a pool, the product is 100. If you then buy 0.5 ETH, the pool calculates the new price: after the trade, if you have 1.5 ETH, you must have 100/1.5 = 66.7 USDC, so you paid 33.3 USDC for 0.5 ETH. The price is determined by how much you're trading relative to the pool size — larger trades have more price impact. LPs earn fees from all trades."

---

### Q17: What is Impermanent Loss and how does it affect Liquidity Providers?

**Why:** Core risk for LPs — relevant if GMX ever adds LP mechanics.

**Must-hit concepts:**
- Impermanent loss (IL): difference between holding assets vs providing liquidity
- Occurs when asset prices diverge from when you entered
- Loss is "impermanent" because it becomes real only when you withdraw
- AMMs automatically sell the rising asset and buy the falling one (rebalancing)
- The more prices diverge, the greater the IL

**Answer framework:**
"Impermanent loss is the opportunity cost of providing liquidity instead of just holding. Imagine you provide 1 ETH + 1000 USDC to a 50/50 pool when ETH = $1000. If ETH goes to $2000, the pool rebalances: you now have less ETH and more USDC than you started with, worth ~$2800 instead of $3000 if you'd just held. The ~$200 'loss' is impermanent because you only realize it when you withdraw. Holding would have been better in this case. Pools with uncorrelated assets (stablecoin pairs) have minimal IL."

---

### Q18: How does Uniswap v3 differ from v2?

**Why:** Shows understanding of AMM evolution — relevant for DeFi depth.

**Must-hit concepts:**
- Concentrated liquidity: LPs can specify price ranges, not full 0-∞
- Multiple fee tiers: 0.05%, 0.30%, 1%
- Active liquidity: when price exits LP range, LP earns nothing (just holds one asset)
- Position NFTs instead of fungible LP tokens
-flash accounting for multi-hop swaps

**Answer framework:**
"Uniswap v3's big innovation is concentrated liquidity — instead of providing across the full 0 to ∞ price range, LPs can concentrate their capital in a specific range. This means the same capital can earn more fees but also exits the pool more often when price moves out of range. v3 also introduces multiple fee tiers (0.05%, 0.30%, 1%) for different volatility pairs. Instead of fungible LP tokens, v3 uses NFTs representing positions. The tradeoff: higher capital efficiency but more active management required."

---

### Q19: How does GMX's Synthetics model differ from a traditional order book or AMM?

**Why:** This is THE key differentiator question for GMX interviews.

**Must-hit concepts:**
- Synthetics: NOT an AMM, NOT an order book
- Peer-to-pool model: traders trade against a liquidity pool, not each other
- GLP pool (now per-market pools): LPs provide liquidity, earn fees
- Traders long or short with leverage against the pool
- PnL is settled from the pool
- If pool goes negative, ADL kicks in (auto-deleveraging)

**Answer framework:**
"GMX doesn't use an order book like dYdX, and it's not an AMM like Uniswap. Instead, it's a peer-to-pool model. Liquidity providers (LPs) deposit into a pool and earn a share of all trading fees. Traders take long or short positions with leverage, paying fees and potentially getting liquidated. When a trader wins, their profit comes from the pool. When they lose, their loss goes to the pool. This means LPs are always exposed to net trader PnL — if traders collectively win more than the pool has, ADL auto-deleverages winning positions proportionally. This is fundamentally different from Uniswap where LPs get fees but are exposed to IL."

---

### Q20: How does GMX's Oracle system work?

**Why:** Oracle manipulation is a top DeFi attack vector — critical for GMX.

**Must-hit concepts:**
- Oracle prices are from AFTER order creation timestamp (critical!)
- Uses a set of off-chain price providers aggregated into a single price
- Prices stored compactly (uint8 index, uint32/uint64 for price)
- Execution at valid oracle price — not the price at execution block
- Distinguishes "index price" from "mark price"

**Answer framework:**
"GMX's oracle is the heart of the system. The critical rule: orders execute at oracle prices that are valid AFTER the order's creation timestamp. This prevents front-running. The oracle itself aggregates prices from multiple off-chain sources — it's not pulling from Chainlink directly but has its own aggregation. Compact storage (uint8 for token index, uint32/uint64 for price) saves gas. When an order executes, the system validates that the oracle price was set after the order creation time. The 'mark' price (market price) is distinct from the 'index' price used for PnL calculations."

---

### Q21: What is ADL (Auto-Deleveraging) and when does it trigger?

**Why:** Unique to GMX's risk model — definitely asked in GMX interviews.

**Must-hit concepts:**
- ADL = Auto-Deleveraging
- Triggers when the pool's remaining collateral can't cover all profitable positions
- Happens in a loss direction for LPs (traders won more than pool has)
- System automatically reduces profitable positions proportionally
- Uses a priority queue (largest positions deleveraged first)
- Can affect traders even with profitable positions

**Answer framework:**
"ADL is GMX's insurance mechanism. Normally, profitable trader PnL comes from the pool. But if the pool doesn't have enough (extreme market move, many traders win), the pool goes negative. When this happens, ADL automatically reduces winning positions — starting with the largest — to bring the pool back to equilibrium. As a trader, your profitable position could be partially or fully closed even though you're in profit. ADL is triggered when `poolPnl / poolCollateral` exceeds a threshold. LPs are exposed to this risk — they absorb losses until ADL kicks in."

---

### Q22: Explain GMX's fee structure.

**Why:** Traders need to understand costs; developers need to understand protocol revenue.

**Must-hit concepts:**
- Position fees: 0.1% to 1% of position size (varies by market)
- Borrowing fees: based on utilization (kink model) — increases as pool gets more utilized
- Funding fees: pays long/short balance alignment — when imbalanced, one side pays the other
- Swap fees: for token swaps (different from position fees)
- All fees go to the liquidity pool (LPs)

**Answer framework:**
"GMX has a layered fee structure. The biggest is position fees — a percentage of the position size when opened, typically 0.1-1% depending on the market. Then there's a borrowing fee — LPs are effectively lending to traders, and the interest rate increases with pool utilization (the 'kink' model). Funding fees are the interesting one: every 8 hours, if there's imbalance between longs and shorts (say 70% long), longs pay shorts. This is how GMX keeps long/short balanced. All of this flows to LPs. Traders also pay execution fees for gas."

---

### Q23: What is a Flash Loan and how do flash loan attacks work?

**Why:** Major attack vector in DeFi — must know for security-focused roles.

**Must-hit concepts:**
- Flash loan: borrow unlimited amount from a pool without collateral, must return within same transaction
- Relies on atomic transactions — if repayment fails, entire tx reverts
- Attack pattern: borrow → manipulate price → profit → repay → keep difference
- Famous example: Cream Finance, PancakeBunny, Beanstalk

**Answer framework:**
"A flash loan lets you borrow massive amounts without collateral — the only requirement is you return it within the same transaction. This is possible because blockchain transactions are atomic. The attack works like this: borrow 100M USDC from a lending protocol → use it to pump the price of an asset on some AMM → liquidate your own position or arbitrage the manipulated price → repay the 100M. You profit because the attack cost was near zero. Prevention: use TWAPs instead of spot prices for liquidations, implement proper oracle validation."

---

### Q24: What is MEV (Maximal Extractable Value) and how does it affect DeFi?

**Why:** Understand blockchain ordering and its impact on DeFi UX.

**Must-hit concepts:**
- MEV: value extracted by ordering, including, excluding transactions in a block
- Types: front-running (sandwich attacks), back-running, arbitrage
- Flashbots: separate market for MEV — reduces chain congestion
- RPC changes (eth_sendBundle, etc.)

**Answer framework:**
"MEV is the value that block proposers (validators) can extract by reordering or censoring transactions. The most common example is a sandwich attack: attacker sees your trade, front-runs it (bids higher gas to go first), pumps the price, your trade executes at worse price, attacker back-runs to sell. This costs you slippage. MEV also includes arbitrage between AMMs — bots competing for the same profit. Flashbots created a separate market for MEV, reducing harmful forms. For DeFi UX, MEV means your swap might get front-run, your liquidation might get sniped."

---

### Q25: What is the difference between a TWAP and a market order?

**Why:** Oracle and DeFi protection mechanism — critical for security questions.

**Must-hit concepts:**
- Market order: executes at current spot price, susceptible to manipulation
- TWAP (Time-Weighted Average Price): executes at average price over a time window
- Reduces manipulation risk because manipulator must sustain price for the whole period
- Used by protocols for oracle prices, large liquidations, etc.

**Answer framework:**
"A market order executes immediately at whatever the current price is — which makes it vulnerable to price manipulation. A TWAP splits the order into smaller chunks over time and executes at the time-weighted average price. For example, to liquidate $10M worth of positions, a protocol might use TWAP over 5 minutes to get an average price instead of being manipulated at a single moment. GMX uses oracle prices that have a similar intent — but the key GMX rule is that the oracle price must be set AFTER the order creation, not at execution time."

---

### Q26: How does Aave's liquidation mechanism work?

**Why:** Shows understanding of collateral systems — fundamental DeFi primitive.

**Must-hit concepts:**
- Health Factor = (collateral * liquidationThreshold) / totalBorrows
- HF < 1 → can be liquidated
- Liquidator pays off the debt and receives collateral at a bonus (typically 5-10%)
- Liquidation threshold is less than 1 (e.g., 0.85) to give buffer

**Answer framework:**
"Aave uses a health factor. Each user has collateral (multiple assets with weightings) and borrows. Health Factor = (weighted collateral value) / (borrow value). If HF drops below 1, anyone can liquidate the position. The liquidator pays off some or all of the debt in the borrow asset, and receives collateral in the collateral asset at a discount — typically 5-10% better than market. This discount is the incentive for liquidators to participate. The liquidation threshold (e.g., 0.85) means you can only borrow up to 85% of your collateral value — you must maintain a buffer."

---

### Q27: What is an oracle manipulation attack? Give an example.

**Why:** Most common DeFi attack vector — must understand for any protocol role.

**Must-hit concepts:**
- Oracles provide external data (prices) to smart contracts
- If oracle is a single source or uses spot price → easily manipulated
- Attack: manipulate the price source, then exploit the protocol that uses it
- The DAO: wrong oracle data caused fork
- MANY DeFi hacks: BAND, LINK, Harmony, etc.

**Answer framework:**
"Oracle manipulation happens when an attacker controls the price feed that a DeFi protocol uses. The simplest form: if a protocol uses an AMM's spot price as its oracle, I can flash-loan a massive amount to pump that price, use the pumped price to extract a loan, then undo the manipulation. In the same transaction. Famous example: Beanstalk Farms lost $182M because it used a governance-approvedoracle that attackers manipulated with a flash loan. Prevention: use TWAPs, multiple independent data sources, or hardware-secured oracles like Chainlink."

---

### Q28: How does Uniswap's `getAmountOut` calculation work?

**Why:** Core math of AMMs — may be asked in technical interviews.

**Answer framework:**
"For a swap of amountIn with fee f (e.g., 0.3% = 997/1000), the output is: `amountOut = (amountIn * reserveIn * 997) / (reserveIn * 1000 + amountIn * 997)`. This is derived from `x*y=k` with a fee baked in. After the swap, `(x + amountIn*997/1000) * (y - amountOut) = k`. The 0.3% fee means the pool grows slightly with every trade, which is where LP fees come from. The `getAmountOut` function tells you exactly how much you'd receive before you sign the transaction."

---

## Category 3: Security

### Q29: What is the Checks-Effects-Interactions pattern? Why does it prevent reentrancy?

**Why:** Fundamental secure coding pattern — must know cold.

**Must-hit concepts:**
- Checks: validate inputs and conditions
- Effects: update ALL state variables immediately
- Interactions: make external calls LAST
- Reentrancy vulnerability arises when state is updated AFTER an external call

**Answer framework:**
"CEI is the most important secure coding pattern. You always: first CHECK (require/if conditions), then UPDATE ALL STATE ( Effects — storage writes), then INTERACT with external contracts last. The classic vulnerable pattern is: check balance → call external → update balance (BAD). If the external call is to a malicious contract, it can re-enter before the balance update. With CEI: check → update balance → call (GOOD). By the time the external call happens, your state already reflects the intended change, so re-entering finds the account already drained."

---

### Q30: How do you audit a smart contract for overflow vulnerabilities?

**Why:** Solidity 0.8+ handles this automatically, but interviewers want depth.

**Must-hit concepts:**
- Solidity 0.8+: checked arithmetic (reverts on overflow automatically)
- Solidity < 0.8: overflow silently wraps around (0xFF + 1 = 0)
- Even in 0.8+, `unchecked` blocks exist and can reintroduce overflow risk
- Key areas: addition, multiplication, token transfers

**Answer framework:**
"Solidity 0.8+ reverts automatically on arithmetic overflow/underflow — so most new code is safe by default. However, `unchecked` blocks exist for gas optimization and reintroduce the risk. When auditing, I'd search for all `unchecked` blocks and verify the math can't overflow. In older code (0.7 or below), I'd look for every arithmetic operation, especially addition and multiplication, and check if it could exceed type limits. OpenZeppelin's SafeMath library was the pre-0.8 solution."

---

### Q31: What is an Access Control vulnerability?

**Why:** Second most common vulnerability category after reentrancy.

**Must-hit concepts:**
- Functions with `onlyOwner` or role checks that can be bypassed
- Missing modifiers entirely
- tx.origin vs msg.sender confusion
- Role assignment bugs

**Answer framework:**
"Access control vulnerabilities happen when functions that should be restricted aren't. The classic is a function with `require(msg.sender == owner)` where the owner is address(0) by default. Or using `tx.origin` instead of `msg.sender` — tx.origin is the original external account, so if a contract A calls contract B which calls contract C, tx.origin is A but msg.sender is B. This allows phishing attacks where a malicious contract tricks you into calling it, and it uses your tx.origin as authorization somewhere else. Always use msg.sender for authorization."

---

### Q32: What is a Front-End Running attack in DeFi?

**Why:** Critical for understanding MEV and designing fair DeFi systems.

**Must-hit concepts:**
- Attacker watches mempool for profitable transactions
- Copies the trade and bids higher gas to go first
- Results in worse price for the original trader
- Sandwich attack: front-run + back-run together

**Answer framework:**
"Front-running is seeing a pending transaction that will move the market and racing to get your transaction in first. In DeFi, when you submit a swap, it goes to the mempool. Bots scan the mempool, see your trade, and submit a higher-gas copy that gets mined first. This moves the price so your trade executes at a worse price. The bot then sells. A sandwich attack is when the bot front-runs AND back-runs your trade — you get the worst price, the bot profits. Prevention: use private RPCs, limit orders, or commit-reveal schemes."

---

### Q33: What is the difference between `require`, `assert`, and `revert`?

**Why:** Solidity error handling — basic competency.

**Must-hit concepts:**
- `require(condition, "msg")`: checks precondition, used for validation. Should be used most of the time.
- `assert(condition)`: checks for things that should NEVER happen. In production, assert failures use all remaining gas (not refunded).
- `revert()` or `revert("msg")`: unconditional revert, can be used anywhere with custom logic

**Answer framework:**
"`require` is for input validation and access control — it should be your primary error mechanism. If it fails, it refunds remaining gas. `assert` is for invariants — things that should never be false if the code is correct. In production, assert failures consume all gas. `revert` is unconditional — you use it when you want to bail out with custom logic, like `if (x > max) revert("exceeds maximum")`. assert should be rare; require should handle 95% of cases."

---

### Q34: How do upgradeable contracts work and what are their risks?

**Why:** GMX uses upgradeable contracts — critical for understanding their architecture.

**Must-hit concepts:**
- Proxy pattern: proxy contract stores all state, delegates to implementation
- Implementation contract can be replaced (upgrade)
- Storage collision risk: if new implementation has different storage layout, data corrupts
- Initialization risks: constructor doesn't run in proxy, must use initializer pattern

**Answer framework:**
"Upgradeable contracts use a proxy pattern. The proxy holds all the state (storage), while an 'implementation' contract holds the logic. When you call the proxy, it delegates to the implementation. To upgrade, you point the proxy to a new implementation address. The risks: (1) storage collision — if the new implementation has different storage layout, it reads/writes wrong slots. Solution: use inherited storage with append-only fields. (2) initialization — in a proxy, the constructor doesn't run, so you must use an initializer modifier and call it atomically after deployment."

---

### Q35: How would you design a secure multi-signature wallet?

**Why:** Multi-sigs hold billions in DeFi — common in protocol treasuries.

**Must-hit concepts:**
- N-of-M signatures required (e.g., 3-of-5)
- Confirmation tracking with mapping
- Execution only after threshold confirmed
- Replay protection (nonce)
- Module pattern for extensions

**Answer framework:**
"A simple multi-sig: maintain a mapping of `transactionId → confirmedBy` (address → bool). When someone confirms, increment a counter. When counter >= threshold, allow execution. Key security: use `msg.sender` not `tx.origin` for auth. Add a nonce to prevent replay attacks. Use EIP-712 for typed data signatures so users can see what they're signing in their wallet. Consider a timelock — after threshold signatures, wait X hours before executing, giving time to cancel if compromised. Gnosis Safe is the production standard to study."

---

### Q36: What is a storage collision vulnerability in proxy patterns?

**Why:** Common upgradeability bug — critical for proxy audit work.

**Answer framework:**
"Storage collision happens when a proxy delegates to implementation A (which uses slots 0,1,2) and then you upgrade to implementation B which uses a different storage layout and accidentally writes to the same slots. The new implementation's variables get mixed with the old storage, corrupting state. Example: Implementation A has `uint256 public totalDeposits` at slot 0 and `address public owner` at slot 1. Implementation B accidentally puts `uint256 public lastWithdrawal` at slot 0 and `uint256 public totalDeposits` at slot 1. Now slot 1 holds the new `totalDeposits` but the proxy still has the old owner's address there — totalDeposits becomes an address! Prevention: use inherited storage with fixed layout, OpenZeppelin StorageSlot."

---

## Category 4: System Design

### Q37: Design a staking reward system.

**Why:** Common DeFi primitive — tests system design thinking.

**Must-hit concepts:**
- User stakes token → earns rewards over time
- Reward distribution proportional to stake amount
- Needs to handle: stake, unstake, claim rewards, compound
- Checkpoint system for efficient reward calculation (lastClaimTime)
- Inflationary vs revenue-sharing staking

**Answer framework:**
"Track per-user: `amount` (staked), `rewardPerTokenStored` (cumulative), `lastClaimTime`. When someone stakes: update their reward debt. The core formula: `pendingRewards = (stakedAmount * (currentRewardPerToken - lastRewardPerTokenStored))`. On claim: calculate pending, reset checkpoint, transfer rewards. On unstake: claim rewards, then remove stake. Key optimization: use a checkpoint (lastClaimTime) so you don't have to loop through all time — just calculate from last claim to now. For compounding, auto-stake pending rewards."

---

### Q38: Design a perpetual futures protocol (like GMX) from scratch.

**Why:** Tests deep understanding of GMX's architecture — likely asked for senior roles.

**Answer framework:**
"Core components: (1) Vault — holds all collateral, handles deposits/withdrawals, PnL settlement. (2) Position tracking — `mapping(bytes32 => Position)` keyed by account+market. (3) Order matching — for peer-to-pool, you don't match; traders open against the pool. (4) Oracle — trusted price feed with timestamp validation. (5) Liquidation engine — when margin ratio drops below threshold, liquidate. (6) ADL — if pool can't cover profits, reduce winning positions. Data model: Position { size, collateral, entryPrice, borrowValue }. On trade: validate margin, update position size, settle PnL. Fee model: position fee + borrowing fee + funding fee."

---

### Q39: Design a liquidation system that prevents flash loan manipulation.

**Why:** Security-first design — critical for risk management roles.

**Must-hit concepts:**
- Use TWAP for liquidation prices (5-minute average)
- Check health factor with buffer (not just threshold)
- Liquidation threshold < 1 (e.g., 0.8) so buffer exists
- Batch liquidations to reduce gas and prevent liquidation wars
- Use Chainlink or multiple oracle sources

**Answer framework:**
"First, protect the price: use TWAP instead of spot price for liquidation triggers — this prevents flash loan manipulation because the attacker would need to sustain a manipulated price for the entire TWAP window. Second, set the liquidation threshold below 1 — if a user has $100 collateral, they're liquidated when their borrow value exceeds, say, $80 (threshold of 0.8). This gives a buffer. Third, use a health-factor based check, not just a binary price check. Fourth, batch liquidations if possible to reduce gas wars. Fifth, require liquidation to come from a verified price (not just any price oracle)."

---

### Q40: How would you add cross-chain support to a DeFi protocol?

**Why:** Cross-chain is the future — tests architectural thinking.

**Must-hit concepts:**
- Lock-and-mint vs burn-and-mint
- Canonical bridging vs liquidity bridging
- LayerZero, Wormhole, Hyperlane, Axelar
- Finality considerations per chain
- Messaging layers (CCIP, LayerZero)

**Answer framework:**
"There are two models: lock-and-mint (you lock assets on chain A, a mintable representation appears on chain B) and burn-and-mint (you burn on chain A, mint on chain B). The key challenge is finality — some chains have probabilistic finality (ETH L2s) while others have economic finality. For GMX cross-chain, you'd use a message-passing protocol like LayerZero or Wormhole. The flow: user initiates on chain A → message is sent via relayer → validator set confirms → execution on chain B. Risks: oracle validation, reorg handling, message ordering. Canonical bridging (lock-mint) is safer than liquidity bridging (wormhole-style) because there's no liquidity to drain."

---

## Quick Reference: GMX-Specific Must-Read

Before any GMX interview, be able to explain:

1. **Oracle Price vs Mark Price**: Oracle is the external price feed; mark is the PnL calculation price
2. **Order Execution Timing**: Oracle prices must be from AFTER order creation timestamp — this is non-negotiable
3. **ADL Trigger**: When poolPnl / poolCollateral exceeds a threshold, profitable positions are auto-reduced
4. **Funding Fee**: Paid every 8 hours to balance long/short ratio — longs pay shorts when >50% long
5. **v1 vs v2**: v1 had single GLP pool, market orders only; v2 has per-market pools, limit orders, stop-loss
6. **Deposit Flow**: ExchangeRouter → (Router approves tokens) → creates deposit request → DepositHandler executes

---

*Save this file. Review 5 questions per day until your interview.*
