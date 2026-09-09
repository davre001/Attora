import { afterAll, beforeAll, expect, it } from 'vitest';
import { ChildProcess, spawn } from 'node:child_process';

// A separate file (fresh module graph, so no cache-busting tricks needed) that
// sets a deliberately wrong SEPOLIA_CHAIN_ID before src/chain is ever
// imported, to check startCollateralListener() fails closed on a mismatch
// rather than silently listening against the wrong network.
const PORT = 8575;
const RPC_URL = `http://127.0.0.1:${PORT}`;

let anvil: ChildProcess;

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

  process.env.SEPOLIA_RPC_URL = RPC_URL;
  process.env.SEPOLIA_CHAIN_ID = '999999'; // anvil is actually 31337
  process.env.VAULT_ADDRESS = '0x0000000000000000000000000000000000000001';
  process.env.SEPOLIA_START_BLOCK = '0';
  process.env.ATTESTCOIN_CHAIN_KEY = '1';
}, 15_000);

afterAll(() => {
  anvil?.kill();
});

it('rejects a configured chain id that does not match the RPC', async () => {
  const { startCollateralListener } = await import('../src/chain');
  await expect(startCollateralListener()).rejects.toThrow(/chain id/i);
});
