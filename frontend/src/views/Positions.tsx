"use client";

import Link from "next/link";
import { ShieldCheck, Plus, ArrowUpRight, TrendingUp } from "lucide-react";
import { useDesk } from "@/store/desk";
import { STABLE_UNIT } from "@/config/chains";
import { formatAmount } from "@/lib/attora";
import { Card } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export default function Positions() {
  const { positions, drawOn, repayOn } = useDesk();

  const totalDebt = positions.reduce((acc, p) => acc + p.debt, 0);
  const totalCap = positions.reduce((acc, p) => acc + p.cap, 0);
  const availableDraw = Math.max(0, totalCap - totalDebt);

  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <PageHeader
            kicker="03 · POSITIONS"
            title="Positions"
            description="Live credit lines. Active debt and tier caps drawn against attested locks. Underlying collateral values remain permanently confidential."
          />
          {positions.length > 0 && (
            <Link
              href="/app"
              className="btn-proof inline-flex h-10 items-center gap-2 px-5 text-sm font-medium shadow-sm active:scale-95"
            >
              <Plus className="size-4" />
              New loan
            </Link>
          )}
        </div>

        {/* Portfolio Summary Metrics */}
        {positions.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
            <div className="glass rounded-2xl p-4 border border-white/[0.08]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mist">
                Total Debt
              </p>
              <p className="num mt-1 text-2xl font-bold text-snow">
                {formatAmount(totalDebt)}{" "}
                <span className="text-xs font-normal text-mist">{STABLE_UNIT}</span>
              </p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/[0.08]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mist">
                Total Cap
              </p>
              <p className="num mt-1 text-2xl font-bold text-snow">
                {formatAmount(totalCap)}{" "}
                <span className="text-xs font-normal text-mist">{STABLE_UNIT}</span>
              </p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/[0.08]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mist">
                Available to Draw
              </p>
              <p className="num mt-1 text-2xl font-bold text-mint">
                {formatAmount(availableDraw)}{" "}
                <span className="text-xs font-normal text-mist">{STABLE_UNIT}</span>
              </p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/[0.08]">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mist">
                Active Loans
              </p>
              <p className="num mt-1 text-2xl font-bold text-snow">
                {positions.length}
              </p>
            </div>
          </div>
        )}

        {positions.length === 0 ? (
          <Card className="mt-8 grid animate-fade-up place-items-center px-6 py-20 text-center">
            <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <ShieldCheck className="size-6 text-mint" />
            </div>
            <p className="mt-4 text-xl font-bold tracking-tight text-snow">Nothing proven yet.</p>
            <p className="mt-2 max-w-md font-body text-sm font-light leading-relaxed text-mist">
              Commit collateral on Sepolia and open a loan on Creditcoin CC3 to monitor confidential credit lines here.
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
          <div className="mt-8 grid animate-fade-up gap-4 sm:grid-cols-2">
            {positions.map((loan) => {
              const repaid = loan.status === "repaid";
              const utilization = loan.cap > 0 ? Math.min(100, Math.round((loan.debt / loan.cap) * 100)) : 0;
              return (
                <Card
                  key={loan.loanId}
                  hover
                  className={cn("p-6 transition-all duration-300", repaid && "opacity-60")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Hash value={loan.loanId} />
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                        repaid
                          ? "border border-white/10 bg-white/5 text-mist"
                          : "border border-mint/30 bg-mint/10 text-mint",
                      )}
                    >
                      {repaid ? "repaid" : "active"}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mist">
                        Current Debt
                      </p>
                      <p className="num mt-1 text-3xl font-bold text-snow">
                        {formatAmount(loan.debt)}
                        <span className="ml-1.5 text-sm font-normal text-mist">
                          {STABLE_UNIT}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mist">
                        Cap
                      </p>
                      <p className="mt-1 font-mono text-sm text-mist/90">
                        {formatAmount(loan.cap)} {STABLE_UNIT}
                      </p>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-4">
                    <div className="flex justify-between font-mono text-[10px] uppercase text-mist/70 mb-1.5">
                      <span>Utilization</span>
                      <span>{utilization}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-mint to-sand transition-all duration-500"
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
                    <SealedChip>{loan.tier.label}</SealedChip>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={repaid || loan.debt >= loan.cap}
                        onClick={() => drawOn(loan.loanId)}
                        className="btn-glass h-9 px-4 text-xs font-semibold uppercase tracking-wider active:scale-95 disabled:opacity-30"
                      >
                        Draw
                      </button>
                      <button
                        type="button"
                        disabled={repaid || loan.debt === 0}
                        onClick={() => repayOn(loan.loanId)}
                        className="btn-glass h-9 px-4 text-xs font-semibold uppercase tracking-wider active:scale-95 disabled:opacity-30"
                      >
                        Repay
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

