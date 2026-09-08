# Attora — frontend implementation

Final spec for the hackathon UI.

Confidential RWA desk: commit on Ethereum Sepolia, Attestcoin proves the commitment tx, borrow on Creditcoin CC3 by **tier**. The interface must show **sealed size** and **live proofs**. It must not look like a meme DEX.

---

## 1. Product the UI has to express

- Amount is entered locally and used to build a commitment.  
- On-chain event is `CollateralCommitted(borrower, loanId, commitment, tier)` — no raw size.  
- Loan on CC3 cannot open without a BlockProver-ready proof.  
- Positions show **tier + debt**, never source inventory.  
- Faucet exists so the demo can mint test assets on both chains.

---

## 2. Visual system

### Mood

Private credit office. Flat black, one proof gradient, one sealed violet. No wash, no glow on every card.

### Color

| Token | Hex | Role |
|---|---|---|
| `ink` | `#07080A` | page background |
| `ink-2` | `#0E1014` | cards |
| `ink-3` | `#14181F` | inputs, nested rows |
| `line` | `#1C2129` | borders |
| `mist` | `#8B93A1` | secondary text |
| `snow` | `#F4F6F8` | headings, numbers |
| `sealed` | `#A78BFA` | hidden / commitment chips |
| `proof-from` | `#12E6A5` | gradient start |
| `proof-to` | `#3B82F6` | gradient end |
| `warn` | `#E8B84A` | wrong network |
| `danger` | `#F07167` | failed proof / revert |

```css
--proof: linear-gradient(135deg, #12E6A5 0%, #3B82F6 100%);
```

Use `--proof` only on: primary CTA, active stepper segment, logo mark, `READY` dot.  
Home may use a single radial of `--proof` at 8% opacity behind the mark. Nothing else.

### Type

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display, big numbers | Instrument Sans | 500 / 600 | tracking `-0.03em` |
| Body, nav, labels | IBM Plex Sans | 400 / 500 | 14–16px, line-height 1.5 |
| Hashes, proofs, chainKey | IBM Plex Mono | 400 | 13px, color `mist` |

```
https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;500&family=Instrument+Sans:wght@500;600&display=swap
```

### Shape and space

- Max width `1080px`
- Nav `64px`
- Card radius `20px`, padding `28px`
- Button height `48px`, radius `14px`
- Input radius `12px`
- Section gap `32px`
- Border `1px solid var(--line)`, no drop shadow
- Hover card border only: `#2A3340`
- Motion: `180ms ease-out`; step change fade + `8px` up

---

## 3. Routes (6)

| Route | Page | Job |
|---|---|---|
| `/` | Home | Pitch |
| `/app` | Desk | Commit → prove → borrow |
| `/positions` | Positions | Open loans |
| `/proofs` | Proofs | Judge-facing receipts |
| `/faucet` | Faucet | Testnet gas + mocks |
| `/docs` | Docs | Hidden vs public + addresses |

Nav order: **Desk · Positions · Proofs · Faucet · Docs · Connect**

---

## 4. Pages

### `/` Home

- Mark + wordmark left. Connect right.  
- **H1:** Hide the size. Prove the lock. Borrow.  
- **Sub:** RWA stays in a confidential vault on Ethereum. Creditcoin only receives an Attestcoin proof of the commitment.  
- **Open the desk** (`btn-proof`) · **Inspect a proof** (ghost)  
- Three tiles: Commit on Sepolia · Attestcoin verifies · Loan by tier on CC3  
- Footer: Sepolia + CC3 testnet. No mainnet value.

### `/app` Desk

Main product. Stepper + panel + right rail.

Stepper labels: **01 Commit** · **02 Prove** · **03 Borrow**  
Completed bar and active index use `--proof`.

**Commit**

- Amount field (browser only)  
- `SealedChip`: `AMOUNT HIDDEN ON-CHAIN`  
- CTA: **Commit collateral** (requires Sepolia)  
- After tx: `loanId` + truncated `commitment` in mono. Do not reprint amount.

**Prove**

- Poll worker: `pending` → `attested` → `ready` | `error`  
- Show source tx, `chainKey 1`, `blockHeight`  
- Line: Creditcoin cannot be told. It can only be shown.  
- Borrow disabled until `ready`

**Borrow**

- Requires CC3  
- Show **tier** and **max draw** only  
- **Open loan with proof** then **Draw**  
- On revert, show reason in `danger`

Right rail: network badge, `loanId`, tier, commitment preview, wallet.

Wrong chain: gold `NetworkBanner`, not a dead button.

### `/positions`

Cards: `loanId` · tier · debt · cap · status · Draw / Repay  
Forbidden: `collateral: 10000`.  
Empty: Nothing proven yet.

### `/proofs`

Terminal-in-a-card.

List: Sepolia tx · block · `chainKey` · `READY` / pending  
Detail: commitment, encodedTx, merkle, continuity — copy, truncated.  
Violet `SEALED` if payload has no amount.

### `/faucet`

Four tiles, same card style:

1. Sepolia ETH — outbound link to public faucet  
2. MockRWA — `mint` to connected wallet on Sepolia  
3. CC3 CTC — link to official Creditcoin test faucet  
4. MockStable — `mint` on CC3  

Each tile has its own switch-network control.  
Foot: Testnet only.  
Ghost: **Back to desk**

### `/docs`

Four blocks:

1. Problem — public RWA books leak  
2. Flow — commit → attest → openLoan  
3. Table — hidden vs public  
4. Addresses — vault, LoanBook, BlockProver `0x…0FD2`, decoder, chainIds  

---

## 5. File tree

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── public/
│   └── mark.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── pages/
    │   ├── Home.tsx
    │   ├── Desk.tsx
    │   ├── Positions.tsx
    │   ├── Proofs.tsx
    │   ├── Faucet.tsx
    │   └── Docs.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Nav.tsx
    │   │   ├── Footer.tsx
    │   │   └── Page.tsx
    │   ├── brand/
    │   │   └── Mark.tsx
    │   ├── desk/
    │   │   ├── Stepper.tsx
    │   │   ├── CommitPanel.tsx
    │   │   ├── ProofPanel.tsx
    │   │   ├── BorrowPanel.tsx
    │   │   └── NetworkBanner.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       ├── Badge.tsx
    │       ├── Hash.tsx
    │       └── SealedChip.tsx
```

Stack: Vite + React + TS + wagmi/viem + Tailwind. Two chains in one config: Sepolia + CC3 testnet.

---

## 6. CSS tokens

```css
:root {
  --ink: #07080a;
  --ink-2: #0e1014;
  --ink-3: #14181f;
  --line: #1c2129;
  --mist: #8b93a1;
  --snow: #f4f6f8;
  --sealed: #a78bfa;
  --proof: linear-gradient(135deg, #12e6a5, #3b82f6);
  --font-display: "Instrument Sans", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

html, body, #root {
  background: var(--ink);
  color: var(--snow);
  font-family: var(--font-body);
}

h1, h2, .num {
  font-family: var(--font-display);
  letter-spacing: -0.03em;
}

.hash {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--mist);
}

.btn-proof {
  background: var(--proof);
  color: #06110c;
  font-weight: 500;
  border-radius: 14px;
}

.card {
  background: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: 20px;
}

.chip-sealed {
  color: var(--sealed);
  border: 1px solid color-mix(in srgb, var(--sealed) 35%, transparent);
  background: color-mix(in srgb, var(--sealed) 10%, transparent);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

---

## 7. Components

**Mark:** 20×20 rounded square, fill `--proof`, white **P**.

**Buttons**

- Primary: `.btn-proof`  
- Ghost: transparent, `line` border, `snow` text  
- Warn: `#E8B84A` on `#2A2108` (switch network)

**SealedChip:** `HIDDEN` · `SEALED` · `TIER 2`

**Hash:** mono, truncate middle, copy on click.

**Stepper:** three labels. Active index in a 28px gradient circle.

**Proof READY:** 6px gradient dot + `READY` in mono.

---

## 8. Copy sheet

| Surface | Text |
|---|---|
| Home H1 | Hide the size. Prove the lock. Borrow. |
| Commit | Amount never leaves this browser onto the log. |
| Prove | Waiting on Attestcoin. Creditcoin cannot be told. |
| Borrow | Cap is the tier, not the inventory. |
| Positions empty | Nothing proven yet. |
| Proofs | Source receipts. Sealed payloads. |
| Faucet | Testnet fuel for both chains. |

---

## 9. Data the UI is allowed to show

**Show:** wallet, network, `loanId`, commitment (truncated), tier, tier cap, debt, `chainKey`, blockHeight, proof status, tx hashes.

**Never show after commit:** source `amount`, salt in full, “collateral value” on CC3 screens.

If amount is still in the event log, do not badge the page `SEALED`.

---

## 10. Demo path (video + judging)

1. Faucet → mint MockRWA + MockStable, get gas on both chains  
2. Desk → Sepolia → Commit  
3. Prove → `READY` with `chainKey 1` visible  
4. Switch CC3 → Open loan with proof → Draw  
5. Positions = tier + debt  
6. Proofs = same Sepolia tx the contract verified  

`openLoan` must be impossible from the UI without a `ready` proof payload.

---

## 11. Out of scope

Light mode, extra marketing pages, charts of hidden inventory, fake privacy badges, Inter, pink-purple washes, mainnet.

This file is the frontend contract. Pages, type, color, tree, and what must stay sealed are fixed. Implementation follows it; it does not add screens.
