/**
 * Attora domain model + mock helpers (frontend contract §1, §9).
 *
 * The raw collateral amount is entered locally, mapped to a *tier*, and then
 * discarded — it is never stored globally or shown after commit. Everything the
 * chain (and this UI) sees is a commitment hash + a tier. These generators fake
 * the on-chain artifacts for the mock-first build; they get swapped for real
 * viem reads/writes during the contracts milestone.
 */

export type ProofStatus = "idle" | "pending" | "attested" | "ready" | "error";

export interface Tier {
  /** 1 | 2 | 3 */
  level: number;
  label: string;
  /** Max draw allowed against this tier, in STABLE_UNIT. */
  cap: number;
}

export const TIERS: Tier[] = [
  { level: 1, label: "TIER 1", cap: 2_500 },
  { level: 2, label: "TIER 2", cap: 10_000 },
  { level: 3, label: "TIER 3", cap: 50_000 },
];

/**
 * Bucket a locally-entered amount into a tier. The cap is a function of the
 * tier, never the raw inventory — "cap is the tier, not the inventory".
 */
export function amountToTier(amount: number): Tier {
  if (amount >= 25_000) return TIERS[2];
  if (amount >= 5_000) return TIERS[1];
  return TIERS[0];
}

export interface Loan {
  loanId: string;
  tier: Tier;
  /** Drawn debt in STABLE_UNIT. */
  debt: number;
  /** Draw cap = tier.cap. */
  cap: number;
  status: "open" | "repaid";
}

export interface ProofJob {
  loanId: string;
  /** keccak-style commitment; never encodes the amount in the payload. */
  commitment: string;
  sourceTx: string;
  blockHeight: number;
  chainKey: number;
  status: ProofStatus;
  /** Populated once attested/ready. */
  encodedTx?: string;
  merkle?: string;
  continuity?: string;
  /** True when the proof payload carries no amount — badge it SEALED. */
  sealed: boolean;
  createdAt: number;
}

// ── mock artifact generators ──────────────────────────────────────────────

const HEX = "0123456789abcdef";

function randHex(bytes: number): string {
  let out = "0x";
  for (let i = 0; i < bytes * 2; i++) {
    out += HEX[Math.floor(Math.random() * 16)];
  }
  return out;
}

export const mockLoanId = () => randHex(32);
export const mockCommitment = () => randHex(32);
export const mockTxHash = () => randHex(32);
export const mockEncodedTx = () => randHex(120);
export const mockMerkle = () => randHex(160);
export const mockContinuity = () => randHex(96);

/** Sepolia block heights sit around 8.4M on this testnet. */
export const mockBlockHeight = () =>
  8_400_000 + Math.floor(Math.random() * 60_000);

// ── formatters ──────────────────────────────────────────────────────────

/** 0x84c1…91af — middle-truncate a hash/address for display. */
export function truncateMiddle(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** 10,000 → "10,000" (grouped, no decimals for whole test units). */
export function formatAmount(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
