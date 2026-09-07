# Attora

### Frontend Design Specification

**Attora** is a dark, institutional RWA lending interface designed around one core idea:

> **Keep the asset. Prove the lock. Borrow on Creditcoin.**

The interface should feel like a **private credit desk**, not a casino-style DeFi application.

The design system is intentionally minimal:

- Dark ink canvas
- One proof gradient
- Tight typography
- Generous empty space
- Strong numerical hierarchy
- Proof-first interaction
- No unnecessary DeFi visual noise

---

# 1. Product Identity

## Product Name

**Attora**

One-word product identity.

## Visual Direction

**Mood:** Private credit desk.

The UI should communicate:

- Institutional
- Trustworthy
- Technical
- Financial
- Minimal
- Proof-driven

It should **not** feel:

- Meme-DeFi
- Gamified
- Speculative
- Overly futuristic
- Casino-like

### Core visual principle

> **Black canvas + one green-cyan proof line.**

The gradient is an accent, not a background.

---

# 2. Design System

## Colors

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#07080A` | Page background |
| `ink-2` | `#0E1014` | Cards / panels |
| `line` | `#1C2129` | Borders |
| `mist` | `#8B93A1` | Secondary text |
| `snow` | `#F4F6F8` | Headings / numbers |
| `proof-from` | `#12E6A5` | Gradient start |
| `proof-to` | `#3B82F6` | Gradient end |
| `warn` | `#E8B84A` | Wrong network |
| `danger` | `#F07167` | Errors / liquidation |

## Signature Gradient

Use the signature gradient **only** for:

- Primary CTAs
- Active stepper elements
- Logo / brand mark

```css
--proof: linear-gradient(
  135deg,
  #12E6A5 0%,
  #3B82F6 100%
);
```

### Important

Do **not** wash the entire page in gradient.

The background must remain:

```css
#07080A
```

An optional **8% radial glow** may be placed behind the hero mark only.

---

# 3. Typography

## Display / Numbers

**Instrument Sans**

Alternative:

**Geist**

Weights:

- 500
- 600

Large figures should use:

```css
letter-spacing: -0.03em;
```

Used for:

- H1
- H2
- Large numbers
- Loan amounts
- LTV
- Key metrics

## Body / UI

**IBM Plex Sans**

Weights:

- 400
- 500

Recommended:

```text
Font size: 14–16px
Line height: 1.5
```

## Monospace

**IBM Plex Mono**

Used for:

- Transaction hashes
- Proof data
- `chainKey`
- Block heights
- Technical identifiers
- Proof statuses

Recommended:

```text
Font size: 13px
Weight: 400
```

## Google Fonts

```css
@import url(
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;500&family=Instrument+Sans:wght@500;600&display=swap"
);
```

---

# 4. Spacing & Shape

| Element | Specification |
|---|---:|
| Cards | `20px` radius |
| Buttons | `14px` radius |
| Inputs | `12px` radius |
| Maximum page width | `1080px` |
| Section gap | `32px` |
| Card padding | `28px` |

## Cards

Cards should have:

- No drop shadow
- `1px` border
- `#0E1014` background
- `20px` radius

Default border:

```css
border: 1px solid #1C2129;
```

Hover border:

```css
#2A3340
```

---

# 5. Motion

Motion should feel controlled and institutional.

### Hover

```text
180ms ease-out
```

### Step transitions

Use:

```text
Fade + 8px upward movement
```

### Avoid

- Bounce animations
- Confetti
- Excessive parallax
- Spinning crypto graphics
- Overly animated dashboards

---

# 6. Application Structure

Attora should contain **exactly five pages**.

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | One claim + start demo |
| `/app` | Desk | Lock → Prove → Borrow |
| `/positions` | Positions | Open loans, LTV, repayment |
| `/proofs` | Proofs | Attestcoin receipts |
| `/docs` | How it works | Hackathon explainer |

## Explicitly excluded

Do **not** build:

- Marketplace
- Blog
- Token page
- Yield dashboard
- Governance page
- Community page
- Multi-page documentation portal

The hackathon product should remain focused.

---

# 7. Navigation

## Top Navigation

Height:

```text
64px
```

Structure:

```text
[Attora Mark]   App   Proofs   Docs                     Connect
```

### Logo

- Mark on the left
- "Attora" in Instrument Sans
- Weight 500

### Navigation links

Default:

```text
#8B93A1
```

Active:

- Snow text
- 2px gradient underline

### Connect

Small ghost pill.

Transparent background with:

```css
border: 1px solid #1C2129;
```

---

# 8. Brand Mark

The Attora mark should be:

- `20 × 20px`
- Rounded square
- Filled with the proof gradient
- White `A`, proof/check, or lock-check symbol

Example conceptual direction:

```text
┌──────┐
│  ✓   │
└──────┘
```

The mark should communicate:

**Asset → Proof → Credit**

without becoming visually complicated.

---

# 9. Page 1 — Home

### Route

```text
/
```

### Purpose

Introduce the core proposition and immediately move users into the demo.

---

## Hero

### H1

> **Keep the asset. Prove the lock. Borrow on Creditcoin.**

### Subheading

> RWA collateral stays on Ethereum. Creditcoin only sees an Attestcoin proof.

### Primary CTA

**Open the desk**

Gradient button.

### Secondary CTA

**See a proof**

Ghost button.

---

## Hero Tiles

Three compact tiles:

### 01 — Lock

**Lock on Sepolia**

The RWA remains on Ethereum.

### 02 — Prove

**Attestcoin verifies**

The collateral lock is cryptographically proven.

### 03 — Borrow

**Loan opens on CC3**

Creditcoin opens the loan against verified collateral.

---

## Footer

Include a concise testnet disclaimer.

Example:

```text
Attora is a testnet hackathon prototype.
Do not deposit real assets.
```

---

# 10. Page 2 — Desk

### Route

```text
/app
```

This is the **main product experience**.

The entire lending flow should exist on one page.

---

# Stepper

Place the stepper at the top:

```text
01 Lock  ─────  02 Prove  ─────  03 Borrow
```

### Inactive

```text
color: #8B93A1
```

### Active

Number sits inside a:

```text
28px circle
```

with the proof gradient.

### Completed steps

Connected using:

```text
2px gradient bar
```

---

# Desk Layout

Desktop:

```text
┌─────────────────────────────────────────────┐
│                 STEPPER                     │
├──────────────────────────┬──────────────────┤
│                          │                  │
│      ACTIVE PANEL        │    RIGHT RAIL    │
│                          │                  │
│                          │ Chain            │
│                          │ Loan ID          │
│                          │ LTV              │
│                          │ Wallet           │
│                          │                  │
└──────────────────────────┴──────────────────┘
```

Single-column flow on mobile.

---

# Lock Panel

Copy:

> **Collateral stays on Ethereum.**

The user selects:

- RWA asset
- Amount
- Loan ID

Then locks the collateral in `SourceVault`.

Primary action:

**Lock collateral**

---

# Proof Panel

Copy:

> **Waiting on Attestcoin. Creditcoin cannot be told — only shown.**

Display:

- Source transaction
- Block height
- Chain key
- Proof status
- Attestation status

Ready state:

```text
● READY
```

The dot uses the signature gradient.

Status text uses:

```text
IBM Plex Mono
```

---

# Borrow Panel

Copy:

> **Switch to Creditcoin. Open the loan with the proof.**

Primary action:

**Open loan**

The transaction should only succeed when BlockProver verifies the source-chain collateral event.

---

# Right Rail

Show:

```text
CHAIN
Ethereum Sepolia

LOAN ID
0x••••••••

LTV
50%

WALLET
0x••••...••••
```

Keep this panel compact.

---

# Wrong Network

Wrong network must use **warning gold**, not red.

Color:

```css
#E8B84A
```

Background:

```css
#2A2108
```

Example:

```text
Wrong network

Switch to Creditcoin CC3
```

Primary action:

**Switch network**

---

# 11. Page 3 — Positions

### Route

```text
/positions
```

Purpose:

Show the user's proven loans.

---

## Position Fields

Display:

| Field | Description |
|---|---|
| Loan ID | Unique loan identifier |
| Collateral | Verified collateral |
| Debt | Current borrowed amount |
| LTV | Current loan-to-value |
| Status | Loan state |
| Action | Draw / Repay |

Possible actions:

```text
Draw
Repay
```

---

## Empty State

When no loans exist:

> **Nothing proven yet.**

Avoid overly elaborate illustrations.

The empty state should remain minimal.

---

# 12. Page 4 — Proofs

### Route

```text
/proofs
```

This page is primarily for **judges and technical reviewers**.

It should feel like a **terminal inside an institutional card**.

---

# Proof List

Each proof job displays:

```text
Sepolia TX
blockHeight
chainKey: 1
status
```

Example:

```text
Sepolia TX
0x84c1...91af

blockHeight
8,421,932

chainKey
1

status
● READY
```

---

# Proof Detail

When a proof is opened, show:

### Encoded Transaction

```text
0x02f8...
```

Truncated by default.

Include:

**Copy**

button.

### Merkle Proof

Display proof data in monospace.

Include:

**Copy**

button.

### Continuity Proof

Display proof data in monospace.

Include:

**Copy**

button.

---

## Proof Page Principle

This page should visually communicate:

> **This is evidence, not a dashboard.**

Avoid charts and decorative widgets.

---

# 13. Page 5 — Docs

### Route

```text
/docs
```

The docs page should fit the hackathon context.

**No long essay.**

Use only four blocks.

---

## 01 — Problem

Tokenized RWAs live on Ethereum while Creditcoin provides credit infrastructure.

Attora connects the two without requiring the RWA to move.

---

## 02 — Flow

```text
Lock on Ethereum
       ↓
Attestcoin attestation
       ↓
Proof generation
       ↓
BlockProver verification
       ↓
Loan opens on Creditcoin
```

---

## 03 — Why Attestcoin

Attestcoin provides the cryptographic bridge between the source-chain event and the Creditcoin lending transaction.

Creditcoin does not trust a user-submitted collateral value.

It verifies the underlying source-chain event.

---

## 04 — Testnet Addresses

Display the relevant:

- Ethereum Sepolia contracts
- Creditcoin CC3 contracts
- BlockProver
- ChainInfo
- Decoder
- Proof Builder API

Use monospace formatting for addresses.

---

# 14. File Structure

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
│
├── public/
│   └── mark.svg
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    │
    ├── pages/
    │   ├── Home.tsx
    │   ├── Desk.tsx
    │   ├── Positions.tsx
    │   ├── Proofs.tsx
    │   └── Docs.tsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Nav.tsx
    │   │   ├── Footer.tsx
    │   │   └── Page.tsx
    │   │
    │   ├── brand/
    │   │   └── Mark.tsx
    │   │
    │   ├── desk/
    │   │   ├── Stepper.tsx
    │   │   ├── LockPanel.tsx
    │   │   ├── ProofPanel.tsx
    │   │   ├── BorrowPanel.tsx
    │   │   └── NetworkBanner.tsx
    │   │
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       ├── Badge.tsx
    │       └── Hash.tsx
    │
    ├── hooks/
    │   ├── useLock.ts
    │   ├── useProofJob.ts
    │   └── useLoanBook.ts
    │
    ├── config/
    │   ├── chains.ts
    │   ├── contracts.ts
    │   └── wagmi.ts
    │
    ├── abi/
    │   ├── SourceVault.ts
    │   └── LoanBook.ts
    │
    └── lib/
        ├── format.ts
        └── loanId.ts
```

---

# 15. CSS Tokens

Place the following in:

```text
src/index.css
```

```css
@import url(
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;500&family=Instrument+Sans:wght@500;600&display=swap"
);

:root {
  --ink: #07080a;
  --ink-2: #0e1014;
  --line: #1c2129;
  --mist: #8b93a1;
  --snow: #f4f6f8;

  --proof: linear-gradient(
    135deg,
    #12e6a5,
    #3b82f6
  );

  --font-display: "Instrument Sans", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}

html,
body,
#root {
  background: var(--ink);
  color: var(--snow);
  font-family: var(--font-body);
}

h1,
h2,
.num {
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
```

---

# 16. Component Styling Rules

## Navigation

```text
Height: 64px
Background: transparent
```

Logo:

```text
Mark + Attora
```

Links:

```text
Mist
```

Active:

```text
Gradient underline
2px
```

Connect:

```text
Small ghost pill
```

---

## Primary Button

Use the proof gradient:

```text
--proof
```

Height:

```text
48px
```

In panels:

```text
width: 100%
```

Text:

```text
#06110C
```

---

## Ghost Button

```text
background: transparent
border: 1px solid #1C2129
color: #F4F6F8
```

---

## Warning Button

Background:

```text
#2A2108
```

Text:

```text
#E8B84A
```

Used primarily for network switching.

---

## Cards

```text
background: #0E1014
border: 1px solid #1C2129
border-radius: 20px
padding: 28px
```

No shadows.

Hover:

```text
border → #2A3340
```

---

# 17. Status System

## Proof Ready

```text
● READY
```

Use:

- Tiny gradient dot
- `READY` in IBM Plex Mono

## Pending

```text
● PENDING
```

Use muted styling.

## Error

```text
ERROR
```

Use:

```text
#F07167
```

## Liquidatable

Use danger styling:

```text
#F07167
```

Do not use red for ordinary network warnings.

---

# 18. Content Guidelines

Keep copy short.

## Home

> **Keep the asset. Prove the lock. Borrow.**

## Desk — Lock

> **Collateral stays on Ethereum.**

## Desk — Prove

> **Waiting on Attestcoin. Creditcoin cannot be told — only shown.**

## Desk — Borrow

> **Switch to Creditcoin. Open the loan with the proof.**

## Positions — Empty

> **Nothing proven yet.**

## Proofs

> **Source receipts.**

---

# 19. UX Principles

### 1. Proof before credit

The interface should make it visually obvious that the loan depends on proof.

```text
Collateral
    ↓
Proof
    ↓
Credit
```

### 2. Never hide the source chain

Users and judges should always understand where the collateral lives.

### 3. Make technical evidence inspectable

Transaction hashes, block heights, chain keys, Merkle proofs, and continuity proofs should be accessible.

### 4. Keep the interface calm

No visual noise.

No excessive animation.

No unnecessary cards.

### 5. Design for the demo

The user should be able to understand the entire product in seconds.

---

# 20. What Not To Do

## ❌ No purple unicorn gradients

The only signature gradient is:

```text
#12E6A5 → #3B82F6
```

Do not introduce additional decorative gradients.

## ❌ No Inter-on-everything

Use:

- Instrument Sans
- IBM Plex Sans
- IBM Plex Mono

## ❌ No 12-page app

Keep the product to five pages:

```text
Home
Desk
Positions
Proofs
Docs
```

## ❌ No light mode

The hackathon demo is intentionally dark.

## ❌ No stock photos

The product communicates trust through:

- Typography
- Proofs
- Numbers
- Architecture
- Whitespace

—not stock imagery.

---

# 21. Final Design Rule

The entire Attora frontend can be summarized as:

```text
5 pages
+
2 primary fonts
+
1 mono font
+
1 gradient
+
dark ink
+
proof-first UX
```

The visual language should feel like **institutional credit infrastructure**, while the interaction remains simple enough for a hackathon judge to understand immediately.

> **Attora — Keep the asset. Prove the lock. Borrow on Creditcoin.**