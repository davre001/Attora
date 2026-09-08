import 'dotenv/config';
import path from 'node:path';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name} (see .env.example)`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Env var ${name} must be an integer, got "${raw}"`);
  }
  return parsed;
}

export const config = {
  sepolia: {
    rpcUrl: optionalEnv('SEPOLIA_RPC_URL', 'http://127.0.0.1:8545'),
    chainId: optionalInt('SEPOLIA_CHAIN_ID', 31337),
    vaultAddress: requireEnv('VAULT_ADDRESS'),
    startBlock: optionalInt('SEPOLIA_START_BLOCK', 0),
  },
  attestcoin: {
    // Sepolia's chainKey in CC3's attestation registry — see README ("chainKey = 1")
    chainKey: optionalInt('ATTESTCOIN_CHAIN_KEY', 1),
    proofBuilderUrl: optionalEnv(
      'PROOF_BUILDER_URL',
      'https://proof-gen-api.cc3-testnet.creditcoin.network/',
    ),
    cc3RpcUrl: requireEnv('CC3_RPC_URL'),
    // undefined -> usc-sdk falls back to its own default (0x...0fd3)
    chainInfoPrecompileAddress: process.env.CHAIN_INFO_PRECOMPILE_ADDRESS,
  },
  db: {
    path: optionalEnv('DB_PATH', path.resolve(process.cwd(), 'data/attora.db')),
  },
  api: {
    port: optionalInt('PORT', 4000),
  },
} as const;
