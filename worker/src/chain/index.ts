import { ethers } from 'ethers';
import { config } from '../config';
import { insertPendingJob } from '../db';
import { CONFIDENTIAL_VAULT_ABI } from './abi';

export const provider = new ethers.JsonRpcProvider(config.sepolia.rpcUrl);

export const vaultContract = new ethers.Contract(
  config.sepolia.vaultAddress,
  CONFIDENTIAL_VAULT_ABI,
  provider,
);

function recordCollateralCommitted(
  borrower: string,
  loanId: string,
  commitment: string,
  tier: bigint,
  log: ethers.EventLog | ethers.Log,
): void {
  insertPendingJob({
    loanId,
    borrower,
    commitment,
    tier: Number(tier),
    sourceTxHash: log.transactionHash,
    sourceBlockNumber: log.blockNumber,
    chainKey: config.attestcoin.chainKey,
  });
  console.log(
    `[chain] CollateralCommitted loanId=${loanId} borrower=${borrower} tier=${tier} tx=${log.transactionHash}`,
  );
}

/** Catches up on events emitted before this process was running (or while it was down). */
async function backfill(fromBlock: number): Promise<number> {
  const toBlock = await provider.getBlockNumber();
  if (fromBlock > toBlock) return toBlock;

  const logs = await vaultContract.queryFilter(
    vaultContract.filters.CollateralCommitted(),
    fromBlock,
    toBlock,
  );

  for (const log of logs) {
    if (!(log instanceof ethers.EventLog)) continue; // undecoded log; shouldn't happen for our own ABI
    const [borrower, loanId, commitment, tier] = log.args;
    recordCollateralCommitted(borrower, loanId, commitment, tier, log);
  }

  console.log(
    `[chain] backfilled ${logs.length} CollateralCommitted event(s), block ${fromBlock} -> ${toBlock}`,
  );
  return toBlock;
}

/** Backfills from config.sepolia.startBlock, then subscribes to new CollateralCommitted events. */
export async function startCollateralListener(): Promise<void> {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== config.sepolia.chainId) {
    throw new Error(
      `RPC at ${config.sepolia.rpcUrl} reports chain id ${network.chainId}, expected ${config.sepolia.chainId} (check SEPOLIA_CHAIN_ID)`,
    );
  }

  const lastBlock = await backfill(config.sepolia.startBlock);

  await vaultContract.on(
    'CollateralCommitted',
    (borrower: string, loanId: string, commitment: string, tier: bigint, payload: ethers.ContractEventPayload) => {
      recordCollateralCommitted(borrower, loanId, commitment, tier, payload.log);
    },
  );

  console.log(
    `[chain] listening for CollateralCommitted on ${config.sepolia.vaultAddress} (chain ${config.sepolia.chainId}), from block ${lastBlock + 1}`,
  );
}

export async function stopCollateralListener(): Promise<void> {
  await vaultContract.removeAllListeners('CollateralCommitted');
}
