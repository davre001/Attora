#Tacet  — implementation

Canton / Daml RWA workflow.  
UI: three roles. Ledger: Daml choices.  
This file is structure + page jobs + backend contract. Visual tokens stay the existing ink desk unless you change them separately.

---

## File structure

```
attora/
├── README.md
├── BRIEF.md
├── PILOT.md
├── implementation.md
├── daml/
│   ├── daml.yaml
│   └── Attora/
│       ├── RwaUnit.daml          # full payload (issuer + holder)
│       └── RwaHeader.daml        # optional: id, status, ref for observer
├── ui/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── Desk.tsx
│       │   ├── Positions.tsx
│       │   ├── Audit.tsx
│       │   ├── Setup.tsx
│       │   └── Docs.tsx
│       ├── components/
│       │   ├── layout/Nav.tsx, Page.tsx, Footer.tsx
│       │   ├── desk/
│       │   │   ├── RoleSwitch.tsx
│       │   │   ├── CreatePanel.tsx
│       │   │   ├── StatusPanel.tsx
│       │   │   ├── TransferPanel.tsx
│       │   │   └── FulfillPanel.tsx
│       │   └── ui/Button.tsx, Card.tsx, Input.tsx, Badge.tsx
│       ├── lib/
│       │   ├── ledger.ts         # JSON API client
│       │   ├── parties.ts
│       │   └── types.ts
│       └── config/
│           └── canton.ts         # participant URL, party IDs
└── scripts/
    ├── allocate-parties.sh
    └── demo-flow.sh
```

No `Faucet.tsx`. No wagmi. No Bitget Playbook hooks.

---

## Pages and what they do

| Route | Page | Function |
|---|---|---|
| `/` | Home | One screen: workflow + three roles + why Canton. CTA → Desk. |
| `/app` | Desk | **The MVP.** Role switch + the four steps. |
| `/positions` | Positions | List units this party can see. Open one → status actions. |
| `/audit` | Audit | Observer report: create / status / transfer / fulfill events. |
| `/setup` | Setup | Connect participant, pick party (issuer / holder / observer). Not a token faucet. |
| `/docs` | Docs | Brief, pilot steps, template names, party map. |

Nav: **Desk · Positions · Audit · Setup · Docs**

### Home

Pitch only. No ledger calls required.

### Desk (`/app`)

Must demonstrate the required loop in one place:

1. **Create** — issuer fills asset ref + amount → `Create`  
2. **Status** — `Issue` / `Activate`  
3. **Transfer** — set new holder party → `Transfer` (or request + accept)  
4. **Fulfill** — holder → `Fulfill`  

`RoleSwitch` changes the active Canton party. Buttons that the party cannot exercise must be disabled (backend will reject anyway).

Issuer sees amount. Holder sees amount on units they hold. Observer on this page should **not** see amount if you use a header contract.

### Positions

Query contracts visible to the current party. Columns: id, asset ref, status, role-appropriate fields. Observer list = headers only.

### Audit

Observer (and issuer, if you allow) downloads or views:

- unit id  
- status transitions  
- timestamp  
- from-party / to-party  
- **no amount** unless the viewer is issuer or holder of that unit  

This page is the “audit or report” output.

### Setup

- Participant / Ledger API URL  
- Map: Issuer party, Holder party, Observer party  
- Health: “connected” / “wrong party”  

No mint. No ETH. No pvUSD.

### Docs

Static: ICP, who pays, why Canton, 2–3 pilot steps. Can render `BRIEF.md` / `PILOT.md`.

---

## Backend notes (follow this)

The UI is not the source of truth. **Daml is.**

### 1. One workflow, real choices

Implement at least:

`Create` → `Issue` (or `Activate`) → `Transfer` and/or `Fulfill`

Do not fake status in React state. If the participant is down, the desk shows an error.

### 2. Three parties, not three passwords

- `Issuer`, `Holder`, `Observer` are **Canton parties**.  
- Setup stores party IDs.  
- Every command is `actAs` that party.  
- Do not send issuer commands while the UI is on Observer.

### 3. Privacy

- Put `amount` and commercial terms on `RwaUnit` with signatories issuer (and holder after accept).  
- Observer is either:
  - observer on a **header** contract only (`RwaHeader`: id, status, assetRef, payloadHash), or  
  - not an observer on the amount contract.  
- Never return `amount` on Audit queries for the observer token.

### 4. API the UI should call

Keep `ui/src/lib/ledger.ts` as the only IO:

- `listUnits(party)`  
- `create(issuer, { assetRef, amount, holder, observer })`  
- `exercise(contractId, choice, party, args)`  
- `auditTrail(observer)` → header events only  

Talk to the **Ledger JSON API** (or the official SDK you are given in workshops). No custom “status database.”

### 5. Ids and status

- Contract id is the unit id in the UI.  
- Status is a field on the contract (`Draft | Issued | Active | Transferred | Fulfilled`), changed only by choices.  
- Transfer archives + creates (standard Daml) or uses an explicit `Accept`. Pick one and document it in `RwaUnit.daml`.

### 6. Deploy

- Target **Canton DevNet** (or the participant HackCanton tells you to use).  
- `scripts/allocate-parties.sh` creates the three demo parties.  
- `scripts/demo-flow.sh` runs create → issue → transfer → fulfill so judges can replay without the UI.

### 7. Out of scope for backend

Bitget orders, Playbook, Attestcoin proofs, ERC-20 mocks, faucets, clip sizing, Sharpe.

### 8. Demo script the backend must survive

1. Setup: three parties connected  
2. Issuer creates unit  
3. Issuer issues  
4. Holder sees it on Positions  
5. Holder transfers or fulfills  
6. Observer opens Audit and does **not** see amount  

If step 6 leaks `amount`, privacy is wrong even if the UI looks fine.

---

## Minimum ship

- `RwaUnit.daml` (+ header if you seal amount)  
- Desk + Positions + Audit + Setup  
- Three parties on DevNet  
- `BRIEF.md` + `PILOT.md`  

That matches the track output. Do not add pages until that loop works on the ledger.
