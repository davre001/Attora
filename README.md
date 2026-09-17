# Attora Seal

**Trade Bitget rTokens when US cash stocks are closed. Publish the rule. Seal the size.**

Attora Seal is a quantitative strategy for **Bitget AI Hackathon S2 — Alpha Factory**.

It trades **tokenized US stocks (rTokens) on Bitget** in the window when NYSE and Nasdaq are shut. The signal is public and reproducible. Live working size is split into small clips so a thin after-hours book cannot read the full order.

Track: **Alpha Factory** (Quantitative Strategies)  
Sub-theme: **After-Hours Information Pricing**  
Handbook: https://bitget-ai.gitbook.io/bitgetai_hackathons2  
Deadline: **21 September 2026, 23:59 UTC+8**

---

## What Attora Seal is

Attora Seal is not a wallet, not a lending protocol, and not a trading chatbot.

It is two layers on one book:

1. **Attora** — a rules-based after-hours signal: rToken vs last official cash close.  
2. **Seal** — the parent order is never sent as one print. It is clipped and jittered on Bitget.

AI (Qwen / Cursor) may write code and search parameters. It does **not** decide fills. The saved config is what you backtest and what judges replay.

If the instrument is not a Bitget rToken, it is not this project.

---

## Problem

Cash US equities stop. Bitget rTokens do not.

Nights, weekends, and holidays still produce news: earnings after the bell, FOMC, CPI, geopolitics. The rToken can reprice immediately. The cash stock only moves at the next open.

Most strategies either:

- wait for the cash open and miss the rToken move, or  
- dump full size into a thin extended-hours book.

The second failure is the confidentiality problem. In a quiet rToken book, one large print tells the market **who is leaning and how hard**. It also burns the spread through slippage. You do not need a private chain to care about that. You need **quiet execution**.

---

## Solution

**Same signal. Sealed size.**

### Signal (Attora)

At the US regular-hours close, store the official close of the underlying stock.

While cash is shut, read the Bitget rToken price:

```
spread = rToken / cash_close - 1
```

If `|spread|` clears the entry threshold and the session is after-hours or weekend:

- Scheduled event window (FOMC, CPI, named earnings) → trade **with** the move.  
- No event → **fade** the spike (empty-book overreaction).

Exit at next cash open, when the spread mean-reverts, or at a hard stop.

One name. No add-ons in the same window. Hard notional cap, expressed as a **tier**, not a public dollar ticket.

### Execution (Seal)

1. Parent size comes from the signal and the tier cap.  
2. Parent is split into clips (for example 10–20% each).  
3. Clips go to Bitget with short random delays.  
4. Clipping stops if the spread is gone, the stop is hit, or cash is about to open.  
5. PnL and Sharpe are scored on the **parent**, not on each child.

**Hidden in live/paper logs:** residual size, clip count, jitter salt.  
**Public for judges:** rules, costs, parent equity curve, backtest metrics.

That is confidentiality here: **the after-hours book does not see full size.** It is not Attestcoin and not a confidential vault.

---

## How Bitget is integrated

Bitget is the market and the backtest host.

| Piece | Use |
|---|---|
| Bitget rToken | Only tradable instrument |
| Bitget price / last / mid | `spread` vs cash close |
| Bitget orders | Child clips (paper or live) |
| Bitget Playbook | Official Alpha Factory backtest path — parent rules, PnL, max DD, Sharpe |
| Bitget account | Optional paper/live execution of the same clips |

```
US cash close (anchor)
        ↓
Bitget rToken price (cash shut)
        ↓
Attora rules → parent side + tier
        ↓
Seal splitter → N clips + jitter
        ↓
Bitget Playbook fill model  and/or  Bitget orders
        ↓
parent report (Sharpe, Sortino, DD, turnover)
```

Run two Playbook (or local) backtests on the **same signal**:

- one-shot parent  
- clipped parent with extra spread / impact  

Seal is doing its job if clipped results stay inside your impact budget.

No Creditcoin. No Attestcoin. No CC3 mocks.

---

## Repo

```
attora-seal/
├── README.md
├── attora/
│   ├── data.py          # rToken series + US cash calendar / close
│   ├── signal.py        # spread, event flag, parent side
│   ├── seal.py          # clip, jitter, cancel remaining
│   ├── backtest.py      # parent fills, costs, metrics
│   └── params.py
├── configs/
│   └── default.yaml
├── reports/
│   ├── backtest_summary.md
│   └── equity_curve.csv
└── scripts/
    └── run_backtest.py
```

---

## Quick start

```bash
git clone <this-repo>
cd attora-seal
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python scripts/run_backtest.py --config configs/default.yaml
```

Backtest must cover **at least 60 days** total and **at least 30 days out of sample**. Use fees and slippage that match a thin rToken book. Do not assume mid-touch fills with zero cost.

Prefer Bitget Playbook for the official validation export, then copy headline metrics into `reports/backtest_summary.md`.

---

## Metrics to publish

- Period PnL  
- Sharpe, Sortino  
- Max drawdown  
- Turnover  
- IS Sharpe vs OOS Sharpe  
- Rolling 30-day Sharpe  
- One-shot vs clipped cost gap  

Judges watch OOS decay (warning if OOS Sharpe &lt; 0.5× IS). Label paper trading separately from backtest.

---

## Target user

A trader who already uses Bitget rTokens and needs a **closed-market rule** that does not dump full size into the night book.

Not “all traders.” Not a research chatbot.

---

## Role of the LLM

- Used to scaffold `signal.py` / `seal.py` and to search parameters.  
- Not used inside `backtest.py` to pick side or size.  
- Name the model you actually used (Qwen if you have credits; otherwise what ran).  

---

## Submission checklist (Alpha Factory)

- [ ] Form track: **Alpha Factory** · sub-theme: **After-Hours Information Pricing**  
- [ ] Project Description: this alpha, this user, these metrics  
- [ ] Public GitHub with this README  
- [ ] Runnable `scripts/run_backtest.py`  
- [ ] Backtest ≥ 60 days, OOS ≥ 30 days  
- [ ] LLM role field filled  
- [ ] X post with `#BitgetHackathon` and `@Bitget_AI` (not a bare retweet)  
- [ ] Links in **Submission Materials Link**, one per line, labeled  

Form: https://forms.gle/GyWZCMCPocgJdJon6  
Landing: https://www.bitget.com/activity-hub/hackathon

---

## What this is not

- Not a confidential RWA loan  
- Not Attestcoin / Creditcoin  
- Not Agentic Trading (the LLM is not the decision-maker)  
- Not an AI research desk  

Those were a different hackathon. Attora Seal is only: **Bitget rToken, cash closed, sealed clips, replayable parent backtest.**

---

## License

MIT

Backtest and paper trading only unless you send clips on Bitget with your own account and risk. Not financial advice.
