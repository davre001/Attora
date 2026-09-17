# Attora Seal — frontend implementation

Same UI system as before. New product: Bitget after-hours rToken desk with sealed size.  
**No faucet. No mock tokens. No Sepolia / CC3.**

---

## Visual system (unchanged)

| Token | Hex |
|---|---|
| `ink` | `#07080A` |
| `ink-2` | `#0E1014` |
| `ink-3` | `#14181F` |
| `line` | `#1C2129` |
| `mist` | `#8B93A1` |
| `snow` | `#F4F6F8` |
| `sealed` | `#A78BFA` |
| `proof-from` | `#12E6A5` |
| `proof-to` | `#3B82F6` |
| `warn` | `#E8B84A` |
| `danger` | `#F07167` |

```css
--proof: linear-gradient(135deg, #12E6A5 0%, #3B82F6 100%);
```

**Type:** Instrument Sans 500/600 (titles, numbers) · IBM Plex Sans 400/500 (UI) · IBM Plex Mono 13px (ids, symbols, clips).

**Shape:** page `1080px` · nav `64px` · cards `20px` / `28px` pad · buttons `48px` / `14px` · inputs `12px`.  
**Motion:** `180ms ease-out`.  
**Mark:** 20×20 `--proof` square, white **A**. Wordmark **Attora**.

`--proof` only on: primary CTA, stepper, mark, `READY` dot.

---

## Routes

| Route | Page | Role |
|---|---|---|
| `/` | Home | Pitch |
| `/app` | Desk | Signal → Seal → Send |
| `/positions` | Positions | Parent trades |
| `/journal` | Journal | Clip tape |
| `/setup` | Setup | Account + Playbook + data |
| `/docs` | Docs | Rules + Bitget map |

Nav: **Desk · Positions · Journal · Setup · Docs · Connect**

There is **no** `/faucet` and **no** mint tiles.

---

## Pages

### `/` Home

**H1:** Hide the size. Trade the close.  
**Sub:** Bitget rTokens move when cash stocks are shut. Attora Seal takes the spread and clips the order so the night book cannot see full size.

**Open the desk** (`btn-proof`) · **See the tape** (ghost)

Tiles: Read rToken vs cash close · Parent + sealed tier · Clips on Bitget  

Footer: Backtest / paper. Not financial advice.

### `/app` Desk

Stepper: **01 Signal** · **02 Seal** · **03 Send**

**Signal**  
- Bitget rToken symbol  
- Official cash close (read-only)  
- `spread` in Instrument Sans  
- Chips: `CASH SHUT` · `EVENT` or `FADE`  
- CTA: **Arm parent**  
- After arm: parent id + **tier** only — no `$` size

**Seal**  
- `Computing clips` → `READY`  
- Clip **count** only  
- `SealedChip`: `SIZE HIDDEN`  
- Line: The book sees clips. It does not see the parent.

**Send**  
- Mode: Playbook model / paper / live  
- CTA: **Send clips to Bitget**  
- Progress: `3 / 12 filled`  
- Failures in `danger`

Right rail: symbol, session, tier, parent status, masked Bitget UID.

Venue banner (old network banner): gold, “Connect Bitget or pick an rToken.”

### `/positions`

symbol · side · tier · parent PnL · status · Flatten  
No parent notional.  
Empty: No parent in this window.

### `/journal`

Terminal card.  
Child rows: time · symbol · clip # · status · order id  
Parent row: id + `SEALED` + tier  
Plex Mono, copy on click.

### `/setup`

Not a faucet.

| Tile | Action |
|---|---|
| Bitget | Open / connect account |
| Playbook | Open Bitget Playbook |
| History | Load rToken + cash-close series |
| Paper | Link paper account if you use one |

Sub: Playbook, account, and history. No test tokens.  
Ghost: **Back to desk**

If you only submit a backtest, Paper can read “Optional.”

### `/docs`

1. Problem — night book leaks size  
2. Flow — spread → parent → clips → Bitget  
3. Hidden vs public  
4. Bitget: rToken, price, orders, Playbook  

---

## File tree

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── public/mark.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── pages/
    │   ├── Home.tsx
    │   ├── Desk.tsx
    │   ├── Positions.tsx
    │   ├── Journal.tsx
    │   ├── Setup.tsx
    │   └── Docs.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Nav.tsx
    │   │   ├── Footer.tsx
    │   │   └── Page.tsx
    │   ├── brand/Mark.tsx
    │   ├── desk/
    │   │   ├── Stepper.tsx
    │   │   ├── SignalPanel.tsx
    │   │   ├── SealPanel.tsx
    │   │   ├── SendPanel.tsx
    │   │   └── VenueBanner.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       ├── Input.tsx
    │       ├── Badge.tsx
    │       ├── Hash.tsx
    │       └── SealedChip.tsx
    ├── hooks/
    │   ├── useSignal.ts
    │   ├── useSeal.ts
    │   ├── useBitgetSend.ts
    │   └── usePlaybook.ts
    ├── config/
    │   ├── bitget.ts
    │   └── app.ts
    └── lib/
        ├── format.ts
        ├── spread.ts
        └── parentId.ts
```

Do not ship `Faucet.tsx`, `useMintMocks.ts`, chain ABIs, or wagmi dual-EVM config.

---

## CSS tokens

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
```

`.btn-proof` · `.card` · `.hash` · `.chip-sealed` unchanged.

---

## Copy sheet

| Surface | Text |
|---|---|
| Home H1 | Hide the size. Trade the close. |
| Signal | Cash is shut. Spread is vs last official close. |
| Seal | Parent size never hits the book as one print. |
| Send | Clips go to Bitget. Score the parent. |
| Positions empty | No parent in this window. |
| Journal | Clip tape. Sealed parents. |
| Setup | Playbook, account, and history. No test tokens. |

---

## Show / hide

**Show:** symbol, session, spread bps, side, tier, clip count, parent PnL, Playbook state, order ids.  
**Never show:** parent `$` size, residual USD, jitter salt, faucet balances.

---

## Demo path

1. Setup → Bitget + Playbook + history  
2. Desk → `CASH SHUT` → Arm parent  
3. Seal → `READY` + clip count  
4. Send clips  
5. Positions = tier + parent PnL  
6. Journal = child tape, parent sealed  

Valid Alpha Factory submit still only needs **code + 60/30 backtest + X post**. This UI is the demo shell around that strategy.
