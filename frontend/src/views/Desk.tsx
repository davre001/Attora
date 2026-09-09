"use client";

import { useDesk } from "@/store/desk";
import { CHAINS } from "@/config/chains";
import { truncateMiddle } from "@/lib/attora";
import { Card, CardLabel } from "@/components/ui/card";
import { Hash } from "@/components/ui/Hash";
import { SealedChip } from "@/components/ui/SealedChip";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkflowProgress } from "@/components/desk/WorkflowProgress";
import { CommitPanel } from "@/components/desk/CommitPanel";
import { ProofPanel } from "@/components/desk/ProofPanel";
import { BorrowPanel } from "@/components/desk/BorrowPanel";
import { cn } from "@/lib/utils";

function RailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0">
      <CardLabel>{label}</CardLabel>
      <div className="text-sm text-snow">{children}</div>
    </div>
  );
}

export default function Desk() {
  const { step, job, tier, address, chainId, isSepolia, isCC3 } = useDesk();

  const netName = chainId ? (CHAINS[chainId]?.short ?? "Unknown") : "Not connected";

  return (
    <section className="container py-10 lg:py-14">
      <div className="mx-auto max-w-desk">
        <PageHeader
          title="The Desk"
          description="The confidential RWA desk. Commit collateral on Sepolia, prove the lock via Attestcoin, and open loans on Creditcoin — without publishing your book."
        />

        <div className="mt-8">
          <WorkflowProgress />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* active panel */}
          <div className="lg:col-span-2">
            {step === "commit" && <CommitPanel />}
            {step === "prove" && <ProofPanel />}
            {step === "borrow" && <BorrowPanel />}
          </div>

          {/* right rail */}
          <Card className="h-fit p-6">
            <RailRow label="Network">
              <span className="inline-flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isSepolia
                      ? "bg-proof-from"
                      : isCC3
                        ? "bg-proof-to"
                        : "bg-mist/50",
                  )}
                />
                {netName}
              </span>
            </RailRow>

            <RailRow label="Loan ID">
              {job ? <Hash value={job.loanId} /> : <span className="text-mist">—</span>}
            </RailRow>

            <RailRow label="Tier">
              {tier ? (
                <SealedChip>{tier.label}</SealedChip>
              ) : (
                <span className="text-mist">—</span>
              )}
            </RailRow>

            <RailRow label="Commitment">
              {job ? (
                <span className="inline-flex items-center gap-2">
                  <Hash value={job.commitment} />
                  <SealedChip>Sealed</SealedChip>
                </span>
              ) : (
                <span className="text-mist">—</span>
              )}
            </RailRow>

            <RailRow label="Wallet">
              {address ? (
                <span className="hash text-snow">{truncateMiddle(address, 6, 4)}</span>
              ) : (
                <span className="text-mist">Not connected</span>
              )}
            </RailRow>
          </Card>
        </div>
      </div>
    </section>
  );
}
