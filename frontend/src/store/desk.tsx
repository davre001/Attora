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

export type Step = "commit" | "prove" | "borrow";

/** Wallet token balances across both chains (mock until the contracts milestone). */
export interface Balances {
  /** Sepolia ETH — gas on the source chain. */
  eth: number;
  /** Mock RWA token — collateral on Sepolia. */
  mrwa: number;
  /** Creditcoin CTC — gas on CC3. */
  ctc: number;
  /** Mock stablecoin (mUSD) — borrowable on CC3. */
  musd: number;
}

const MOCK_BALANCES: Balances = {
  eth: 1.24,
  mrwa: 12_500,
  ctc: 42.8,
  musd: 2_500,
};

const MOCK_ADDRESS = "0x9F4c2b6D8e1A5f30C7bB94a21D6E8f0A3C5d3ac2";

/** Proof progression timings (ms) for the mock worker. */
const ATTEST_MS = 1500;
const READY_MS = 3200;

interface DeskContextValue {
  // wallet / network
  connected: boolean;
  address: string | null;
  chainId: number | null;
  isSepolia: boolean;
  isCC3: boolean;

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
  /** Null while disconnected. Wallet holdings only — the sealed collateral
   * amount never lives here (§9: a balance delta would leak the size). */
  balances: Balances | null;

  // actions
  connect: () => void;
  disconnect: () => void;
  switchNetwork: (id: number) => void;
  commit: (amount: number) => void;
  openLoan: () => void;
  draw: () => void;
  resetFlow: () => void;
  goStep: (step: Step) => void;
  drawOn: (loanId: string) => void;
  repayOn: (loanId: string) => void;
  mint: (token: keyof Balances, amount: number) => void;
}

const DeskContext = createContext<DeskContextValue | null>(null);

export function DeskProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const [step, setStep] = useState<Step>("commit");
  const [tier, setTier] = useState<Tier | null>(null);
  const [job, setJob] = useState<ProofJob | null>(null);
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null);
  const [loanOpened, setLoanOpened] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const [positions, setPositions] = useState<Loan[]>([]);
  const [proofs, setProofs] = useState<ProofJob[]>([]);
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

  const connect = useCallback(() => {
    setConnected(true);
    setAddress(MOCK_ADDRESS);
    setChainId((cur) => cur ?? SEPOLIA.id);
    setBalances(MOCK_BALANCES);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setChainId(null);
    setBalances(null);
  }, []);

  const switchNetwork = useCallback((id: number) => setChainId(id), []);

  /** Credit a faucet mint into the wallet balances. */
  const mint = useCallback((token: keyof Balances, amount: number) => {
    setBalances((b) => (b ? { ...b, [token]: b[token] + amount } : b));
  }, []);

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
      // Drawing mints mUSD into the wallet.
      if (delta > 0) {
        setBalances((b) => (b ? { ...b, musd: b.musd + delta } : b));
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
      // Repaying burns mUSD from the wallet (floored at 0 in the mock).
      if (loan.debt > 0) {
        setBalances((b) =>
          b ? { ...b, musd: Math.max(0, b.musd - loan.debt) } : b,
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
    step,
    tier,
    job,
    activeLoanId,
    loanOpened,
    borrowError,
    positions,
    proofs,
    balances,
    connect,
    disconnect,
    switchNetwork,
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
