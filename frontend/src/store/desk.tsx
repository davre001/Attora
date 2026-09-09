"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CC3, SEPOLIA } from "@/config/chains";
import {
  amountToTier,
  mockCommitment,
  mockContinuity,
  mockEncodedTx,
  mockLoanId,
  mockMerkle,
  mockBlockHeight,
  mockTxHash,
  type Loan,
  type ProofJob,
  type Tier,
} from "@/lib/attora";
import { discoverWallets, getInjectedProvider, type EIP1193Provider } from "@/lib/wallets";

export type Step = "commit" | "prove" | "borrow";

/** Wallet token balances across both chains (mock until the contracts milestone). */
export interface Balances {
  /** Sepolia ETH — gas on the source chain. */
  eth: number;
  /** Tokenized gold — collateral on Sepolia. */
  gold: number;
  /** Tokenized NVIDIA equity — collateral on Sepolia. */
  nvda: number;
  /** Tokenized US Treasury bills — collateral on Sepolia. */
  usty: number;
  /** Tokenized private credit — collateral on Sepolia. */
  pcr: number;
  /** Creditcoin CTC — gas on CC3. */
  ctc: number;
  /** Ondo Finance USDY — borrowable on CC3. */
  usdy: number;
}

const MOCK_BALANCES: Balances = {
  eth: 1.24,
  gold: 32,
  nvda: 60,
  usty: 15_000,
  pcr: 25_000,
  ctc: 42.8,
  usdy: 2_500,
};

const MOCK_ADDRESS = "0x9F4c2b6D8e1A5f30C7bB94a21D6E8f0A3C5d3ac2";

/** A faucet mint credited to the wallet — feeds the History activity feed. */
export interface MintRecord {
  id: string;
  token: keyof Balances;
  symbol: string;
  amount: number;
  chainId: number;
  txHash: string;
  createdAt: number;
}

/** Proof progression timings (ms) for the mock worker. */
const ATTEST_MS = 1500;
const READY_MS = 3200;

/**
 * A connection persisted across refreshes so the connected shell (and its
 * wallet-gated nav) survives a reload. The wallet keeps its authorization
 * across reloads; only our in-memory state is lost. Deliberately stores NO
 * address or balances — the real state is re-derived from the wallet via a
 * silent `eth_accounts` call on mount (§9: nothing sensitive touches storage).
 */
const SESSION_KEY = "attora.session";
type SavedSession = { kind: "injected"; rdns?: string } | { kind: "demo" };

function saveSession(s: SavedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* private mode / storage disabled — the session just won't persist */
  }
}
function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch {
    return null;
  }
}
function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

interface DeskContextValue {
  // wallet / network
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isSepolia: boolean;
  isCC3: boolean;
  /** True while an injected connect request is in flight. */
  connecting: boolean;
  /** Wallet-picker modal visibility. */
  walletModalOpen: boolean;
  /** Where a successful connect lands (e.g. "/app" from "Open the desk"). */
  redirectAfterConnect: string | null;

  // active commit → prove → borrow flow
  step: Step;
  tier: Tier | null;
  job: ProofJob | null;
  activeLoanId: string | null;
  loanOpened: boolean;
  borrowError: string | null;

  // ledgers
  positions: Loan[];
  proofs: ProofJob[];
  /** Faucet mints credited to the wallet, newest first (History feed). */
  mints: MintRecord[];
  /** Null while disconnected. Wallet holdings only — the sealed collateral
   * amount never lives here (§9: a balance delta would leak the size). */
  balances: Balances | null;

  // actions
  connectInjected: (provider: EIP1193Provider, rdns?: string) => Promise<void>;
  /** Simulated wallet for demoing without an extension. */
  connectDemo: () => void;
  disconnect: () => void;
  switchNetwork: (id: number) => void;
  openWalletModal: (redirect?: string) => void;
  closeWalletModal: () => void;
  commit: (amount: number) => void;
  openLoan: () => void;
  draw: () => void;
  resetFlow: () => void;
  goStep: (step: Step) => void;
  drawOn: (loanId: string) => void;
  repayOn: (loanId: string) => void;
  mint: (
    token: keyof Balances,
    amount: number,
    meta?: { symbol?: string; chainId?: number; txHash?: string },
  ) => void;
}

const DeskContext = createContext<DeskContextValue | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [redirectAfterConnect, setRedirectAfterConnect] = useState<string | null>(
    null,
  );

  const [step, setStep] = useState<Step>("commit");
  const [tier, setTier] = useState<Tier | null>(null);
  const [job, setJob] = useState<ProofJob | null>(null);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [loanOpened, setLoanOpened] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const [positions, setPositions] = useState<Loan[]>([]);
  const [proofs, setProofs] = useState<ProofJob[]>([]);
  const [mints, setMints] = useState<MintRecord[]>([]);
  const [balances, setBalances] = useState<Balances | null>(null);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  /** Patch a proof job in both the active `job` and the `proofs` ledger. */
  const patchJob = useCallback((loanId: string, patch: Partial<ProofJob>) => {
    setJob((cur) => (cur && cur.loanId === loanId ? { ...cur, ...patch } : cur));
    setProofs((list) =>
      list.map((p) => (p.loanId === loanId ? { ...p, ...patch } : p)),
    );
  }, []);

  /** Active injected provider + its event handlers, for detach on disconnect. */
  const providerRef = useRef<EIP1193Provider | null>(null);
  const walletHandlersRef = useRef<{
    accounts: (accounts: string[]) => void;
    chain: (chainIdHex: string) => void;
  } | null>(null);

  const detachWalletListeners = useCallback(() => {
    const provider = providerRef.current;
    const handlers = walletHandlersRef.current;
    if (provider && handlers) {
      provider.removeListener?.("accountsChanged", handlers.accounts);
      provider.removeListener?.("chainChanged", handlers.chain);
    }
    walletHandlersRef.current = null;
    providerRef.current = null;
  }, []);

  // disconnect() is referenced from inside connectInjected's listener closure;
  // a ref keeps the delegation stable without a dependency cycle.
  const disconnectRef = useRef<() => void>(() => undefined);

  /** Attach an injected provider's listeners and move the app into the
   *  connected state. Shared by the interactive connect and the silent
   *  refresh-time reconnect below. */
  const attachInjected = useCallback(
    (provider: EIP1193Provider, accounts: string[], chainIdHex: string) => {
      detachWalletListeners();
      providerRef.current = provider;
      const onAccounts = (next: string[]) => {
        if (next.length === 0) {
          disconnectRef.current();
        } else {
          setAddress(next[0]);
        }
      };
      const onChain = (hex: string) => setChainId(parseInt(hex, 16));
      walletHandlersRef.current = { accounts: onAccounts, chain: onChain };
      provider.on?.("accountsChanged", onAccounts);
      provider.on?.("chainChanged", onChain);

      setConnected(true);
      setAddress(accounts[0]);
      setChainId(parseInt(chainIdHex, 16));
      setBalances(MOCK_BALANCES);
    },
    [detachWalletListeners],
  );

  /** Connect through a real injected EIP-1193 provider (MetaMask / Rabby /
   *  Phantom / any browser wallet). Throws on user rejection. `rdns` is the
   *  wallet id, persisted so the session can be silently restored on refresh. */
  const connectInjected = useCallback(
    async (provider: EIP1193Provider, rdns?: string) => {
      setConnecting(true);
      try {
        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (!accounts?.length) throw new Error("No accounts returned");
        const chainIdHex = (await provider.request({
          method: "eth_chainId",
        })) as string;

        attachInjected(provider, accounts, chainIdHex);
        saveSession({ kind: "injected", rdns });
      } finally {
        setConnecting(false);
      }
    },
    [attachInjected],
  );

  /** Simulated wallet — keeps the mock-first demo usable without any
   *  extension installed. */
  const connectDemo = useCallback(() => {
    setConnected(true);
    setAddress(MOCK_ADDRESS);
    setChainId((cur) => cur ?? SEPOLIA.id);
    setBalances(MOCK_BALANCES);
    saveSession({ kind: "demo" });
  }, []);

  const disconnect = useCallback(() => {
    detachWalletListeners();
    setConnected(false);
    setAddress(null);
    setChainId(null);
    setBalances(null);
    setMints([]);
    clearSession();
  }, [detachWalletListeners]);

  disconnectRef.current = disconnect;

  /** Silently restore an injected connection on refresh. `eth_accounts` never
   *  prompts — it returns the still-authorized accounts, or [] if the wallet
   *  was locked or disconnected externally (then we drop the stale session). */
  const reconnectInjected = useCallback(
    async (rdns?: string) => {
      let provider: EIP1193Provider | null = null;
      if (rdns && rdns !== "injected") {
        const detail = (await discoverWallets()).find(
          (d) => d.info.rdns === rdns,
        );
        provider = detail?.provider ?? null;
      }
      if (!provider) provider = getInjectedProvider();
      if (!provider) {
        clearSession();
        return;
      }
      try {
        const accounts = (await provider.request({
          method: "eth_accounts",
        })) as string[];
        if (!accounts?.length) {
          clearSession();
          return;
        }
        const chainIdHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        attachInjected(provider, accounts, chainIdHex);
      } catch {
        clearSession();
      }
    },
    [attachInjected],
  );

  // Rehydrate a prior session after a refresh. Runs in a mount effect (never
  // during render) so the first client render still matches the server's
  // disconnected markup — no hydration mismatch. Without this the nav, which
  // is gated on `connected`, vanishes on every reload.
  const rehydratedRef = useRef(false);
  useEffect(() => {
    if (rehydratedRef.current) return;
    rehydratedRef.current = true;
    const saved = loadSession();
    if (!saved) return;
    if (saved.kind === "demo") connectDemo();
    else void reconnectInjected(saved.rdns);
  }, [connectDemo, reconnectInjected]);

  const switchNetwork = useCallback((id: number) => {
    // Ask the wallet to switch; the mock ledger follows either way.
    providerRef.current
      ?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${id.toString(16)}` }],
      })
      .catch(() => undefined); // rejection / unknown chain — state still moves
    setChainId(id);
  }, []);

  const openWalletModal = useCallback((redirect?: string) => {
    setRedirectAfterConnect(redirect ?? null);
    setWalletModalOpen(true);
  }, []);
  const closeWalletModal = useCallback(() => {
    setWalletModalOpen(false);
    setRedirectAfterConnect(null);
  }, []);

  /** Credit a faucet mint into the wallet balances and log it to History. */
  const mint = useCallback(
    (token: keyof Balances, amount: number, meta?: { symbol?: string; chainId?: number; txHash?: string }) => {
      setBalances((b) => (b ? { ...b, [token]: b[token] + amount } : b));
      setMints((list) => [
        {
          id: `${token}-${Date.now()}`,
          token,
          symbol: meta?.symbol ?? token.toUpperCase(),
          amount,
          chainId: meta?.chainId ?? SEPOLIA.id,
          txHash: meta?.txHash ?? mockTxHash(),
          createdAt: Date.now(),
        },
        ...list,
      ]);
    },
    [],
  );

  const commit = useCallback(
    (amount: number) => {
      // Amount is used only to pick a tier, then discarded — never stored.
      const nextTier = amountToTier(amount);
      const loanId = mockLoanId();
      const newJob: ProofJob = {
        loanId,
        commitment: mockCommitment(),
        sourceTx: mockTxHash(),
        blockHeight: mockBlockHeight(),
        chainKey: SEPOLIA.chainKey ?? 1,
        status: "pending",
        sealed: true,
        createdAt: Date.now(),
      };

      clearTimers();
      setTier(nextTier);
      setJob(newJob);
      setProofs((list) => [newJob, ...list]);
      setActiveLoanId(null);
      setLoanOpened(false);
      setBorrowError(null);
      setStep("prove");

      timers.current.push(
        setTimeout(() => patchJob(loanId, { status: "attested" }), ATTEST_MS),
        setTimeout(
          () =>
            patchJob(loanId, {
              status: "ready",
              encodedTx: mockEncodedTx(),
              merkle: mockMerkle(),
              continuity: mockContinuity(),
            }),
          READY_MS,
        ),
      );
    },
    [clearTimers, patchJob],
  );

  const openLoan = useCallback(() => {
    if (!job || job.status !== "ready") {
      setBorrowError("Proof is not ready. openLoan reverts without a proof.");
      return;
    }
    if (chainId !== CC3.id) {
      setBorrowError("Wrong network. Switch to Creditcoin CC3.");
      return;
    }
    if (!tier) return;

    const loan: Loan = {
      loanId: job.loanId,
      tier,
      debt: 0,
      cap: tier.cap,
      status: "open",
    };
    setPositions((list) => [loan, ...list]);
    setActiveLoanId(loan.loanId);
    setLoanOpened(true);
    setBorrowError(null);
  }, [job, chainId, tier]);

  const draw = useCallback(() => {
    if (!activeLoanId) return;
    drawOnRef.current(activeLoanId);
  }, [activeLoanId]);

  const resetFlow = useCallback(() => {
    clearTimers();
    setStep("commit");
    setTier(null);
    setJob(null);
    setActiveLoanId(null);
    setLoanOpened(false);
    setBorrowError(null);
  }, [clearTimers]);

  const goStep = useCallback(
    (target: Step) => {
      // Guard forward jumps: can't prove without a commit, can't borrow
      // without a ready proof. Backward navigation is always allowed.
      setStep((cur) => {
        if (target === "prove" && !job) return cur;
        if (target === "borrow" && job?.status !== "ready") return cur;
        return target;
      });
    },
    [job],
  );

  const drawOn = useCallback(
    (loanId: string) => {
      const loan = positions.find((l) => l.loanId === loanId);
      if (!loan) return;
      const delta = loan.cap - loan.debt;
      setPositions((list) =>
        list.map((l) => (l.loanId === loanId ? { ...l, debt: l.cap } : l)),
      );
      // Drawing mints USDY into the wallet.
      if (delta > 0) {
        setBalances((b) => (b ? { ...b, usdy: b.usdy + delta } : b));
      }
    },
    [positions],
  );

  const repayOn = useCallback(
    (loanId: string) => {
      const loan = positions.find((l) => l.loanId === loanId);
      if (!loan) return;
      setPositions((list) =>
        list.map((l) =>
          l.loanId === loanId ? { ...l, debt: 0, status: "repaid" } : l,
        ),
      );
      // Repaying burns USDY from the wallet (floored at 0 in the mock).
      if (loan.debt > 0) {
        setBalances((b) =>
          b ? { ...b, usdy: Math.max(0, b.usdy - loan.debt) } : b,
        );
      }
    },
    [positions],
  );

  // draw() delegates to drawOn for the active loan; a ref keeps the delegation
  // stable without depending on the positions array.
  const drawOnRef = useRef(drawOn);
  drawOnRef.current = drawOn;

  const value: DeskContextValue = {
    connected,
    address,
    chainId,
    isSepolia: chainId === SEPOLIA.id,
    isCC3: chainId === CC3.id,
    connecting,
    walletModalOpen,
    redirectAfterConnect,
    step,
    tier,
    job,
    activeLoanId,
    loanOpened,
    borrowError,
    positions,
    proofs,
    mints,
    balances,
    connectInjected,
    connectDemo,
    disconnect,
    switchNetwork,
    openWalletModal,
    closeWalletModal,
    commit,
    openLoan,
    draw,
    resetFlow,
    goStep,
    drawOn,
    repayOn,
    mint,
  };

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDesk(): DeskContextValue {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used within <DeskProvider>");
  return ctx;
}
