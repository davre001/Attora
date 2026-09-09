"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileCode, CheckCircle2, ArrowUpRight, Terminal } from "lucide-react";
import { useDesk } from "@/store/desk";
import { formatAmount, type ProofJob } from "@/lib/attora";
import { Card } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

function StatusTag({ status }: { status: ProofJob["status"] }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-mint">
        <span className="size-1.5 rounded-full bg-mint shadow-[0_0_6px_rgba(148,210,189,0.8)]" />
        READY
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em]",
        status === "error"
          ? "border border-danger/30 bg-danger/10 text-danger"
          : "border border-white/10 bg-white/5 text-mist",
      )}
    >
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
  pending,
}: {
  label: string;
  value?: string;
  pending?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.06] py-3 first:border-t-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-mist/80">
        {label}
      </span>
      {pending || !value ? (
        <span className="font-mono text-xs text-mist/40">— pending attestation</span>
      ) : (
        <Hash value={value} lead={12} tail={10} />
      )}
    </div>
  );
}

export default function Proofs() {
  const { proofs } = useDesk();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    proofs.find((p) => p.loanId === selectedId) ?? proofs[0] ?? null;

  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          title="Proofs"
          description="Attestcoin receipt explorer. Inspect cryptographic Merkle and continuity proofs verified down to the Sepolia block."
        />

        <Card className="mt-8 animate-fade-up overflow-hidden border border-white/[0.08]">
          {/* terminal chrome */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-danger/60" />
                <span className="size-2.5 rounded-full bg-warn/60" />
                <span className="size-2.5 rounded-full bg-mint/60" />
              </div>
              <span className="flex items-center gap-1.5 font-mono text-xs text-mist/80">
                <Terminal className="size-3.5 text-mint" />
                attestcoin://proof-verifier
              </span>
            </div>
            <span className="font-mono text-[11px] text-mist/70">
              {proofs.length} {proofs.length === 1 ? "receipt" : "receipts"} logged
            </span>
          </div>

          {proofs.length === 0 ? (
            <div className="grid place-items-center px-6 py-20 text-center">
              <div className="grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <FileCode className="size-6 text-mist" />
              </div>
              <p className="mt-4 text-xl font-bold tracking-tight text-snow">No proofs yet.</p>
              <p className="mt-2 max-w-sm font-body text-sm font-light leading-relaxed text-mist">
                Each commit spins up an Attestcoin proof job. Run the desk to generate the cryptographic source receipt.
              </p>
              <Link
                href="/app"
                className="btn-proof mt-6 inline-flex h-11 items-center gap-2 px-6 text-sm font-medium active:scale-95"
              >
                Open the desk
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-[260px_1fr]">
              {/* list */}
              <ul className="border-b border-white/[0.06] md:border-b-0 md:border-r">
                {proofs.map((p) => {
                  const active = selected?.loanId === p.loanId;
                  return (
                    <li key={p.loanId}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(p.loanId)}
                        className={cn(
                          "flex w-full flex-col gap-2 border-b border-white/[0.06] p-4 text-left transition-all duration-200 last:border-b-0 active:scale-[0.99]",
                          active
                            ? "border-l-2 border-l-mint bg-white/[0.06] shadow-inner"
                            : "hover:bg-white/[0.03]",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-snow font-medium">
                            {p.sourceTx.slice(0, 8)}…{p.sourceTx.slice(-6)}
                          </span>
                          <StatusTag status={p.status} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-mist">
                          <span>Block #{formatAmount(p.blockHeight)}</span>
                          <span>Chain #{p.chainKey}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* detail */}
              {selected && (
                <div className="p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-[0.1em] text-mist">
                        Source Chain: Sepolia (ID {selected.chainKey}) · Block #{formatAmount(selected.blockHeight)}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-snow">
                        Cryptographic Attestation Receipt
                      </h3>
                    </div>
                    {selected.sealed && (
                      <SealedChip icon>Confidential Lock</SealedChip>
                    )}
                  </div>

                  <div className="space-y-1">
                    <DetailRow label="Commitment Hash" value={selected.commitment} />
                    <DetailRow label="Source Sepolia Tx" value={selected.sourceTx} />
                    <DetailRow
                      label="Encoded Tx Payload"
                      value={selected.encodedTx}
                      pending={selected.status !== "ready"}
                    />
                    <DetailRow
                      label="Merkle Proof (Block Tree)"
                      value={selected.merkle}
                      pending={selected.status !== "ready"}
                    />
                    <DetailRow
                      label="Continuity Proof (Headers)"
                      value={selected.continuity}
                      pending={selected.status !== "ready"}
                    />
                  </div>

                  <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-mint" />
                      <p className="font-body text-xs font-light leading-relaxed text-mist">
                        Payload carries no plaintext token amount — only the commitment hash. This proof is verified fail-closed on Creditcoin CC3 via the BlockProver precompile <code className="font-mono text-snow">0x...FD2</code>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
