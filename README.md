**ATTORA**

**Private RWA lock on Ethereum. Attested fact on Creditcoin. Loan without publishing the book.**

Provex is confidential RWA credit for the Creditcoin Attestcoin stack. Collateral is locked in a confidential vault on Ethereum. The vault does **not** broadcast size or inventory. It emits a commitment / eligibility statement. Attestcoin proves that source-chain statement on Creditcoin. An Attestcoin Smart Contract then opens a loan against the proof — not against a trusted feed, and not against a public position tape.

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

Provex targets both problems: **keep RWA size private, still prove on Creditcoin that a valid lock exists.**

---

## Solution

**Confidential lock. Public proof of a fact. Settlement on Creditcoin.**

1. Borrower deposits an eligible RWA token (or hackathon mock) into `ConfidentialVault` on Ethereum Sepolia.  
2. The vault records a **commitment** `C = commit(amount, salt, borrower)` (or an encrypted balance). It emits:

   `CollateralCommitted(borrower, loanId, commitment, tier)`

   It does **not** emit the raw amount.  
3. Optional eligibility check on source: vault only emits if `amount >= tierMin`. The chain sees *tier*, not inventory.  
4. Attestcoin attestors finalize the Sepolia block. The proof worker builds Merkle + continuity proofs of the **commitment tx**.  
5. `LoanBook` on Creditcoin CC3 testnet calls the BlockProver precompile, verifies the tx, decodes `CollateralCommitted`, and opens a loan capped by `tier`.  
6. Draw / repay happen on CC3. Unlock on Sepolia requires a later attested close (or source-side repay + release).

Creditcoin never learns the exact collateral size. It learns: **this loanId is backed by a verified confidential lock at tier T.**

Attestcoin is the underwriting step. Privacy is the payload shape. Neither replaces the other.

---

## What is confidential vs what is public

| Hidden (source vault) | Public (must be, for Attestcoin + CC3) |
|---|---|
| Exact token amount | That a `CollateralCommitted` tx exists |
| Asset mix / inventory | `loanId`, `commitment`, `tier` |
| Optional identity mapping | Borrower address used to open the loan |
| Internal salt / plaintext | Proof bytes, `chainKey`, `blockHeight` |
| | Debt drawn on CC3 (public EVM transfer) |

Honest limit: Creditcoin is a public EVM. Stablecoin draws are visible. Provex is **confidential underwriting**, not a fully dark chain.

---

## Why Attestcoin stays core

Every `openLoan` **fails closed** if BlockProver verification fails.

The proven object is the Sepolia transaction that emitted `CollateralCommitted`. Judges can inspect `chainKey`, block height, and proof payload. There is no `setCollateral(amount)` admin path.

| Piece | Role |
|---|---|
| Source chain | Ethereum Sepolia (`chainKey = 1` on CC3 testnet) |
| Event proven | `CollateralCommitted(borrower, loanId, commitment, tier)` |
| Proof Builder API | `https://proof-gen-api.cc3-testnet.creditcoin.network/` |
| Decoder (CC3 testnet) | `0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f` |
| BlockProver | `0x0000000000000000000000000000000000000FD2` |
| ChainInfo | `0x0000000000000000000000000000000000000fd3` |
| ASC dashboard | `https://dashboard.cc3-testnet.creditcoin.network/` |
| SDK | `@gluwa/usc-sdk` |

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

| Tier | Meaning on source | Max borrow on CC3 (test) |
|---|---|---|
| 1 | commitment to ≥ 100 units | 50 |
| 2 | commitment to ≥ 1_000 units | 500 |
| 3 | commitment to ≥ 10_000 units | 5_000 |

LTV is enforced by **tier gates on the vault**, not by publishing mark-to-market size on Creditcoin.

---

## Repo layout

```
provex/
├── README.md
├── docs/
│   ├── ATTESTCOIN.md
│   └── CONFIDENTIALITY.md
├── contracts/
│   ├── source/                  # Sepolia
│   └── creditcoin/              # CC3 ASC
├── worker/                      # proof builder + submitter
├── frontend/
└── scripts/
    ├── deploy-sepolia.ts
    └── deploy-cc3.ts
```

---

## Quick start

```bash
git clone <repo>
cd provex
npm install

npm run deploy:sepolia
npm run deploy:cc3
npm run worker
npm run frontend
```

Demo path:

1. Approve MockRWA → `ConfidentialVault.commit(amount, salt, loanId)`  
2. Vault emits `CollateralCommitted` (commitment + tier only)  
3. Worker waits for attestation, returns proofs  
4. On CC3: `LoanBook.openLoan(chainKey, blockHeight, encodedTx, merkleProof, continuityProof, loanId)`  
5. `draw` up to the tier cap  

If you skip the proof and call a setter, the loan must revert. That is the product.

---

## Hackathon requirements map

Event: https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail  
Deadline: **13 September 2026, 23:59 ET**

| Rule | How Provex meets it |
|---|---|
| Must use Attestcoin as a core feature | `openLoan` verifies BlockProver proofs of the Sepolia commitment tx |
| Working integration code | vault + worker + ASC + frontend proof panel |
| Technical write-up | `docs/ATTESTCOIN.md` + this README |
| Deployed on testnet | Sepolia + CC3 testnet |
| Original work | New contracts; not a Spout fork |
| Sector | RWA (primary), DeFi (secondary) |
| GitHub README, deck, demo video | lock → commitment event → proof ready → loan on CC3 |
| Do not infringe IP | Independent design; confidential *underwriting*, not a copy of any issuer |

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
