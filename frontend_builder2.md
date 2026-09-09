# Attora — frontend builder 2 handoff (UI continuation)

Where builder 1 stopped and what to build next. Read this together with
`Attora Frontend.md` (the original spec — color values there are OUTDATED, see
§3 below) and `docs/frontend-integration.md` (contracts/worker handoff —
separate workstream, not yours unless asked).

**Your scope: landing page only. Everything else must remain unchanged.**

---

## 1. The task

1. **Landing page hero title becomes "Textur"** — the design stays intact.
   Only the words change. Current hero lives in
   `frontend/src/components/ui/hero-color-panel.tsx`
   (`HeroColorPanelsRoot` defaults at ~line 214):
   - `srTitle = "Attora"` → `"Textur"` (screen-reader / document title context)
   - `title = "Hide the size."` / `subtitle = "Prove the lock. Borrow."` →
     headline becomes "Textur" — keep the same type scale, tracking, and
     two-line layout the component already renders.
   - Do NOT rename the app elsewhere. Nav wordmark, store, URLs, everything
     else keeps "Attora".
2. **Add a Features section** to the landing page (below the hero, above or
   integrated with the existing steps section).
3. **Add a "How it works" section** — a 3-step section already exists at the
   bottom of `frontend/src/views/Home.tsx` (`STEPS` array: Commit on Sepolia /
   Attestcoin verifies / Borrow by tier on CC3). Expand or restyle it into a
   proper named "How it works" section; keep the three steps' copy meaning.
4. **Add a real footer on the landing page** — a global minimal footer already
   renders everywhere (`frontend/src/components/layout/Footer.tsx`, mounted in
   `src/app/layout.tsx`). Build a full landing-page footer (links, wordmark,
   chain badges, testnet disclaimer) — either upgrade `Footer.tsx` for all
   pages or add a landing-specific footer inside `Home.tsx`; your call, but
   the app pages must not visually regress.
5. **Logo + favicon** — a favicon already exists at
   `frontend/src/app/icon.svg` (32×32, blue gradient). Design a real logo mark
   for "Textur" and replace it. `frontend/src/components/brand/Mark.tsx` is
   the in-app logo component; leave it alone unless asked — the favicon is
   the deliverable.

Everything else — app pages, nav, store, styling, routing — stays exactly as
it is. If a change requires touching shared files, keep the diff minimal.

---

## 2. Current state (what's done and verified)

All of this is built, Playwright-verified, and live on
**https://attora.vercel.app** (Vercel project `modesayoaa-8574s-projects/attora`,
CLI-deployed — not yet Git-linked, so deploys are `npx vercel deploy --prod`
from `frontend/`).

Pages (all in `frontend/src/views/`, re-exported by thin `src/app/<route>/page.tsx`):

| Route | View | Notes |
|---|---|---|
| `/` | `Home.tsx` | 21st.dev `hero-color-panel` hero + 3-step section. **YOURS** |
| `/portfolio` | `Portfolio.tsx` | featured balances (bold amounts), assets table, History link at right edge |
| `/app` | `Desk.tsx` | commit→prove→borrow flow, `WorkflowProgress` (0–100% bar, checkmarked greyed completed phases, forward-only) |
| `/positions` | `Positions.tsx` | loan cards, draw/repay |
| `/proofs` | `Proofs.tsx` | Attestcoin receipt explorer (terminal chrome) |
| `/faucet` | `Faucet.tsx` | mints log to History |
| `/history` | `History.tsx` | activity feed: mints **green** credit, loan opens **yellow** borrow, repays **red** debit, commits show "sealed" only |
| `/analytics` | `Analytics.tsx` | KPI tiles (up delta **green**, down delta **red**) + charts |
| `/docs` | `Docs.tsx` | protocol docs |

Shell behavior (recently finished — do not break):
- Nav: wordmark far-left, wallet chip far-right, Docs tab REMOVED from nav
  (Docs is a hero button on the landing page now). Nav tab text is
  `text-snow/80` (white, not mist).
- Wallet chip: small (`h-6`, `text-[10px]`, `rounded-[10px]`), opens a
  glassmorphism dropdown (blur 24px, matches `.glass-strong`) with Copy
  address / Log out + confirmation.
- Connect → redirected to `/portfolio`. Connected users can NEVER reach `/`
  (`Home.tsx` runs `router.replace("/portfolio")`; logo links to `/portfolio`
  when connected). Sign-out → `router.replace("/")` lands on the landing.
- Background: landing = animated shader (`shader-b3e94fd7.tsx`); every other
  page = **pure `#000000`** with two faint blue radial highlights
  (`GradientBackground.tsx`). No noise.

---

## 3. Design system (current, authoritative)

Tailwind **v3** (`tailwind.config.ts` + CSS tokens in `src/app/globals.css`
layer). 21st.dev pastes arrive as Tailwind v4 / shadcn — you MUST map them
onto these tokens manually.

| Token | Value | Role |
|---|---|---|
| `snow` | `#fafafa` | headings, numbers, primary text |
| `mist` | `#a1a1a1` | secondary text |
| `ink` / `ink-2` | `#171717` / `#0e0e0e` | legacy surfaces (glass bars still use `bg-ink/65`) |
| `mint` | `#91C5FF` | blue accent — Sepolia side, "good", success |
| `sand` | `#3A81F6` | blue accent — CC3 side |
| `danger` | `#FF6467` | red — errors, debits, down-deltas |
| `warn` | `#E8B84A` | amber — wrong network |
| `--proof` gradient | `135deg #91c5ff → #3a81f6` | primary buttons, progress bars, focus |
| green | Tailwind `text-green-400` | up-deltas, History credits (no custom token — use the default) |
| yellow | Tailwind `text-yellow-400` | History borrows |

Fonts: DM Sans (`font-display`/`font-body`) + Geist Mono (`font-mono`), via
next/font CSS variables. Radius scale: `card` 16px, `btn` 14px, `input` 12px.
Reusable CSS surfaces in globals.css: `.glass`, `.glass-strong`, `.card`,
`.card-hover`, `.btn-glass`, `.btn-proof`. Landing sections use
`<section className="container …">` with `mx-auto max-w-desk` (1080px) inner
wrappers.

**§9 privacy (hard rule):** the committed collateral amount is NEVER
rendered, stored, or derivable. UI shows commitment hash + tier only. Any
component you touch must keep this.

---

## 4. Tooling + gotchas

- `npx next dev` on `:3000`; it's the modified Next.js 16 — check
  `node_modules/next/dist/docs/` before using unfamiliar APIs. Views live in
  `src/views/`, app routes are one-line re-exports.
- **`npx tsc --noEmit` must run from `frontend/`** — from anywhere else it
  exits 1 with "This is not the tsc command you are looking for".
- Verification pattern that's been used all along: Playwright headed scripts
  in `C:\Users\USER\AppData\Local\Temp\attora-verify\` via
  `playwright-core` + system Chrome
  (`C:\Users\USER\AppData\Local\ms-playwright\chromium-1228\chrome-win64\chrome.exe`).
  See `verify-history.js` / `verify-signout-landing.js` for templates. Test
  gotchas: navigate via clicking Links (a `page.goto()` reload wipes the
  in-memory store), and wait ≥1.5s for session rehydration on reload.
- Git: repo root is `C:\Users\USER\OneDrive\Documents\Attora` (run git with
  `git -C <root>`; the shell starts in `frontend/`). Push rejections mean the
  teammate pushed contracts/worker work — rebase onto `origin/main`.
  Attribution requested: end commit messages with
  `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
