/**
 * Chain + contract constants — Attora runs across two testnets.
 * Sepolia is the confidential source chain; Creditcoin CC3 is the settlement
 * chain where the LoanBook ASC verifies the Attestcoin proof.
 *
 * chainId 102031 for CC3 is what the app already surfaces in the Footer; keep
 * these two in sync. Sepolia's 11155111 is canonical.
 */

export interface ChainInfo {
  /** EVM chainId */
  id: number;
  /** Attestcoin chainKey as seen by BlockProver on CC3 (Sepolia = 1) */
  chainKey?: number;
  name: string;
  short: string;
  explorer: string;
}

export const SEPOLIA: ChainInfo = {
  id: 11155111,
  chainKey: 1,
  name: "Ethereum Sepolia",
  short: "Sepolia",
  explorer: "https://sepolia.etherscan.io",
};

export const CC3: ChainInfo = {
  id: 102031,
  name: "Creditcoin CC3 Testnet",
  short: "Creditcoin CC3",
  explorer: "https://dashboard.cc3-testnet.creditcoin.network",
};

export const CHAINS: Record<number, ChainInfo> = {
  [SEPOLIA.id]: SEPOLIA,
  [CC3.id]: CC3,
};

/**
 * Attestcoin infrastructure + protocol addresses (frontend contract §4 /docs).
 * The precompiles and decoder are fixed CC3-testnet infra. The four Attora
 * contracts are not deployed yet — surfaced as pending rather than faked.
 */
export const ADDRESSES = {
  blockProver: "0x0000000000000000000000000000000000000FD2",
  chainInfo: "0x0000000000000000000000000000000000000fd3",
  decoder: "0x731c345d79Fb8BbDC541f9DF3b6317585F849F9f",
  proofBuilder: "https://proof-gen-api.cc3-testnet.creditcoin.network",
  // Deployed during the contracts milestone:
  sourceVault: null as string | null,
  loanBook: null as string | null,
  mockRWA: null as string | null,
  mockStable: null as string | null,
} as const;

/** Public faucets linked from /faucet. */
export const FAUCETS = {
  sepoliaEth: "https://sepoliafaucet.com",
  cc3Ctc: "https://dashboard.cc3-testnet.creditcoin.network/faucet",
} as const;

/** Display unit for the CC3 borrowable dollar token (Ondo USDY). */
export const STABLE_UNIT = "USDY";
