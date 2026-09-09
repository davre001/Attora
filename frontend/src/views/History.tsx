"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Lock,
  ShieldCheck,
  Landmark,
  Wallet,
  Undo2,
  Droplets,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDesk } from "@/store/desk";
import { SEPOLIA, CC3, CHAINS, STABLE_UNIT } from "@/config/chains";
import { formatAmount } from "@/lib/attora";
import { Card } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

/**
 * History — a chronological activity feed for the connected wallet, derived
 * from the real store ledgers (`proofs` + `positions`). Each committed lock
 * appears as a SEALED entry: §9 means the collateral size never shows here.
 * USDY loan caps/debt are borrowable amounts, not sealed collateral, so those
 * are safe to display.
 */

type Kind = "mint" | "commit" | "open" | "repay";

/** How the amount reads on the ledger: credit (+, green), borrow (yellow),
 *  debit (−, red), or none (sealed / no figure). */
type Flow = "credit" | "borrow" | "debit" | "none";

interface Activity {
  id: string;
  kind: Kind;
  time: number;
  /** Sepolia (source lock) or CC3 (settlement). */
  chain: typeof SEPOLIA | typeof CC3;
  hash?: string;
  block?: number;
  tierLabel?: string;
  /** Displayed amount — a mint credit or a borrowable USDY figure, never
   *  sealed collateral. */
  amount?: number;
  /** Unit label for the amount (e.g. "USDY", "XAU"). */
  unit?: string;
  flow: Flow;
  sealed?: boolean;
}

const KIND_META: Record<Kind, { icon: LucideIcon; title: string }> = {
  mint: { icon: Droplets, title: "Faucet mint" },
  commit: { icon: Lock, title: "Collateral committed" },
  open: { icon: Landmark, title: "Loan opened" },
  repay: { icon: Undo2, title: "Loan repaid" },
};

/** Amount text colour by flow — credit green, borrow yellow, debit red. */
const FLOW_CLASS: Record<Flow, string> = {
  credit: "text-green-400",
  borrow: "text-yellow-400",
  debit: "text-danger",
  none: "text-snow",
};

/** Sign prefix on the amount — credit/borrow add, debit subtracts. */
const FLOW_SIGN: Record<Flow, string> = {
  credit: "+",
  borrow: "+",
  debit: "−",
  none: "",
};

const FILTERS: Array<{ key: "all" | Kind; label: string }> = [
  { key: "all", label: "All" },
  { key: "mint", label: "Mints" },
  { key: "commit", label: "Commits" },
  { key: "open", label: "Loans" },
  { key: "repay", label: "Repaid" },
];

/** Compact relative time — "2m ago", "3h ago", "just now". */
function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ActivityRow({ item }: { item: Activity }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const isSepolia = item.chain.id === SEPOLIA.id;

  return (
    <div className="group flex items-start gap-4 border-t border-white/[0.05] px-5 py-4 transition-colors duration-200 first:border-t-0 hover:bg-white/[0.03]">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl border transition-transform duration-300 ease-out group-hover:scale-105",
          isSepolia
            ? "border-mint/25 bg-mint/10 text-mint"
            : "border-sand/25 bg-sand/10 text-sand",
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-snow">{meta.title}</span>
          {item.tierLabel && <SealedChip>{item.tierLabel}</SealedChip>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mist">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 uppercase tracking-wider">
            {item.chain.short}
          </span>
          {item.hash && <Hash value={item.hash} lead={8} tail={6} />}
          {typeof item.block === "number" && (
            <span>Block #{formatAmount(item.block)}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        {item.sealed ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-mist/50">
            <Lock className="size-3" />
            sealed
          </span>
        ) : typeof item.amount === "number" ? (
          <span
            className={cn(
              "font-mono text-sm font-medium",
              FLOW_CLASS[item.flow],
            )}
          >
            {FLOW_SIGN[item.flow]}
            {formatAmount(item.amount)}
            <span className="ml-1 text-xs font-normal text-mist">
              {item.unit ?? STABLE_UNIT}
            </span>
          </span>
        ) : null}
        <span className="font-mono text-[10px] uppercase tracking-wider text-mist/60">
          {relTime(item.time)}
        </span>
      </div>
    </div>
  );
}

export default function History() {
  const { connected, proofs, positions, mints, openWalletModal } = useDesk();
  const [filter, setFilter] = useState<"all" | Kind>("all");

  // Derive a chronological feed from the real ledgers. Faucet mints are credits
  // (green +). Every proof is a commit (a sealed source lock — no amount). Each
  // position contributes an open (borrow, yellow +) and, once settled, a repay
  // (debit, red −). Position timestamps piggyback on the matching proof.
  const activity = useMemo<Activity[]>(() => {
    const events: Activity[] = [];

    for (const m of mints) {
      events.push({
        id: `mint-${m.id}`,
        kind: "mint",
        time: m.createdAt,
        chain: CHAINS[m.chainId] ?? SEPOLIA,
        hash: m.txHash,
        amount: m.amount,
        unit: m.symbol,
        flow: "credit",
      });
    }

    for (const p of proofs) {
      events.push({
        id: `commit-${p.loanId}`,
        kind: "commit",
        time: p.createdAt,
        chain: SEPOLIA,
        hash: p.sourceTx,
        block: p.blockHeight,
        flow: "none",
        sealed: true,
      });
    }

    for (const loan of positions) {
      const proof = proofs.find((p) => p.loanId === loan.loanId);
      const base = proof?.createdAt ?? Date.now();
      events.push({
        id: `open-${loan.loanId}`,
        kind: "open",
        time: base + 4_000,
        chain: CC3,
        hash: loan.loanId,
        tierLabel: loan.tier.label,
        amount: loan.cap,
        unit: STABLE_UNIT,
        flow: "borrow",
      });
      if (loan.status === "repaid") {
        events.push({
          id: `repay-${loan.loanId}`,
          kind: "repay",
          time: base + 8_000,
          chain: CC3,
          hash: loan.loanId,
          tierLabel: loan.tier.label,
          amount: loan.cap,
          unit: STABLE_UNIT,
          flow: "debit",
        });
      }
    }

    return events.sort((a, b) => b.time - a.time);
  }, [proofs, positions, mints]);

  const filtered =
    filter === "all" ? activity : activity.filter((a) => a.kind === filter);

  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          title="History"
          description="A chronological record of your desk activity — commits, loans, and settlements across Ethereum Sepolia and Creditcoin CC3. Committed collateral stays sealed."
        />

        {!connected ? (
          <Card className="mt-8 grid animate-fade-up place-items-center px-6 py-20 text-center">
            <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Wallet className="size-6 text-mint" />
            </div>
            <p className="mt-4 text-xl font-bold tracking-tight text-snow">
              Connect to view history.
            </p>
            <p className="mt-2 max-w-md font-body text-sm font-light leading-relaxed text-mist">
              Your desk activity is tied to your wallet. Connect to see commits,
              loans, and settlements.
            </p>
            <button
              type="button"
              onClick={() => openWalletModal()}
              className="btn-proof mt-6 inline-flex h-11 items-center gap-2 px-6 text-sm font-medium active:scale-95"
            >
              <Wallet className="size-4" />
              Connect wallet
            </button>
          </Card>
        ) : activity.length === 0 ? (
          <Card className="mt-8 grid animate-fade-up place-items-center px-6 py-20 text-center">
            <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <Clock className="size-6 text-mist" />
            </div>
            <p className="mt-4 text-xl font-bold tracking-tight text-snow">
              No activity yet.
            </p>
            <p className="mt-2 max-w-md font-body text-sm font-light leading-relaxed text-mist">
              Commit collateral on Sepolia and open a loan on Creditcoin CC3 —
              every step lands here as a timestamped record.
            </p>
            <Link
              href="/app"
              className="btn-proof mt-6 inline-flex h-11 items-center gap-2 px-6 text-sm font-medium active:scale-95"
            >
              Open the desk
              <ArrowUpRight className="size-4" />
            </Link>
          </Card>
        ) : (
          <>
            {/* filter chips */}
            <div className="mt-8 flex flex-wrap gap-2 animate-fade-up">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all duration-200 active:scale-95",
                    filter === f.key
                      ? "border border-white/[0.14] bg-white/[0.1] text-snow"
                      : "border border-white/[0.06] bg-transparent text-mist hover:bg-white/[0.05] hover:text-snow",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <Card className="mt-4 animate-fade-up overflow-hidden">
              {filtered.length === 0 ? (
                <div className="grid place-items-center px-6 py-16 text-center">
                  <ShieldCheck className="size-6 text-mist/50" />
                  <p className="mt-3 font-body text-sm font-light text-mist">
                    No {filter} activity yet.
                  </p>
                </div>
              ) : (
                filtered.map((item) => <ActivityRow key={item.id} item={item} />)
              )}
            </Card>

            <p className="mt-8 border-t border-white/[0.06] pt-6 font-body text-xs font-light text-mist">
              Amounts shown are faucet mints and borrowable USDY only. The size
              of any committed collateral stays sealed on the source chain and
              never appears in this record.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
