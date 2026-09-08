import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useDesk } from "@/store/desk";
import { CC3, STABLE_UNIT } from "@/config/chains";
import { formatAmount } from "@/lib/attora";
import { SealedChip } from "@/components/ui/SealedChip";
import { NetworkBanner } from "@/components/desk/NetworkBanner";

/**
 * Step 03 — Borrow. Requires CC3 and a ready proof. Shows the proven tier and
 * its cap only — never the underlying size (frontend contract §4 Borrow).
 */
export function BorrowPanel() {
  const {
    isCC3,
    switchNetwork,
    tier,
    loanOpened,
    openLoan,
    draw,
    borrowError,
    positions,
    activeLoanId,
  } = useDesk();

  const activeLoan = positions.find((l) => l.loanId === activeLoanId) ?? null;
  const drawn = (activeLoan?.debt ?? 0) > 0;

  return (
    <div className="card animate-fade-up p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-snow">
            Borrow by tier
          </h2>
          <p className="mt-1.5 font-body text-[15px] font-light text-mist">
            Cap is the tier, not the inventory.
          </p>
        </div>
        {tier && <SealedChip>{tier.label}</SealedChip>}
      </div>

      {!isCC3 ? (
        <div className="mt-7">
          <NetworkBanner targetName={CC3.name} onSwitch={() => switchNetwork(CC3.id)} />
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {/* tier + max draw */}
          <div className="glass rounded-card p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-mist">
                  Max draw
                </p>
                <p className="num mt-1 text-3xl font-semibold text-snow">
                  {tier ? formatAmount(tier.cap) : "—"}
                  <span className="ml-1.5 text-base font-normal text-mist">
                    {STABLE_UNIT}
                  </span>
                </p>
              </div>
              <span className="font-mono text-xs text-mist">
                against {tier?.label ?? "—"}
              </span>
            </div>
          </div>

          {borrowError && (
            <p className="text-sm text-danger">{borrowError}</p>
          )}

          {!loanOpened ? (
            <button
              type="button"
              onClick={openLoan}
              className="btn-proof h-12 w-full text-[15px]"
            >
              Open loan with proof
            </button>
          ) : !drawn ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-proof-from">
                <CheckCircle2 className="size-4" />
                Loan opened against the verified proof.
              </p>
              <button
                type="button"
                onClick={draw}
                className="btn-proof h-12 w-full text-[15px]"
              >
                Draw {tier ? formatAmount(tier.cap) : ""} {STABLE_UNIT}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-sm text-proof-from">
                <CheckCircle2 className="size-4" />
                Drawn {formatAmount(activeLoan?.debt ?? 0)} {STABLE_UNIT}.
              </p>
              <Link
                href="/positions"
                className="btn-glass inline-flex h-11 w-full items-center justify-center text-sm"
              >
                View in positions
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
