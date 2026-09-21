#Tacet — backend implementation

Canton / Daml RWA workflow.
Ledger: Daml templates + choices. Backend = the participant, not a custom API server.
This file itemizes the setup and build work needed before the UI (see `Frontend_implementation.md`) has anything real to call.

---

## 1. Daml environment setup

- [x] Install the Daml SDK (`daml` assistant) matching the version HackCanton / Canton DevNet requires. Installed SDK 2.10.6 (Windows tarball, no GUI installer) to `%APPDATA%\daml`, on user `PATH`.
- [x] Scaffold the project: `daml/daml.yaml` + source root `daml/Attora/`.
- [x] Confirm `daml build` and a local sandbox participant work before touching DevNet. Validated via `daml build`, `daml test`, and a real `daml sandbox --port 6865` run.

## 2. Data model — `RwaUnit.daml`

- [x] Define the `RwaUnit` template. **Deviation from the original sketch:** signatory is `issuer` only, throughout — `holder` and `observer` are never signatories, only observers/controllers. This is the standard Daml "Iou-style" pattern and avoids needing the holder's up-front co-signature just to be assigned. Fields: `unitId`, `assetRef`, `amount`, `holder`, `status`.
- [x] Status field is an enum on the contract, not app state: `Draft | Issued | Active | Transferred | Fulfilled` (`Attora/Types.daml`).
- [x] Implement choices:
  - `Create` — implemented as `IssuerRole.CreateUnit` (a factory choice) rather than directly on `RwaUnit`, so it can atomically create the paired `RwaHeader` in the same transaction. See `Attora/Registry.daml`.
  - `Issue` / `Activate` — issuer, advances status.
  - `Transfer` — explicit **propose/accept**: `ProposeTransfer` (holder) creates a `TransferProposal`; `AcceptTransfer` (new holder) or `RejectTransfer` (new holder) resolves it. Nobody becomes holder without their own consent.
  - `Fulfill` — holder, terminal status (accepts `Active` or `Transferred`).
- [x] Enforce `actAs` on every choice via `controller` — verified: `daml test`'s `demoFlow` exercises each choice as the correct party only.

## 3. Privacy model — observer visibility

- [x] Chose option (a): a separate `RwaHeader` contract (`Attora/RwaHeader.daml`) that the observer is an observer on. It has **no `amount` field at all** — a type-level guarantee, not a runtime filter.
- [x] `amount` only ever lives on `RwaUnit`, whose observer is `holder` only — `observer` is never added to it.
- [x] Verified in `demoFlow` (`daml/Attora/Setup.daml`): after the full lifecycle, `query @RwaUnit observer` returns zero contracts, and the observer's one `RwaHeader` shows `status == Fulfilled`.
- **Design note:** `RwaHeader` is intentionally decoupled from `RwaUnit`'s own choices. A holder/new-holder is never a stakeholder of the header, and Daml requires the *submitter* of a `fetchByKey` to be a maintainer of that key — so a holder-controlled choice cannot re-sync the header itself. Every status change on `RwaUnit` must be followed by an issuer-submitted `RwaHeader.SyncStatus` call. In production this second call is what an issuer-side **Daml Trigger** (a small automation service watching the ledger) would submit automatically — this is the one place a "backend service" still exists even in the Daml world, just for read-model projection, not business logic.

## 4. Party allocation

- [x] `scripts/allocate-parties.sh` allocates `Issuer`, `Holder`, `Observer` and creates the issuer's `IssuerRole` — tested against a live `daml sandbox`.
- [ ] Party ID hand-off format to the UI's `Setup` page / `config/canton.ts` still needs deciding (file, env vars, or manual paste) — not yet implemented.

## 5. Ledger API surface

- [ ] Ledger **JSON API** not yet stood up/tested — everything so far talks to the sandbox over the gRPC Ledger API via `daml script`. Needs `daml json-api` (or the HackCanton-provided SDK) running and smoke-tested before the UI can call it.
- [x] The four operations the UI's `lib/ledger.ts` needs map cleanly onto the model:
  - `listUnits(party)` → query `RwaUnit`/`RwaHeader` visible to `party`.
  - `create(issuer, {...})` → `exercise(issuerRoleCid, "CreateUnit", issuer, {...})`.
  - `exercise(contractId, choice, party, args)` → direct ledger exercise, generic across all choices above.
  - `auditTrail(observer)` → query `RwaHeader` as `observer`.
- [ ] Explicit "wrong party gets rejected" test not yet written (only the happy path is covered by `demoFlow`) — worth adding once the JSON API is up.

## 6. Deployment target

- [ ] Canton DevNet participant not yet stood up — only validated against a local `daml sandbox`.
- [ ] Record the DevNet participant / Ledger API URL for the UI's `Setup` page once available.
- [x] Local sandbox validated end-to-end (`daml build`, `daml test`, and both shell scripts against a running `daml sandbox --port 6865`).

## 7. Demo / verification scripts

- [x] `scripts/allocate-parties.sh` — creates the three demo parties + `IssuerRole`. Requires `--upload-dar yes` (not automatic for `--script-name` runs, only for `--all`).
- [x] `scripts/demo-flow.sh` — runs `create → issue → activate → transfer → fulfill` end-to-end, using its own `Demo*`-hinted parties so it can run on a participant that already has `allocate-parties.sh`'s parties without colliding.
- [x] Ran both against a live sandbox — full lifecycle completes on-ledger; also covered by `daml test` (`Attora.Setup:setup`, `Attora.Setup:demoFlow`).

## 8. Privacy acceptance check (must pass before ship)

- [x] Issuer creates a unit → sees `amount` (on `RwaUnit`, of which they're signatory).
- [x] Issuer issues and activates it.
- [x] Holder proposes a transfer; new holder accepts it (consent-based, not a rubber stamp).
- [x] New holder fulfills it.
- [x] Observer's `query @RwaUnit` returns **nothing**, and their `RwaHeader` shows the completed status — proven programmatically by `demoFlow`, not yet through the real UI (UI doesn't exist yet).

All five are asserted directly in `Attora.Setup:demoFlow` and pass under `daml test`.

## Out of scope for backend

Bitget orders, Playbook, Attestcoin proofs, ERC-20 mocks, faucets, clip sizing, Sharpe — none of that belongs in this Daml model.

## Minimum ship

- [x] `RwaUnit.daml` + `RwaHeader.daml` + `Registry.daml` + `Types.daml` + `Setup.daml`
- [x] `scripts/allocate-parties.sh` + `scripts/demo-flow.sh`, both verified against a local sandbox
- [ ] Three parties allocated on **DevNet** (only local sandbox so far)
- [ ] Ledger JSON API reachable and serving the four operations the UI needs
