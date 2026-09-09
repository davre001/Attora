**ATTORA**

**Private RWA lock on Ethereum. Attested fact on Creditcoin. Loan without publishing the book.**

Attora is confidential RWA credit for the Creditcoin Attestcoin stack. Collateral is locked in a confidential vault on Ethereum. The vault does **not** broadcast size or inventory. It emits a commitment / eligibility statement. Attestcoin proves that source-chain statement on Creditcoin. An Attestcoin Smart Contract then opens a loan against the proof — not against a trusted feed, and not against a public position tape.

Built for **BUIDL CTC 2026 Fall — BUIDL For The Real World**.

Tracks: **RWA** · **DeFi**  
Theme requirement: **Attestcoin Protocol is a core, load-bearing feature.**

---

## Problem

Public RWA lending leaks the book.

If a fund, company, or individual posts tokenized equities, bonds, invoices, or private credit as collateral on a transparent chain, the market can see:

- who holds the asset
- how much was posted
- when they need cash
- the liquidation line

That information is competitive. Many real-world holders will not use on-chain credit if the position is a press release.

The other failure mode is worse for this stack: hiding the lock behind an API so Creditcoin “just trusts” that collateral exists. That is not Attestcoin. That is a bridge operator.

Attora targets both problems: **keep RWA size private, still prove on Creditcoin that a valid lock exists.**

---

## Solution

**Confidential lock. Public proof of a fact. Settlement on Creditcoin.**

1. Borrower deposits an eligible RWA token (or hackathon mock) into `ConfidentialVault` on Ethereum Sepolia.
2. The vault records a **commitment** `C = commit(amount, salt, borrower)` (or an encrypted balance). It emits:

   `CollateralCommitted(borrower, loanId, commitment, tier)`

   It does **not** emit the raw amount.

3. Optional eligibility check on source: vault only emits if `amount >= tierMin`. The chain sees _tier_, not inventory.
4. Attestcoin attestors finalize the Sepolia block. The proof worker builds Merkle + continuity proofs of the **commitment tx**.
5. `LoanBook` on Creditcoin CC3 testnet calls the BlockProver precompile, verifies the tx, decodes `CollateralCommitted`, and opens a loan capped by `tier`.
6. Draw / repay happen on CC3. Unlock on Sepolia requires a later attested close (or source-side repay + release).

Creditcoin never learns the exact collateral size. It learns: **this loanId is backed by a verified confidential lock at tier T.**

Attestcoin is the underwriting step. Privacy is the payload shape. Neither replaces the other.

---

## What is confidential vs what is public

| Hidden (source vault)     | Public (must be, for Attestcoin + CC3)  |
| ------------------------- | --------------------------------------- |
| Exact token amount        | That a `CollateralCommitted` tx exists  |
| Asset mix / inventory     | `loanId`, `commitment`, `tier`          |
| Optional identity mapping | Borrower address used to open the loan  |
| Internal salt / plaintext | Proof bytes, `chainKey`, `blockHeight`  |
|                           | Debt drawn on CC3 (public EVM transfer) |

Honest limit: Creditcoin is a public EVM. Stablecoin draws are visible. Attora is **confidential underwriting**, not a fully dark chain.

---

## Why Attestcoin stays core

Every `openLoan` **fails closed** if BlockProver verification fails.

The proven object is the Sepolia transaction that emitted `CollateralCommitted`. Judges can inspect `chainKey`, block height, and proof payload. There is no `setCollateral(amount)` admin path.

| Piece                 | Role                                                      |
| --------------------- | --------------------------------------------------------- |
| Source chain          | Ethereum Sepolia (`chainKey = 1` on CC3 testnet)          |
| Event proven          | `CollateralCommitted(borrower, loanId, commitment, tier)` |
| Proof Builder API     | `https://proof-gen-api.cc3-testnet.creditcoin.network/`   |
| Decoder (CC3 testnet) | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f`              |
| BlockProver           | `0x0000000000000000000000000000000000000FD2`              |
| ChainInfo             | `0x0000000000000000000000000000000000000fd3`              |
| ASC dashboard         | `https://dashboard.cc3-testnet.creditcoin.network/`       |
| SDK                   | `@gluwa/usc-sdk`                                          |

Environments: https://docs.attestcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments  
Readability: https://docs.attestcoin.org/attestcoin-protocol/attestcoin-readability  
Tutorials: https://docs.attestcoin.org/attestcoin-protocol/guided-tutorials

Depth of use (scoring):

- Verify the confidential-commitment tx **in the same CC3 transaction** that opens the loan
- Replay protection on `(chainKey, blockHeight, txIndex)`
- Decode `CollateralCommitted` from proven bytes — never from an off-chain JSON amount
- Reject proofs that do not match `loanId` + `msg.sender`

---

## Architecture

```
Ethereum Sepolia                         Creditcoin CC3 Testnet
┌──────────────────────────────┐         ┌─────────────────────────────────┐
│ MockRWA                      │         │ LoanBook.sol (ASC)              │
│ ConfidentialVault.sol        │ event   │  BlockProver.verify(...)        │
│  commit(amount, salt)        │ ──────► │  decode CollateralCommitted     │
│  emit commitment + tier      │         │  openLoan(tier) — no raw amount │
│  plaintext stays off-log     │         │ MockStable draw / repay         │
└──────────────┬───────────────┘         └─────────────────────────────────┘
               │
               ▼
     Attestcoin attestors + proof worker
     (@gluwa/usc-sdk, Proof Builder API)
```

### Contracts (MVP)

- `ConfidentialVault.sol` — Sepolia. Stores commitment. Emits `CollateralCommitted`. Optional `reveal()` only to the owner off-band, never required for the loan.
- `LoanBook.sol` — CC3 ASC. Prove → bind loanId → open tier cap → draw/repay.
- `MockRWA.sol` / `MockStable.sol` — testnet stand-ins.

### Tier table (demo)

| Tier | Meaning on source            | Max borrow on CC3 (test) |
| ---- | ---------------------------- | ------------------------ |
| 1    | commitment to ≥ 100 units    | 50                       |
| 2    | commitment to ≥ 1_000 units  | 500                      |
| 3    | commitment to ≥ 10_000 units | 5_000                    |

LTV is enforced by **tier gates on the vault**, not by publishing mark-to-market size on Creditcoin.

---

## Repo layout

```
Attora/
├── README.md
├── docs/
│   ├── frontend-integration.md  # real ABIs, worker API shape, exact contract call params
│   └── abis/                    # ConfidentialVault, MockRWA, LoanBook, MockStable (ABI only)
├── contracts/
│   ├── source/                  # Sepolia: ConfidentialVault.sol, MockRWA.sol, tests, deploy script
│   └── creditcoin/              # CC3 ASC: LoanBook.sol, MockStable.sol, tests, deploy script
├── worker/                      # single Node/TS service: chain listener, proof pipeline, REST API
└── frontend/                    # Next.js app (Desk / Positions / Proofs / Faucet / Docs)
```

Each of `contracts/source`, `contracts/creditcoin`, and `worker` is a self-contained project — there's no root `package.json` tying them together; `cd` into each and follow its own tooling.

---

## Quick start

```bash
git clone <repo>
cd Attora

# Sepolia contracts (ConfidentialVault + MockRWA) — Foundry
cd contracts/source
forge test
forge script script/Deploy.s.sol --rpc-url <sepolia-rpc> --broadcast
cd ../..

# CC3 contracts (LoanBook + MockStable) — Foundry
cd contracts/creditcoin
forge test
SOURCE_VAULT=<ConfidentialVault address from above> \
  forge script script/Deploy.s.sol --rpc-url <cc3-rpc> --broadcast
cd ../..

# worker — Node/TypeScript, see worker/.env.example for required config
cd worker
npm install
npm run dev
cd ..

# frontend — Next.js
cd frontend
npm install
npm run dev
```

Demo path:

1. Approve MockRWA → `ConfidentialVault.commit(amount, salt, loanId)`
2. Vault emits `CollateralCommitted` (commitment + tier only)
3. Worker watches Sepolia, drives the proof through Attestcoin attestation, and serves it over its REST API
4. Wallet calls `LoanBook.openLoan(blockHeight, encodedTx, merkleRoot, siblings, lowerEndpointDigest, continuityRoots)` on CC3 directly — the worker never submits this itself, since CC3 only accepts a proof whose decoded borrower matches `msg.sender`
5. `draw` up to the tier cap

If you skip the proof and call a setter, the loan must revert. That is the product.

---

## Hackathon requirements map

Event: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail  
Deadline: **13 September 2026, 23:59 ET**

| Rule                                  | How Attora meets it                                                       |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Must use Attestcoin as a core feature | `openLoan` verifies BlockProver proofs of the Sepolia commitment tx       |
| Working integration code              | vault + worker + ASC + frontend proof panel                               |
| Technical write-up                    | this README (Problem / Solution / Architecture / Why Attestcoin stays core) |
| Deployed on testnet                   | Sepolia + CC3 testnet                                                     |
| Original work                         | New contracts; not a Spout fork                                           |
| Sector                                | RWA (primary), DeFi (secondary)                                           |
| GitHub README, deck, demo video       | lock → commitment event → proof ready → loan on CC3                       |
| Do not infringe IP                    | Independent design; confidential _underwriting_, not a copy of any issuer |

Submission extras they ask for: integration summary, GitHub, deck, demo video, team identities.

---

## What this is not

- Not a U.S. broker-dealer or live equity wrapper
- Not full-chain dark pool / FHE L2
- Not 0% covered-call yield
- Not eligible if confidentiality is only CSS and Attestcoin is unused

Roadmap after the hackathon: real ZK range proofs inside the commitment, attested mark-to-market without size leak, mainnet Ethereum `chainKey`.

---

## License

MIT
