import { describe, expect, it } from 'vitest';
import {
  getJobByLoanId,
  getJobsByBorrower,
  getOpenJobs,
  insertPendingJob,
  markAttested,
  markError,
  markReady,
} from '../src/db';

let counter = 0;
/** A fresh, collision-free loanId per call — tests share one in-memory db per file. */
function nextLoanId(): string {
  counter += 1;
  return '0x' + counter.toString(16).padStart(64, '0');
}

const BASE_JOB = {
  borrower: '0xAbCdEf0000000000000000000000000000000001',
  commitment: '0x' + '22'.repeat(32),
  tier: 2,
  sourceTxHash: '0x' + '33'.repeat(32),
  sourceBlockNumber: 42,
  chainKey: 1,
};

describe('db', () => {
  it('inserts a pending job and reads it back', () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB });

    const job = getJobByLoanId(loanId);
    expect(job).toMatchObject({
      loanId,
      status: 'pending',
      headerNumber: null,
      txBytes: null,
      errorMessage: null,
      ...BASE_JOB,
    });
    expect(job!.createdAt).toBe(job!.updatedAt);
  });

  it('returns undefined for an unknown loanId', () => {
    expect(getJobByLoanId(nextLoanId())).toBeUndefined();
  });

  it('is idempotent on re-insert with a different payload', () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, tier: 2 });
    markReady(loanId, {
      headerNumber: 100,
      txIndex: 0,
      txBytes: '0xdeadbeef',
      continuityProof: '{}',
      merkleProof: '{}',
    });

    // A second insert for the same loanId (e.g. a replayed backfill log) must
    // not clobber the job that's already progressed past 'pending'.
    insertPendingJob({ loanId, ...BASE_JOB, tier: 3, commitment: '0x' + '99'.repeat(32) });

    const job = getJobByLoanId(loanId);
    expect(job!.status).toBe('ready');
    expect(job!.tier).toBe(2);
  });

  it('looks up jobs by borrower case-insensitively', () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB, borrower: '0xAbCdEf0000000000000000000000000000000001' });

    const byLower = getJobsByBorrower('0xabcdef0000000000000000000000000000000001');
    expect(byLower.map((j) => j.loanId)).toContain(loanId);
  });

  it('getOpenJobs includes pending and attested but not ready or error', () => {
    const pending = nextLoanId();
    const attested = nextLoanId();
    const ready = nextLoanId();
    const errored = nextLoanId();

    insertPendingJob({ loanId: pending, ...BASE_JOB });
    insertPendingJob({ loanId: attested, ...BASE_JOB });
    markAttested(attested);
    insertPendingJob({ loanId: ready, ...BASE_JOB });
    markReady(ready, {
      headerNumber: 1,
      txIndex: 0,
      txBytes: '0x',
      continuityProof: '{}',
      merkleProof: '{}',
    });
    insertPendingJob({ loanId: errored, ...BASE_JOB });
    markError(errored, 'boom');

    const openIds = getOpenJobs().map((j) => j.loanId);
    expect(openIds).toContain(pending);
    expect(openIds).toContain(attested);
    expect(openIds).not.toContain(ready);
    expect(openIds).not.toContain(errored);
  });

  it('markReady stores the full proof payload and flips status', () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB });
    markAttested(loanId);

    markReady(loanId, {
      headerNumber: 555,
      txIndex: 3,
      txBytes: '0xdeadbeef',
      continuityProof: JSON.stringify({ roots: ['0x01'] }),
      merkleProof: JSON.stringify({ root: '0x00' }),
    });

    const job = getJobByLoanId(loanId)!;
    expect(job.status).toBe('ready');
    expect(job.headerNumber).toBe(555);
    expect(job.txIndex).toBe(3);
    expect(job.txBytes).toBe('0xdeadbeef');
    expect(JSON.parse(job.continuityProof!)).toEqual({ roots: ['0x01'] });
    expect(JSON.parse(job.merkleProof!)).toEqual({ root: '0x00' });
  });

  it('markError stores the message and flips status', () => {
    const loanId = nextLoanId();
    insertPendingJob({ loanId, ...BASE_JOB });

    markError(loanId, 'connect ECONNREFUSED');

    const job = getJobByLoanId(loanId)!;
    expect(job.status).toBe('error');
    expect(job.errorMessage).toBe('connect ECONNREFUSED');
  });
});
