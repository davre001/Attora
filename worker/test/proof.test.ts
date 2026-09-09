import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chainInfoProvider, proofBuilder, tick } from '../src/proof';
import { getJobByLoanId, insertPendingJob, markAttested } from '../src/db';

let counter = 0;
function nextLoanId(): string {
  counter += 1;
  return '0x' + counter.toString(16).padStart(64, '0');
}

const BASE_JOB = {
  borrower: '0xAbCdEf0000000000000000000000000000000001',
  commitment: '0x' + '22'.repeat(32),
  tier: 2,
  chainKey: 1,
};

function attestedHeight(height: number, exists = true) {
  return { height, hash: '0x' + '00'.repeat(32), isAttestation: true, exists };
}

function proofSuccess(overrides: Partial<{ headerNumber: number; txIndex: number; txBytes: string }> = {}) {
  return {
    success: true,
    data: {
      chainKey: 1,
      headerNumber: overrides.headerNumber ?? 100,
      txIndex: overrides.txIndex ?? 0,
      txHash: '0x' + '11'.repeat(32),
      txBytes: overrides.txBytes ?? '0xdeadbeef',
      continuityProof: { lowerEndpointDigest: '0x00', roots: ['0x01'] },
      merkleProof: { root: '0x00', siblings: [] },
      cached: false,
      generatedAt: new Date(),
    },
  };
}

let getLatestSpy: ReturnType<typeof vi.spyOn>;
let getProofSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getLatestSpy = vi.spyOn(chainInfoProvider, 'getLatestAttestedHeightAndHash');
  getProofSpy = vi.spyOn(proofBuilder, 'getProof');
});

afterEach(() => {
  getLatestSpy.mockRestore();
  getProofSpy.mockRestore();
});

describe('proof pipeline tick()', () => {
  it('leaves a pending job untouched when its block is not yet attested', async () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash: '0xaaa', sourceBlockNumber: 100 });
    getLatestSpy.mockResolvedValue(attestedHeight(50)); // 50 < 100

    await tick();

    expect(getJobByLoanId(loanId)!.status).toBe('pending');
    expect(getProofSpy).not.toHaveBeenCalled();
  });

  it('advances pending -> ready in one tick once attested and proof succeeds', async () => {
    const loanId = nextLoanId();
    const sourceTxHash = '0x' + 'bb'.repeat(32);
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash, sourceBlockNumber: 100 });
    getLatestSpy.mockResolvedValue(attestedHeight(100));
    getProofSpy.mockResolvedValue(proofSuccess({ headerNumber: 777, txIndex: 2 }));

    await tick();

    expect(getProofSpy).toHaveBeenCalledWith(sourceTxHash);
    const job = getJobByLoanId(loanId)!;
    expect(job.status).toBe('ready');
    expect(job.headerNumber).toBe(777);
    expect(job.txIndex).toBe(2);
    expect(job.txBytes).toBe('0xdeadbeef');
    expect(JSON.parse(job.continuityProof!)).toEqual({ lowerEndpointDigest: '0x00', roots: ['0x01'] });
    expect(JSON.parse(job.merkleProof!)).toEqual({ root: '0x00', siblings: [] });
  });

  it('marks a job error when the proof builder reports failure', async () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash: '0xccc', sourceBlockNumber: 100 });
    getLatestSpy.mockResolvedValue(attestedHeight(100));
    getProofSpy.mockResolvedValue({ success: false, error: 'height not indexed yet' });

    await tick();

    const job = getJobByLoanId(loanId)!;
    expect(job.status).toBe('error');
    expect(job.errorMessage).toBe('height not indexed yet');
  });

  it('marks a job error if the attestation check throws', async () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash: '0xddd', sourceBlockNumber: 100 });
    getLatestSpy.mockRejectedValue(new Error('connect ECONNREFUSED'));

    await tick();

    const job = getJobByLoanId(loanId)!;
    expect(job.status).toBe('error');
    expect(job.errorMessage).toBe('connect ECONNREFUSED');
    expect(getProofSpy).not.toHaveBeenCalled();
  });

  it('marks a job error if the proof builder call throws', async () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash: '0xeee', sourceBlockNumber: 100 });
    getLatestSpy.mockResolvedValue(attestedHeight(100));
    getProofSpy.mockRejectedValue(new Error('timeout'));

    await tick();

    expect(getJobByLoanId(loanId)!.status).toBe('error');
  });

  it('skips the attestation check for an already-attested job', async () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, sourceTxHash: '0xfff', sourceBlockNumber: 100 });
    markAttested(loanId);
    getProofSpy.mockResolvedValue(proofSuccess());

    await tick();

    expect(getLatestSpy).not.toHaveBeenCalled();
    expect(getJobByLoanId(loanId)!.status).toBe('ready');
  });

  it('advances multiple open jobs independently in one tick', async () => {
    const notYetAttested = nextLoanId();
    const readyJob = nextLoanId();
    const failingJob = nextLoanId();

    insertPendingJob({ loanId: notYetAttested, ...BASE_JOB, sourceTxHash: '0x01', sourceBlockNumber: 500 });
    insertPendingJob({ loanId: readyJob, ...BASE_JOB, sourceTxHash: '0x02', sourceBlockNumber: 100 });
    insertPendingJob({ loanId: failingJob, ...BASE_JOB, sourceTxHash: '0x03', sourceBlockNumber: 100 });

    getLatestSpy.mockResolvedValue(attestedHeight(100)); // covers 100, not 500
    getProofSpy.mockImplementation(async (txHash: string) => {
      if (txHash === '0x02') return proofSuccess();
      return { success: false, error: 'no proof for ' + txHash };
    });

    await tick();

    expect(getJobByLoanId(notYetAttested)!.status).toBe('pending');
    expect(getJobByLoanId(readyJob)!.status).toBe('ready');
    expect(getJobByLoanId(failingJob)!.status).toBe('error');
  });
});
