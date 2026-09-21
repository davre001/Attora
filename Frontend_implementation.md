#Tacet  — implementation

Canton / Daml RWA workflow.

UI: three roles. Ledger: Daml choices.

This file is structure + page jobs + backend contract. Visual tokens stay the existing ink desk unless you change them separately.

---

**## File structure**

```
tacet/

├── README.md

├── BRIEF.md

├── PILOT.md

├── implementation.md

├── daml/

│   ├── daml.yaml

│   └── Tacet/

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

│       │   ├── ledger.ts          # JSON API client

│       │   ├── parties.ts

│       │   └── types.ts

│       └── config/

│           └── canton.ts          # participant URL, party IDs

└── scripts/

    ├── allocate-parties.sh

    └── demo-flow.sh
```

No `Faucet.tsx`. No wagmi. No Bitget Playbook hooks.

---

**## Pages and what they do**

| Route        | Page      | Function                                                                          |
| ------------ | --------- | --------------------------------------------------------------------------------- |
| `/`          | Home      | One screen: workflow + three roles + why Canton. CTA → Desk.                      |
| `/app`       | Desk      | **The MVP.** Role switch + the four steps.                                        |
| `/positions` | Positions | List units this party can see. Open one → status actions.                         |
| `/audit`     | Audit     | Observer report: create / status / transfer / fulfill events.                     |
| `/setup`     | Setup     | Connect participant, pick party (issuer / holder / observer). Not a token faucet. |
| `/docs`      | Docs      | Brief, pilot steps, template names, party map.                                    |

Nav: **Desk · Positions · Audit · Setup · Docs**

**### Home**

Pitch only. No ledger calls required.

**### Desk (`/app`)**

Must demonstrate the required loop in one place:

1. **Create** — issuer fills asset ref + amount → `Create`
2. **Status** — `Issue` / `Activate`
3. **Transfer** — set new holder party → `Transfer` (or request + accept)
4. **Fulfill** — holde
