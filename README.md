# Attora

**Private RWA workflow on Canton.**  
Create → status → transfer or fulfill → audit.

Attora is a pilot-ready business workflow for one real-world asset unit. The ledger is **Daml on Canton**. The UI is three roles: **Issuer**, **Holder**, **Observer**.

Built for **HackCanton — Track 1: Real-World Assets (RWA) & Business Workflows**.

---

## What Attora is

Attora is not a DEX, not a Bitget strategy, and not a public EVM vault.

It is an **end-to-end issuance workflow** organizations can run as a pilot:

1. Issuer **creates** an RWA record (invoice, receipt, or fund unit — one type per pilot).  
2. Issuer **updates status** (`Draft → Issued → Active`).  
3. Holder **accepts a transfer** or marks **fulfilled / settled**.  
4. Observer pulls an **audit / report** without needing the full commercial file.

Privacy is Canton’s default: only parties on the contract see the payload they are entitled to. Size and terms stay with issuer and holder. The observer sees life-cycle events and references.

---

## Problem

Public chains make RWA issuance look easy and unusable.

If you put issuance, transfers, and settlement on a global mempool:

- counterparties see **size and terms**  
- an auditor either sees **everything** or **nothing**  
- firms will not run the workflow in production

Paper and email still win because they are ugly but private. Canton exists so several organizations can share **one workflow** without sharing **the whole book**.

The ecosystem still needs a **simple** loop: create, change status, transfer or fulfill, audit — with roles a business user can click.

---

## Solution

One Daml template. Three parties. One UI.

### Workflow

```
Create  →  Update status  →  Transfer | Fulfill  →  Audit / report
```

| Step | Choice (Daml) | Who |
|---|---|---|
| Create | `Create` | Issuer |
| Status | `Issue`, `Activate` | Issuer |
| Transfer | `Transfer` | Holder (or issuer, then accept) |
| Fulfill | `Fulfill` | Holder |
| Audit | query + report | Observer (read) |

### Roles

| Role | Can do | Sees |
|---|---|---|
| Issuer | Create, issue, change status | Full record they issued |
| Holder | Accept transfer, fulfill | Full record they hold |
| Observer | Report only | Status, timestamps, asset ref — not amount if split |

Switch role in the UI = act as a different Canton **party**.

### Confidentiality

Not FHE. Not a fake “encrypted” event on Ethereum.

- Contract stakeholders see `amount` and terms.  
- Observer is on a **header** contract (id, status, hash) or listed with a thinner view.  
- No public explorer tape of inventory.

That is why this runs on Canton instead of a public L1.

---

## How Canton and Daml are integrated

| Piece | Role |
|---|---|
| **Daml** | Source of truth: `RwaUnit` template and choices |
| **Canton participant** | Hosts the contracts; enforces who sees what |
| **Parties** | `issuer`, `holder`, `observer` |
| **Ledger JSON API** | What the UI calls — not MetaMask as ledger |
| **DevNet** | Where the MVP is deployed for the demo |

```
Issuer / Holder / Observer (UI)
        ↓
Ledger API
        ↓
Daml RwaUnit on Canton
        ↓
Need-to-know views per party
```

No Creditcoin, Attestcoin, Bitget Playbook, or mock ERC-20s in this repo.

---

## Expected hackathon output

| Required | Attora |
|---|---|
| MVP: create → status → transfer/fulfill → audit | Daml choices + UI |
| Lightweight UI with roles | Issuer / Holder / Observer |
| One-page brief: ICP, use case, who pays, why Canton | Below |
| Pilot plan: 2–3 steps + integrations | Below |

---

## One-page business brief

**ICP.** Operations lead at a mid-market issuer (trade-finance desk, fund admin, or commodity registrar) that already issues paper or spreadsheet units and cannot put size on a public chain.

**Use case.** Issue one asset class, move it through status and transfer/fulfillment, give an auditor a report.

**Who pays.** The **issuer** (workflow fee per live unit or monthly pilot). Holder is invited. Observer is included so the pilot can close.

**Why Canton.** Shared workflow across firms with **need-to-know** data. Same reason institutions use Canton: coordination without a public book.

---

## Pilot plan

1. **Internal dry run.** One issuer party, one holder party, ten test units on Canton DevNet. Integrations: Daml model + Attora UI + party IDs.  
2. **Auditor pass.** Add observer party; export status report. Integration: observer-authorized ledger query.  
3. **After pilot (not MVP).** Map `assetRef` to one real registrar or custodian system off-ledger.

---

## Repo

```
attora/
├── README.md
├── BRIEF.md                 # one-pager
├── PILOT.md                 # 2–3 steps
├── daml/
│   ├── daml.yaml
│   └── Attora/RwaUnit.daml
├── ui/                      # issuer / holder / observer
└── scripts/
    └── allocate-parties.sh
```

---

## Quick start

```bash
# participant + DevNet per HackCanton / Canton docs
cd daml && daml build && daml start   # or deploy to DevNet

cd ../ui && npm install && npm run dev
```

Demo path:

1. Login as **Issuer** → create unit → `Issue`  
2. Login as **Holder** → accept transfer or `Fulfill`  
3. Login as **Observer** → open audit report  

Judges should see four states and three roles, not a trading chart.

---

## What this is not

- Not Bitget Alpha Factory  
- Not an after-hours rToken strategy  
- Not Attestcoin / Creditcoin  
- Not public-chain confidential-order theater  

Attora on this repo is only: **Daml RWA life-cycle on Canton, with issuer, holder, and observer.**

---

## License

MIT
