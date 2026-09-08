import { Check, Loader2 } from "lucide-react";
import { useDesk } from "@/store/desk";
import { formatAmount } from "@/lib/attora";
import { Hash } from "@/components/ui/Hash";
import { cn } from "@/lib/utils";

type RowState = "done" | "active" | "todo";

function StatusRow({ state, label }: { state: RowState; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          state === "done"
            ? "bg-proof text-[#06110c]"
            : state === "active"
              ? "border border-proof-to/50 text-proof-to"
              : "border border-white/10 text-mist/40",
        )}
      >
        {state === "done" ? (
          <Check className="size-3.5" />
        ) : state === "active" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>
      <span
        className={cn(
          "text-sm",
          state === "todo" ? "text-mist/50" : "text-snow",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Step 02 — Prove. Polls the worker (pending → attested → ready) and surfaces
 * the source receipt. Borrow stays locked until the proof is ready
 * (frontend contract §4 Prove).
 */
export function ProofPanel() {
  const { job, tier, goStep } = useDesk();

  if (!job) {
    return (
      <div className="card p-7 text-sm text-mist">
        No commitment yet. Start at step 01.
      </div>
    );
  }

  const s = job.status;
  const attestDone = s === "attested" || s === "ready";
  const ready = s === "ready";
  const error = s === "error";

  return (
    <div className="card animate-fade-up p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-snow">
            Prove the lock
          </h2>
          <p className="mt-1.5 font-body text-[15px] font-light text-mist">
            Creditcoin cannot be told. It can only be shown.
          </p>
        </div>
        {ready ? (
          <span className="inline-flex items-center gap-2 font-mono text-xs text-snow">
            <span className="size-1.5 rounded-full bg-proof" />
            READY
          </span>
        ) : (
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-mist">
            {error ? "error" : s}
          </span>
        )}
      </div>

      {/* progression */}
      <div className="mt-6 space-y-3.5">
        <StatusRow state="done" label="Source event detected on Sepolia" />
        <StatusRow
          state={attestDone ? "done" : "active"}
          label="Attested by Attestcoin"
        />
        <StatusRow
          state={ready ? "done" : attestDone ? "active" : "todo"}
          label="Proof built — BlockProver ready"
        />
      </div>

      {/* receipt */}
      <dl className="mt-6 space-y-3 border-t border-white/[0.06] pt-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-mist">Source tx</dt>
          <dd>
            <Hash value={job.sourceTx} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-mist">chainKey</dt>
          <dd className="hash text-snow">{job.chainKey}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-mist">blockHeight</dt>
          <dd className="hash text-snow">{formatAmount(job.blockHeight)}</dd>
        </div>
        {tier && (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-mist">Proven tier</dt>
            <dd className="font-mono text-snow">{tier.label}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        disabled={!ready}
        onClick={() => goStep("borrow")}
        className="btn-proof mt-6 h-12 w-full text-[15px]"
      >
        {ready ? "Continue to borrow" : "Waiting on Attestcoin…"}
      </button>
    </div>
  );
}
