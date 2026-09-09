# Frontend integration handoff

What `contracts/` and `worker/` actually expose, for wiring real chain calls and
real worker polling in place of `frontend/`'s current mocks
(`frontend/src/lib/attora.ts`, `frontend/src/store/desk.tsx`). Written from the
real compiled ABIs and the worker's actual API code, not the README's earlier
(partly aspirational) description.

**Not resolved yet:** none of this is deployed to real Sepolia/CC3 testnet —
only ever run against local Anvil. `frontend/src/config/chains.ts`'s
`sourceVault`/`loanBook`/`mockRWA`/`mockStable` stay `null` until that happens.
Everything below is otherwise final — signatures and response shapes won't
change between now and a real deploy.

## ABIs

`docs/abis/*.json` — ABI-only (no bytecode; these are for calling already-deployed
contracts), extracted from the Foundry build output:

- `ConfidentialVault.json` — Sepolia, `contracts/source/src/ConfidentialVault.sol`
- `MockRWA.json` — Sepolia, `contracts/source/src/MockRWA.sol`
- `LoanBook.json` — CC3, `contracts/creditcoin/src/LoanBook.sol`
- `MockStable.json` — CC3, `contracts/creditcoin/src/MockStable.sol`

## Worker REST API

Base URL: wherever `worker/` ends up hosted (currently only ever run on
`localhost:PORT`, `PORT` from `worker/.env`). CORS is already enabled for any
origin.

### `GET /health` → `{ ok: true }`

### `GET /proofs/:loanId`

```jsonc
{
  "loanId": "0x...",
  "borrower": "0x...",
  "tier": 2,
  "tierCap": 500,                // fixed product constant, not on-chain state
  "status": "ready",             // "pending" | "attested" | "ready" | "error"
  "commitment": "0x...",
  "sourceTxHash": "0x...",
  "sourceBlockNumber": 12345,
  "chainKey": 1,
  "headerNumber": 12345,         // use THIS as openLoan's blockHeight, not sourceBlockNumber (see below)
  "txIndex": 0,
  "txBytes": "0x...",            // -> openLoan's encodedTransaction
  "continuityProof": { "lowerEndpointDigest": "0x...", "roots": ["0x...", ...] },
  "merkleProof": { "root": "0x...", "siblings": [{ "hash": "0x...", "isLeft": true }, ...] },
  "errorMessage": null,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

404 if `loanId` is unknown, 400 if it's not a `0x`-prefixed 32-byte hex string.

### `GET /positions/:address` → `{ "address": "0x...", "positions": [ <same shape as above>, ... ] }`

400 if `address` isn't a valid address; empty `positions` array if none, not 404.

**No `debt`.** Debt lives in `LoanBook`'s on-chain state, which the worker
doesn't track — read `LoanBook.loans(loanId)` directly for that (see below).

### Field-name mapping vs. the frontend's current mock types

`frontend/src/lib/attora.ts`'s `ProofJob` uses different names than the API
above — nobody's updated it since the frontend has never called the worker
(commit → prove → borrow is currently `setTimeout`-simulated end to end):

| Frontend `ProofJob` | Worker API field | Note |
|---|---|---|
| `sourceTx` | `sourceTxHash` | |
| `blockHeight` | `sourceBlockNumber` or `headerNumber` | see note below — they should be numerically equal, but `headerNumber` is the one to actually pass to `openLoan` |
| `encodedTx` | `txBytes` | |
| `merkle` (string) | `merkleProof` (object) | already parsed JSON, not a string to re-parse |
| `continuity` (string) | `continuityProof` (object) | same |
| `sealed` | — | not returned; always true by design (the vault never emits amount), safe to compute client-side rather than source from the API |
| — | `tier`, `tierCap`, `borrower`, `headerNumber`, `txIndex`, `errorMessage` | frontend's type doesn't have these at all yet |

## Contract calls

### `ConfidentialVault.commit(uint256 amount, bytes32 salt, bytes32 loanId)`

Sepolia. Requires an ERC20 `approve(vaultAddress, amount)` on `MockRWA` first
(same pattern the deploy script uses). Reverts `BelowMinimumTier` if
`amount < 100 ether`; `LoanIdAlreadyUsed` if `loanId` was already committed.

**Frontend's tier math doesn't match this contract — fix before wiring real
calls.** `amountToTier`/`TIERS` in `lib/attora.ts` currently use different
thresholds/caps than the real contract:

| Tier | Real threshold (`ConfidentialVault.tierFor`) | Real cap (`LoanBook`, matches README) | Frontend currently has |
|---|---|---|---|
| 1 | ≥ 100 units | 50 | threshold: none (default), cap: 2,500 |
| 2 | ≥ 1,000 units | 500 | threshold: ≥ 5,000, cap: 10,000 |
| 3 | ≥ 10,000 units | 5,000 | threshold: ≥ 25,000, cap: 50,000 |

### `LoanBook.openLoan(...)` → `bool`

```solidity
function openLoan(
    uint64 blockHeight,
    bytes calldata encodedTransaction,
    bytes32 merkleRoot,
    INativeQueryVerifier.MerkleProofEntry[] calldata siblings, // { bytes32 hash; bool isLeft }[]
    bytes32 lowerEndpointDigest,
    bytes32[] calldata continuityRoots
) external returns (bool)
```

CC3. Every argument comes from one `GET /proofs/:loanId` response — there is no
separate `loanId` or `chainKey` parameter; both are read out of the *decoded,
proven* log itself, not caller-supplied (so a proof can't be misattributed):

| `openLoan` argument | From the API response |
|---|---|
| `blockHeight` | `headerNumber` |
| `encodedTransaction` | `txBytes` |
| `merkleRoot` | `merkleProof.root` |
| `siblings` | `merkleProof.siblings` |
| `lowerEndpointDigest` | `continuityProof.lowerEndpointDigest` |
| `continuityRoots` | `continuityProof.roots` |

Must be called by the borrower's own wallet — `LoanBook` decodes the borrower
from the proven `CollateralCommitted` log and reverts `BorrowerMismatch` if
`msg.sender` doesn't match. It also reverts `LoanAlreadyOpen` if already open,
and the underlying `ASCBase.execute()` reverts `"Proof of inclusion
verification failed"` if the block-prover check itself fails.

### `LoanBook.draw(bytes32 loanId, uint256 amount)` / `repay(bytes32 loanId, uint256 amount)`

CC3, no proof needed. `draw` mints `MockStable` up to the loan's tier cap
(reverts `DrawExceedsCap` past it); `repay` burns it back down and requires an
ERC20 `approve(loanBookAddress, amount)` on `MockStable` first (reverts
`RepayExceedsDebt` if `amount > debt`). Both revert `NotBorrower` for anyone
else, `NoSuchLoan` if the loan isn't open.

### `LoanBook.loans(bytes32 loanId)` → `(address borrower, uint8 tier, uint256 debt, bool open)`

Read this directly for a position's live `debt` — the worker doesn't have it.

### `MockRWA.mint(address to, uint256 amount)` / `MockStable.mint(address to, uint256 amount)`

Unrestricted on both — for the faucet page.
