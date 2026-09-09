import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ChildProcess, spawn } from 'node:child_process';
import { ethers } from 'ethers';
import ConfidentialVaultArtifact from './fixtures/ConfidentialVault.json';
import MockRWAArtifact from './fixtures/MockRWA.json';

// Real local Anvil, not a mock — same "no synthetic chain" approach used
// everywhere else in this project (contracts tests, manual smoke tests).
const PORT = 8574;
const RPC_URL = `http://127.0.0.1:${PORT}`;
const ANVIL_ACCOUNT_0_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ANVIL_ACCOUNT_1_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

let anvil: ChildProcess;
let vaultAddress: string;
let chainModule: typeof import('../src/chain');
let dbModule: typeof import('../src/db');
let borrower: ethers.Wallet;
let borrowerNonce: number;

async function waitForRpc(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`anvil on ${RPC_URL} did not become ready within ${timeoutMs}ms`);
}

beforeAll(async () => {
  anvil = spawn('anvil', ['--port', String(PORT), '--silent'], { stdio: 'ignore' });
  await waitForRpc(10_000);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(ANVIL_ACCOUNT_0_KEY, provider);
  borrower = new ethers.Wallet(ANVIL_ACCOUNT_1_KEY, provider);

  // ethers v6's automatic "pending" nonce resolution races against Anvil's
  // instant mining when transactions are sent back-to-back (non-deterministic
  // "nonce too low" on whichever tx loses the race) — track nonces explicitly
  // instead of relying on it.
  let deployerNonce = await provider.getTransactionCount(deployer.address, 'latest');

  const tokenFactory = new ethers.ContractFactory(MockRWAArtifact.abi, MockRWAArtifact.bytecode, deployer);
  const token = await (await tokenFactory.deploy({ nonce: deployerNonce++ })).waitForDeployment();

  const vaultFactory = new ethers.ContractFactory(
    ConfidentialVaultArtifact.abi,
    ConfidentialVaultArtifact.bytecode,
    deployer,
  );
  const vault = await (
    await vaultFactory.deploy(await token.getAddress(), { nonce: deployerNonce++ })
  ).waitForDeployment();
  vaultAddress = await vault.getAddress();

  await (
    await (token as ethers.Contract).mint(borrower.address, ethers.parseEther('50000'), {
      nonce: deployerNonce++,
    })
  ).wait();

  borrowerNonce = await provider.getTransactionCount(borrower.address, 'latest');
  await (
    await (token.connect(borrower) as ethers.Contract).approve(vaultAddress, ethers.MaxUint256, {
      nonce: borrowerNonce++,
    })
  ).wait();

  process.env.SEPOLIA_RPC_URL = RPC_URL;
  process.env.SEPOLIA_CHAIN_ID = '31337';
  process.env.VAULT_ADDRESS = vaultAddress;
  process.env.SEPOLIA_START_BLOCK = '0';
  process.env.ATTESTCOIN_CHAIN_KEY = '1';

  // Config/db read env at import time, so both must be dynamically imported
  // only now that the real deployed address is known.
  chainModule = await import('../src/chain');
  dbModule = await import('../src/db');
}, 20_000);

afterAll(async () => {
  await chainModule?.stopCollateralListener();
  anvil?.kill();
});

async function commit(loanId: string, amount: string): Promise<void> {
  const vault = new ethers.Contract(vaultAddress, ConfidentialVaultArtifact.abi, borrower);
  const tx = await vault.commit(ethers.parseEther(amount), ethers.hexlify(ethers.randomBytes(32)), loanId, {
    nonce: borrowerNonce++,
  });
  await tx.wait();
}

describe('chain listener (real local Anvil)', () => {
  it('backfills a CollateralCommitted event emitted before the listener started', async () => {
    const loanId = ethers.id('backfill-loan');
    await commit(loanId, '1000'); // tier 2

    await chainModule.startCollateralListener();

    const job = dbModule.getJobByLoanId(loanId);
    expect(job).toBeDefined();
    expect(job!.tier).toBe(2);
    expect(job!.borrower.toLowerCase()).toBe(borrower.address.toLowerCase());
    expect(job!.status).toBe('pending');
  });

  it('picks up a live CollateralCommitted event via the subscription', async () => {
    const loanId = ethers.id('live-loan');
    await commit(loanId, '10000'); // tier 3

    // The listener is already running from the previous test; give the
    // subscription a moment to receive the event.
    const deadline = Date.now() + 5_000;
    let job = dbModule.getJobByLoanId(loanId);
    while (!job && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 100));
      job = dbModule.getJobByLoanId(loanId);
    }

    expect(job).toBeDefined();
    expect(job!.tier).toBe(3);
    expect(job!.chainKey).toBe(1);
  }, 10_000);
});
