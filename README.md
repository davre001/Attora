# Attora

### Cross-chain RWA collateral on Ethereum. Borrow on Creditcoin.

**Attora** is a cross-chain RWA lending protocol built for the **Creditcoin Attestcoin stack**.

A borrower locks tokenized real-world collateral on Ethereum (Sepolia / mainnet). **Attestcoin** cryptographically proves that lock on Creditcoin. An **Attestcoin Smart Contract (ASC)** on Creditcoin CC3 then opens a loan against the verified collateral event — with **no trusted bridge operator and no self-reported collateral**.

> **Built for BUIDL CTC 2026 Fall — BUIDL For The Real World.**

**Tracks:** RWA · DeFi

---

## Problem

Tokenized RWAs — including equities, funds, invoices, and credit positions — already exist on Ethereum.

Credit and loan history already exist as a native domain of Creditcoin.

However, these two worlds do not communicate trustlessly without a bridge or centralized oracle.

If you hold a tokenized real-world asset on Ethereum and want liquidity on Creditcoin, you currently have to either:

- Wrap or bridge the asset and trust an operator, or
- Re-underwrite the same collateral from scratch.

Both approaches weaken the value of cryptographic provenance.

### The missing primitive

**How can Creditcoin lend against an RWA that remains on Ethereum while cryptographically proving that the collateral actually exists and is locked?**

---

## Solution

**Attora treats Attestcoin readability as the underwriting step.**

Instead of moving the collateral to Creditcoin, Attora proves its existence and lock state from the source chain.

### How it works

1. The borrower locks an eligible RWA token — or a hackathon stand-in ERC-20 — in an `SourceVault` on Ethereum Sepolia.
2. The vault emits:

   `CollateralLocked(borrower, asset, amount, loanId)`

3. An off-chain proof worker detects the event, waits for attestation, and builds Merkle + continuity proofs through the Attestcoin Proof Builder API.
4. The `LoanBook` ASC on Creditcoin CC3 calls the **BlockProver precompile**, verifies the source transaction, and decodes the proven `CollateralLocked` event.
5. Once verification succeeds, the ASC opens the loan against the verified collateral.
6. The borrower draws stablecoins / test credit on Creditcoin.
7. Repayment can close the loan on CC3 and later unlock the source vault through writability or an attested unlock flow.

### Core principle

> **Collateral is never "told" to Creditcoin. It is proven.**

This is the Creditcoin-native version of:

> **Keep the RWA. Unlock liquidity.**

---

## Scope

Attora focuses on the core cross-chain RWA lending primitive required for the hackathon.

Covered-call / 0% APR mechanics from products such as Spout are **out of scope for the MVP**.

They can be introduced later as an attested `PremiumPosted` cashflow rather than as a simulated on-chain options engine.

---

# Why Attestcoin?

Attestcoin is the load-bearing component of Attora.

Every loan opening **fails closed** if BlockProver verification fails.

| Component | Role |
|---|---|
| **Source Chain** | Ethereum Sepolia (`chainKey = 1` on CC3 testnet) |
| **Attestation** | Attestors finalize source-chain blocks onto Creditcoin |
| **Proof Builder API** | [Attestcoin Proof Builder](https://proof-gen-api.cc3-testnet.creditcoin.network/) |
| **Decoder** | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f` |
| **BlockProver Precompile** | `0x0000000000000000000000000000000000000FD2` |
| **ChainInfo Precompile** | `0x0000000000000000000000000000000000000fd3` |
| **ASC Dashboard** | [Creditcoin CC3 Dashboard](https://dashboard.cc3-testnet.creditcoin.network/) |
| **SDK** | `@gluwa/usc-sdk` |

## Depth of Integration

The Attestcoin integration is not decorative or optional.

Judges should be able to see that Attestcoin is directly involved in the loan lifecycle:

- Verify the source-chain collateral lock **inside the same Creditcoin transaction that opens the loan**.
- Replay protection using `(chainKey, blockHeight, txIndex)`.
- Decode `CollateralLocked` from **proven transaction bytes**, rather than relying on an admin-controlled setter.
- Optionally verify a second proof for `CollateralReleased` / `Repaid` to close the position.

---

# Architecture

```text
                    AT T O R A
             Cross-Chain RWA Lending


 Ethereum Sepolia                         Creditcoin CC3 Testnet
   Source Chain                                Settlement Chain
┌───────────────────────┐             ┌───────────────────────────────┐
│                       │             │                               │
│   RWA Token (ERC-20)  │             │       LoanBook.sol            │
│                       │             │       ASC                     │
│   SourceVault.sol     │   Event     │                               │
│                       │────────────►│   • verifyAndEmit             │
│   • lock              │             │     (BlockProver)              │
│   • unlock            │             │   • decode CollateralLocked   │
│                       │             │   • openLoan                  │
└───────────┬───────────┘             │   • repay                     │
            │                         │   • liquidate                 │
            │                         │                               │
            │                         │   CreditToken.sol             │
            │                         │   (test liquidity)             │
            │                         │                               │
            │                         └───────────────┬───────────────┘
            │                                         │
            ▼                                         ▼
   ┌───────────────────┐                    Borrower receives
   │ Attestcoin        │                    test stablecoins /
   │ Attestors         │                    Creditcoin liquidity
   └─────────┬─────────┘
             │
             ▼
   ┌───────────────────┐
   │ Proof Worker      │
   │                   │
   │ • @gluwa/usc-sdk  │
   │ • Proof Builder   │
   │ • Merkle proofs   │
   │ • Continuity      │
   └───────────────────┘
```

---

# Smart Contracts

## `SourceVault.sol`

**Network:** Ethereum Sepolia

Responsible for:

- Locking eligible RWA tokens.
- Tracking borrower and loan IDs.
- Holding collateral during the loan.
- Emitting loan-scoped collateral events.
- Unlocking collateral after repayment / settlement.

Example event:

```solidity
event CollateralLocked(
    address indexed borrower,
    address indexed asset,
    uint256 amount,
    bytes32 indexed loanId
);
```

---

## `LoanBook.sol`

**Network:** Creditcoin CC3 Testnet

The `LoanBook` contract is the Attestcoin Smart Contract (ASC) responsible for:

- Verifying Ethereum transactions through BlockProver.
- Decoding proven `CollateralLocked` events.
- Preventing replay attacks.
- Opening loans against verified collateral.
- Tracking loan state and LTV.
- Processing repayment.
- Managing liquidation conditions.

The loan cannot be opened unless the source-chain collateral proof is valid.

---

## `MockRWA.sol`

A testnet stand-in for tokenized real-world assets such as:

- Tokenized equities
- Funds
- Invoices
- Credit positions

Used to demonstrate the complete RWA collateral lifecycle without requiring a production RWA issuer.

---

## `MockStable.sol`

Test liquidity used on Creditcoin CC3 to simulate the stablecoin / credit asset borrowed against the verified collateral.

---

# Loan Parameters

The MVP uses the following hackathon defaults:

| Parameter | MVP Value |
|---|---:|
| **LTV** | 50% |
| **Target Overcollateralization** | 200% |
| **Collateral Verification** | Attested |
| **Price Oracle** | Attested price event / conservative fixed LTV |
| **Liquidation** | Proven price-drop event or conservative fixed LTV |

### Oracle Principle

Attora does **not** assume a price oracle is trustworthy merely because it exists.

Collateral amount is verified through Attestcoin.

If price data is required, the price event should also be attested and proven.

> Do not fake Chainlink data on CC3 unless the relevant source event is also proven.

---

# End-to-End Flow

```text
┌─────────────┐
│   Borrower  │
└──────┬──────┘
       │
       │ 1. Lock RWA
       ▼
┌─────────────────────┐
│ Ethereum Sepolia   │
│                     │
│ SourceVault.lock() │
└──────────┬──────────┘
           │
           │ CollateralLocked
           ▼
┌─────────────────────┐
│ Attestcoin           │
│ Attestation Layer    │
└──────────┬──────────┘
           │
           │ Proven block / transaction
           ▼
┌─────────────────────┐
│ Proof Worker         │
│                     │
│ Merkle Proof        │
│ Continuity Proof    │
└──────────┬──────────┘
           │
           │ Proof + tx data
           ▼
┌──────────────────────────┐
│ Creditcoin CC3           │
│                          │
│ LoanBook ASC             │
│                          │
│ BlockProver.verify()     │
│          ↓               │
│ Decode event              │
│          ↓               │
│ Open Loan                 │
└───────────┬──────────────┘
            │
            │ Credit
            ▼
      ┌─────────────┐
      │  Borrower   │
      │ receives    │
      │ liquidity   │
      └─────────────┘
```

---

# Repository Structure

```text
attora/
├── README.md
│
├── docs/
│   ├── ATTESTCOIN.md
│   └── ARCHITECTURE.md
│
├── contracts/
│   ├── source/
│   │   └── SourceVault.sol
│   │
│   └── creditcoin/
│       └── LoanBook.sol
│
├── worker/
│   ├── proof-builder/
│   └── submitter/
│
├── frontend/
│   └── lock-prove-borrow/
│
└── scripts/
    ├── deploy-sepolia.ts
    └── deploy-cc3.ts
```

---

# Quick Start

## Prerequisites

- Node.js 18+
- Foundry or Hardhat
- Ethereum Sepolia RPC
- Creditcoin CC3 Testnet RPC
- Sepolia ETH
- CTC / EVM test funds
- Access to the Attestcoin Proof Builder API

---

## Installation

```bash
git clone <this-repo>
cd attora

npm install
```

Or, if using Foundry:

```bash
forge install
```

---

# Deployment

### 1. Deploy Source Vault and Mock RWA

Deploy the Ethereum Sepolia contracts:

```bash
npm run deploy:sepolia
```

This deploys:

- `SourceVault.sol`
- `MockRWA.sol`

---

### 2. Deploy LoanBook ASC

Deploy the Creditcoin CC3 contracts:

```bash
npm run deploy:cc3
```

This deploys:

- `LoanBook.sol`
- `MockStable.sol`

---

### 3. Start the Proof Worker

```bash
npm run worker
```

The worker:

1. Watches the Ethereum source vault.
2. Detects `CollateralLocked`.
3. Waits for the relevant attestation.
4. Requests proofs from the Attestcoin Proof Builder API.
5. Builds the proof payload.
6. Submits the proof to Creditcoin.

---

# Demo Flow

The complete hackathon demo follows this sequence:

### Step 1 — Mint RWA

Mint test `MockRWA` tokens on Ethereum Sepolia.

### Step 2 — Lock Collateral

Call:

```solidity
SourceVault.lock(amount, loanId)
```

The vault emits:

```text
CollateralLocked(
    borrower,
    asset,
    amount,
    loanId
)
```

### Step 3 — Generate Proof

The proof worker:

- Detects the event.
- Waits for Attestcoin attestation.
- Requests the required Merkle proof.
- Builds continuity proof data.
- Prepares the transaction payload.

### Step 4 — Verify on Creditcoin

The frontend or script calls:

```solidity
LoanBook.openLoan(
    proof,
    encodedTx,
    ...
)
```

The ASC invokes the BlockProver precompile.

### Step 5 — Open Loan

If the proof is valid:

```text
Ethereum collateral
        ↓
Attestcoin proof
        ↓
BlockProver verification
        ↓
CollateralLocked decoded
        ↓
Loan opened
```

### Step 6 — Borrow

The borrower receives test stablecoins / credit on Creditcoin.

---

# Security Model

Attora is designed around **proof-based collateral verification** rather than trust assumptions.

### No trusted bridge operator

The RWA remains on Ethereum.

No centralized operator is responsible for reporting the collateral state.

### No self-reported collateral

The borrower cannot simply tell Creditcoin:

> "I locked 1,000 RWA tokens."

The Creditcoin ASC independently verifies the source transaction.

### Replay protection

Loan creation must protect against replay using:

```text
(chainKey, blockHeight, txIndex)
```

This prevents the same source transaction from being reused to open multiple loans.

### Fail-closed loan creation

If BlockProver verification fails:

```text
Loan creation → REVERT
```

The protocol does not fall back to an admin-set collateral value.

---

# Attestcoin Resources

The implementation is based on the following Attestcoin documentation:

- [Attestcoin Environments](https://docs.attestcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments)
- [Attestcoin Readability](https://docs.attestcoin.org/attestcoin-protocol/attestcoin-readability)
- [Attestcoin Guided Tutorials](https://docs.attestcoin.org/attestcoin-protocol/guided-tutorials)

The Cross-Chain Loan tutorial is particularly relevant to Attora's architecture.

---

# Hackathon Submission

**Event:** BUIDL CTC 2026 Fall — BUIDL For The Real World

**Tracks:**

- RWA — Primary
- DeFi — Secondary

**Attora submission checklist:**

- [ ] Original work for BUIDL CTC 2026 Fall
- [ ] Deployed on Creditcoin CC3 Testnet
- [ ] Deployed on Ethereum Sepolia
- [ ] Attestcoin integration is load-bearing
- [ ] Loan cannot open without valid BlockProver verification
- [ ] `docs/ATTESTCOIN.md` explains the integration
- [ ] `docs/ARCHITECTURE.md` explains system architecture
- [ ] Public GitHub repository
- [ ] Team information completed
- [ ] Deck / one-pager PDF
- [ ] Demo video
- [ ] Demo demonstrates:

```text
Lock on Ethereum
      ↓
Attestation
      ↓
Proof generation
      ↓
BlockProver verification
      ↓
Loan opened on Creditcoin
      ↓
Borrower receives liquidity
```

**Hackathon:** [BUIDL CTC 2026 Fall](https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail)

**Deadline:** 13 September 2026, 23:59 ET

---

# What Attora Is Not

Attora is intentionally scoped as a hackathon MVP.

It is:

- Not a U.S. broker-dealer.
- Not a production lending platform.
- Not a live covered-call / 0% APR engine.
- Not a wrapper around Spout Finance.
- Not a bridge that transfers the RWA to Creditcoin.
- Not eligible as an Attestcoin integration if Attestcoin is merely imported but not used for loan verification.

---

# Future Roadmap

Post-hackathon development could include:

### Mainnet RWA Support

Support production tokenized assets on Ethereum mainnet.

### Attested Pricing

Introduce proven RWA valuation events for dynamic LTV and liquidation.

### Attested Options Premium

Add an attested `PremiumPosted` cashflow mechanism for covered-call / 0% APR products.

### Cross-Chain Repayment

Use Attestcoin writability or attested unlock events to automatically release Ethereum collateral after repayment.

### Production Custody

Integrate regulated RWA issuers, custodians, and compliant tokenized asset infrastructure.

### Additional Source Chains

Expand beyond Ethereum as additional Attestcoin-readable environments become available.

---

# Core Value Proposition

Attora separates **asset custody** from **credit access**.

The RWA does not need to leave Ethereum.

Creditcoin does not need to blindly trust Ethereum.

Instead:

```text
RWA stays on Ethereum
          +
Attestcoin proves the state
          +
Creditcoin verifies the proof
          =
Trust-minimized RWA liquidity
```

> **Keep the asset. Prove the collateral. Unlock the credit.**

---

# License

MIT