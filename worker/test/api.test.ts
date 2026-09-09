import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/api';
import { insertPendingJob, markReady } from '../src/db';

const app = createApp();

let counter = 0;
function nextLoanId(): string {
  counter += 1;
  return '0x' + counter.toString(16).padStart(64, '0');
}

const BORROWER = '0xaBCdEf0000000000000000000000000000000001'; // real EIP-55 checksum

function seedReadyJob(): string {
  const loanId = nextLoanId();
  insertPendingJob({
    loanId,
    borrower: BORROWER,
    commitment: '0x' + '22'.repeat(32),
    tier: 3,
    sourceTxHash: '0x' + '33'.repeat(32),
    sourceBlockNumber: 42,
    chainKey: 1,
  });
  markReady(loanId, {
    headerNumber: 100,
    txIndex: 0,
    txBytes: '0xdeadbeef',
    continuityProof: JSON.stringify({ lowerEndpointDigest: '0x00', roots: [] }),
    merkleProof: JSON.stringify({ root: '0x00', siblings: [] }),
  });
  return loanId;
}

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('GET /proofs/:loanId', () => {
  it('returns a full job with tierCap and parsed proof payload', async () => {
    const loanId = seedReadyJob();

    const res = await request(app).get(`/proofs/${loanId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      loanId,
      borrower: BORROWER,
      tier: 3,
      tierCap: 5_000,
      status: 'ready',
      headerNumber: 100,
      txBytes: '0xdeadbeef',
    });
    expect(res.body.continuityProof).toEqual({ lowerEndpointDigest: '0x00', roots: [] });
    expect(res.body.merkleProof).toEqual({ root: '0x00', siblings: [] });
  });

  it('404s an unknown loanId', async () => {
    const res = await request(app).get(`/proofs/0x${'00'.repeat(32)}`);
    expect(res.status).toBe(404);
  });

  it('400s a malformed loanId', async () => {
    const res = await request(app).get('/proofs/not-a-hash');
    expect(res.status).toBe(400);
  });

  it('accepts an uppercase loanId (case-insensitive lookup)', async () => {
    const loanId = seedReadyJob();
    const res = await request(app).get(`/proofs/${loanId.toUpperCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.loanId).toBe(loanId);
  });
});

describe('GET /positions/:address', () => {
  it('lists jobs for a borrower', async () => {
    const loanId = seedReadyJob();

    const res = await request(app).get(`/positions/${BORROWER}`);
    expect(res.status).toBe(200);
    expect(res.body.address).toBe(BORROWER);
    expect(res.body.positions.map((p: { loanId: string }) => p.loanId)).toContain(loanId);
  });

  it('matches a borrower case-insensitively', async () => {
    seedReadyJob();
    const res = await request(app).get(`/positions/${BORROWER.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.positions.length).toBeGreaterThan(0);
  });

  it('returns an empty list for an address with no jobs', async () => {
    const res = await request(app).get('/positions/0x0000000000000000000000000000000000000009');
    expect(res.status).toBe(200);
    expect(res.body.positions).toEqual([]);
  });

  it('400s a malformed address', async () => {
    const res = await request(app).get('/positions/not-an-address');
    expect(res.status).toBe(400);
  });
});
