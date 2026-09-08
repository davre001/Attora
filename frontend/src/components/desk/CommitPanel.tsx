import { useState } from "react";
import { Lock } from "lucide-react";
import { useDesk } from "@/store/desk";
import { SEPOLIA } from "@/config/chains";
import { amountToTier, formatAmount } from "@/lib/attora";
import { Field, Input } from "@/components/ui/input";
import { SealedChip } from "@/components/ui/SealedChip";
import { NetworkBanner } from "@/components/desk/NetworkBanner";
import { cn } from "@/lib/utils";

/**
 * Step 01 — Commit. Amount is entered in the browser only; committing publishes
 * a commitment hash + tier, never the size (frontend contract §4 Commit).
 */
export function CommitPanel() {
  const { connected, isSepolia, connect, switchNetwork, commit } = useDesk();
  const [amount, setAmount] = useState("");

  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value > 0;
  const tierPreview = valid ? amountToTier(value) : null;

  return (
    <div className="card animate-fade-up p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-snow">
            Commit collateral
          </h2>
          <p className="mt-1.5 font-body text-[15px] font-light text-mist">
            Amount never leaves this browser onto the log.
          </p>
        </div>
        <SealedChip icon>Amount hidden on-chain</SealedChip>
      </div>

      <div className="mt-7">
        {!connected ? (
          <div className="glass rounded-card p-5 text-center">
            <p className="text-sm font-light text-mist">
              Connect a wallet to open the confidential vault on Sepolia.
            </p>
            <button
              type="button"
              onClick={connect}
              className="btn-proof mt-4 h-11 px-6 text-sm"
            >
              Connect wallet
            </button>
          </div>
        ) : !isSepolia ? (
          <NetworkBanner
            targetName={SEPOLIA.name}
            onSwitch={() => switchNetwork(SEPOLIA.id)}
          />
        ) : (
          <div className="space-y-5">
            <Field label="Collateral amount" unit="RWA">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && valid && commit(value)}
                className="pr-16 font-display text-lg"
              />
            </Field>

            {/* Quick preset selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-mist/80">Presets:</span>
              {[
                { label: "100 (Tier 1)", val: 100 },
                { label: "1,000 (Tier 2)", val: 1000 },
                { label: "10,000 (Tier 3)", val: 10000 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setAmount(String(p.val))}
                  className={cn(
                    "btn-glass h-7 rounded-lg px-2.5 font-mono text-xs transition-all duration-200 active:scale-95",
                    value === p.val
                      ? "border-mint/50 bg-mint/15 text-snow shadow-[0_0_12px_rgba(148,210,189,0.25)]"
                      : "text-mist hover:border-white/20 hover:text-snow",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 text-mist">
                <Lock className="size-3" />
                Used locally to build the commitment.
              </span>
              {tierPreview && (
                <span className="font-mono font-medium text-mint">
                  → {tierPreview.label} · cap {formatAmount(tierPreview.cap)} mUSD
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={!valid}
              onClick={() => commit(value)}
              className="btn-proof h-12 w-full text-[15px] font-semibold tracking-wide active:scale-[0.98]"
            >
              Commit collateral
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
