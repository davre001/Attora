import { ethers } from 'ethers';
import { chainInfo, proofProvider } from '@gluwa/usc-sdk';
import { config } from '../config';
import { getOpenJobs, markAttested, markReady, markError, type ProofJob } from '../db';

const cc3Provider = new ethers.JsonRpcProvider(config.attestcoin.cc3RpcUrl);

export const chainInfoProvider = new chainInfo.PrecompileChainInfoProvider(
  cc3Provider,
  config.attestcoin.chainInfoPrecompileAddress,
);

export const proofBuilder = new proofProvider.service.ProofBuilder(
  config.attestcoin.chainKey,
  config.attestcoin.proofBuilderUrl,
);

const POLL_INTERVAL_MS = 15_000;

async function isHeightAttested(blockNumber: number): Promise<boolean> {
  const latest = await chainInfoProvider.getLatestAttestedHeightAndHash(config.attestcoin.chainKey);
  return latest.exists && latest.height >= blockNumber;
}

/**
 * pending: check attestation via the ChainInfo precompile (cheap, shared across all open jobs
 * per tick) rather than ProofBuilder.waitUntilHeightAttested, which blocks per-job for up to
 * 15 minutes and doesn't fit a loop advancing many jobs at once.
 *
 * attested or pending-just-flipped: fetch proof bytes via the ProofBuilder service.
 */
async function advanceJob(job: ProofJob): Promise<void> {
  try {
    if (job.status === 'pending') {
      const attested = await isHeightAttested(job.sourceBlockNumber);
      if (!attested) return;
      markAttested(job.loanId);
      console.log(`[proof] loanId=${job.loanId} attested at/after block ${job.sourceBlockNumber}`);
    }

    const result = await proofBuilder.getProof(job.sourceTxHash);
    if (!result.success || !result.data) {
      markError(job.loanId, result.error ?? 'proof builder returned no data');
      console.error(`[proof] loanId=${job.loanId} proof fetch failed: ${result.error}`);
      return;
    }

    const { headerNumber, txIndex, txBytes, continuityProof, merkleProof } = result.data;
    markReady(job.loanId, {
      headerNumber,
      txIndex,
      txBytes,
      continuityProof: JSON.stringify(continuityProof),
      merkleProof: JSON.stringify(merkleProof),
    });
    console.log(`[proof] loanId=${job.loanId} ready (header ${headerNumber}, txIndex ${txIndex})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markError(job.loanId, message);
    console.error(`[proof] loanId=${job.loanId} error: ${message}`);
  }
}

let timer: ReturnType<typeof setInterval> | undefined;
let ticking = false;

async function tick(): Promise<void> {
  if (ticking) return; // don't overlap if a previous tick is still in flight
  ticking = true;
  try {
    const jobs = getOpenJobs();
    await Promise.all(jobs.map(advanceJob));
  } finally {
    ticking = false;
  }
}

export function startProofPipeline(): void {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch((err) => console.error('[proof] tick failed', err));
  }, POLL_INTERVAL_MS);
  tick().catch((err) => console.error('[proof] initial tick failed', err));
}

export function stopProofPipeline(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
