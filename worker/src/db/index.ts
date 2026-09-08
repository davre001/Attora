import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';

/**
 * pending   — CollateralCommitted seen on Sepolia, waiting on Attestcoin to attest the block height
 * attested  — height attested; fetching the Merkle/continuity proof
 * ready     — proof bytes stored; usable for openLoan on CC3
 * error     — see errorMessage
 */
export type ProofStatus = 'pending' | 'attested' | 'ready' | 'error';

export interface ProofJob {
  loanId: string;
  borrower: string;
  commitment: string;
  tier: number;
  status: ProofStatus;
  sourceTxHash: string;
  sourceBlockNumber: number;
  chainKey: number;
  headerNumber: number | null;
  txIndex: number | null;
  txBytes: string | null;
  continuityProof: string | null;
  merkleProof: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ProofJobRow {
  loan_id: string;
  borrower: string;
  commitment: string;
  tier: number;
  status: ProofStatus;
  source_tx_hash: string;
  source_block_number: number;
  chain_key: number;
  header_number: number | null;
  tx_index: number | null;
  tx_bytes: string | null;
  continuity_proof: string | null;
  merkle_proof: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

fs.mkdirSync(path.dirname(config.db.path), { recursive: true });

export const db = new Database(config.db.path);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS proof_jobs (
    loan_id TEXT PRIMARY KEY,
    borrower TEXT NOT NULL,
    commitment TEXT NOT NULL,
    tier INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'attested', 'ready', 'error')),
    source_tx_hash TEXT NOT NULL,
    source_block_number INTEGER NOT NULL,
    chain_key INTEGER NOT NULL,
    header_number INTEGER,
    tx_index INTEGER,
    tx_bytes TEXT,
    continuity_proof TEXT,
    merkle_proof TEXT,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_proof_jobs_borrower ON proof_jobs(borrower);
`);

function rowToJob(row: ProofJobRow): ProofJob {
  return {
    loanId: row.loan_id,
    borrower: row.borrower,
    commitment: row.commitment,
    tier: row.tier,
    status: row.status,
    sourceTxHash: row.source_tx_hash,
    sourceBlockNumber: row.source_block_number,
    chainKey: row.chain_key,
    headerNumber: row.header_number,
    txIndex: row.tx_index,
    txBytes: row.tx_bytes,
    continuityProof: row.continuity_proof,
    merkleProof: row.merkle_proof,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const insertJobStmt = db.prepare(`
  INSERT OR IGNORE INTO proof_jobs (
    loan_id, borrower, commitment, tier, status,
    source_tx_hash, source_block_number, chain_key,
    created_at, updated_at
  ) VALUES (
    @loanId, @borrower, @commitment, @tier, 'pending',
    @sourceTxHash, @sourceBlockNumber, @chainKey,
    @now, @now
  )
`);

/** Idempotent: a loanId already on file (e.g. from log replay) is left untouched. */
export function insertPendingJob(job: {
  loanId: string;
  borrower: string;
  commitment: string;
  tier: number;
  sourceTxHash: string;
  sourceBlockNumber: number;
  chainKey: number;
}): void {
  insertJobStmt.run({ ...job, now: Date.now() });
}

const getByLoanIdStmt = db.prepare(`SELECT * FROM proof_jobs WHERE loan_id = ?`);

export function getJobByLoanId(loanId: string): ProofJob | undefined {
  const row = getByLoanIdStmt.get(loanId) as ProofJobRow | undefined;
  return row ? rowToJob(row) : undefined;
}

const getByBorrowerStmt = db.prepare(
  `SELECT * FROM proof_jobs WHERE borrower = ? COLLATE NOCASE ORDER BY created_at DESC`,
);

export function getJobsByBorrower(borrower: string): ProofJob[] {
  const rows = getByBorrowerStmt.all(borrower) as ProofJobRow[];
  return rows.map(rowToJob);
}

const getOpenJobsStmt = db.prepare(
  `SELECT * FROM proof_jobs WHERE status IN ('pending', 'attested') ORDER BY created_at ASC`,
);

/** Jobs the proof pipeline still needs to advance (not yet ready or errored). */
export function getOpenJobs(): ProofJob[] {
  const rows = getOpenJobsStmt.all() as ProofJobRow[];
  return rows.map(rowToJob);
}

const markAttestedStmt = db.prepare(
  `UPDATE proof_jobs SET status = 'attested', updated_at = @now WHERE loan_id = @loanId`,
);

export function markAttested(loanId: string): void {
  markAttestedStmt.run({ loanId, now: Date.now() });
}

const markReadyStmt = db.prepare(`
  UPDATE proof_jobs SET
    status = 'ready',
    header_number = @headerNumber,
    tx_index = @txIndex,
    tx_bytes = @txBytes,
    continuity_proof = @continuityProof,
    merkle_proof = @merkleProof,
    updated_at = @now
  WHERE loan_id = @loanId
`);

export function markReady(
  loanId: string,
  proof: {
    headerNumber: number;
    txIndex: number;
    txBytes: string;
    continuityProof: string;
    merkleProof: string;
  },
): void {
  markReadyStmt.run({ loanId, ...proof, now: Date.now() });
}

const markErrorStmt = db.prepare(
  `UPDATE proof_jobs SET status = 'error', error_message = @errorMessage, updated_at = @now WHERE loan_id = @loanId`,
);

export function markError(loanId: string, errorMessage: string): void {
  markErrorStmt.run({ loanId, errorMessage, now: Date.now() });
}
