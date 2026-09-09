import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { config } from '../config';
import { getJobByLoanId, getJobsByBorrower, type ProofJob } from '../db';

// Max borrow per tier on CC3 (README tier table) — a fixed product rule, not
// on-chain state the worker reads. Debt itself lives in CC3's LoanBook, which
// this worker doesn't track yet; the frontend reads that directly.
const TIER_CAPS: Record<number, number> = {
  1: 50,
  2: 500,
  3: 5_000,
};

function serializeJob(job: ProofJob) {
  return {
    loanId: job.loanId,
    borrower: job.borrower,
    tier: job.tier,
    tierCap: TIER_CAPS[job.tier] ?? null,
    status: job.status,
    commitment: job.commitment,
    sourceTxHash: job.sourceTxHash,
    sourceBlockNumber: job.sourceBlockNumber,
    chainKey: job.chainKey,
    headerNumber: job.headerNumber,
    txIndex: job.txIndex,
    txBytes: job.txBytes,
    continuityProof: job.continuityProof ? JSON.parse(job.continuityProof) : null,
    merkleProof: job.merkleProof ? JSON.parse(job.merkleProof) : null,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function createApp() {
  const app = express();
  app.use(cors());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/proofs/:loanId', (req: Request, res: Response) => {
    const loanId = String(req.params.loanId).toLowerCase();
    if (!ethers.isHexString(loanId, 32)) {
      res.status(400).json({ error: 'loanId must be a 0x-prefixed 32-byte hex string' });
      return;
    }

    const job = getJobByLoanId(loanId);
    if (!job) {
      res.status(404).json({ error: 'not found' });
      return;
    }

    res.json(serializeJob(job));
  });

  app.get('/positions/:address', (req: Request, res: Response) => {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      res.status(400).json({ error: 'address must be a valid Ethereum address' });
      return;
    }

    const jobs = getJobsByBorrower(address);
    res.json({ address, positions: jobs.map(serializeJob) });
  });

  return app;
}

export function startApiServer() {
  const app = createApp();
  return app.listen(config.api.port, () => {
    console.log(`[api] listening on :${config.api.port}`);
  });
}
