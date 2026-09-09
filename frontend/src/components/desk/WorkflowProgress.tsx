import { Check, Loader2 } from "lucide-react";
import { useDesk, type Step } from "@/store/desk";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Desk workflow/progress — redesign of the top-of-desk stepper. Reads the real
 * commit → prove → borrow machine (`step` + `job.status` + `loanOpened`) and
 * renders it as a headline linear progress bar plus three clickable phases.
 *
 * §9: shows only *where in the flow* the user is — never the committed amount.
 * The proof job carries `sealed: true`; the size never reaches this component.
 */

type PhaseState = "done" | "active" | "todo";

const PHASES: { key: Step; n: string; label: string; hint: string }[] = [
  { key: "commit", n: "01", label: "Commit", hint: "Lock collateral on Sepolia" },
  { key: "prove", n: "02", label: "Prove", hint: "Attest the lock via Attestcoin" },
  { key: "borrow", n: "03", label: "Borrow", hint: "Open a loan on Creditcoin" },
];

export function WorkflowProgress() {
  const { step, job, loanOpened, goStep } = useDesk();

  // Map the machine onto a 0–100 fill and a one-line status message. Each phase
  // owns a third of the bar; sub-steps within Prove/Borrow fill it smoothly.
  const s = job?.status;
  let value = 0;
  let message = "Awaiting commitment";

  if (step === "commit") {
    value = job ? 33 : 0;
    message = job ? "Collateral committed" : "Awaiting commitment";
  } else if (step === "prove") {
    if (s === "ready") {
      value = 66;
      message = "Proof ready — continue to borrow";
    } else if (s === "attested") {
      value = 52;
      message = "Building proof — BlockProver…";
    } else if (s === "error") {
      value = 36;
      message = "Proof failed — retry the commit";
    } else {
      value = 40;
      message = "Attesting on Attestcoin…";
    }
  } else if (step === "borrow") {
    value = loanOpened ? 100 : 82;
    message = loanOpened ? "Loan open on Creditcoin" : "Open your loan";
  }

  const currentIndex = PHASES.findIndex((p) => p.key === step);
  const pct = Math.round(value);

  return (
    <div className="card animate-fade-up p-5 sm:p-6">
      {/* headline: percent + live status */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-snow tabular-nums">
              {pct}
              <span className="text-lg text-mist">%</span>
            </span>
          </div>
          <p className="mt-1 flex items-center gap-2 font-body text-sm font-light text-mist">
            {step !== "commit" && !loanOpened && s !== "ready" && s !== "error" && (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-proof-to" />
            )}
            {message}
          </p>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mist/70">
          Step {currentIndex + 1} / {PHASES.length}
        </span>
      </div>

      <Progress value={value} className="mt-4 h-2.5" />

      {/* three phases */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
        {PHASES.map((phase, i) => {
          // Once the loan is open the flow is complete — the final phase flips
          // from active to done so it's checkmarked and greyed like the rest.
          const state: PhaseState =
            i < currentIndex || (phase.key === "borrow" && loanOpened)
              ? "done"
              : i === currentIndex
                ? "active"
                : "todo";
          // A completed phase is locked — no going back to a step you've cleared.
          // Only forward phases the store permits are clickable.
          const reachable =
            state !== "done" &&
            state !== "active" &&
            ((phase.key === "prove" && !!job) ||
              (phase.key === "borrow" && s === "ready"));
          return (
            <button
              key={phase.key}
              type="button"
              onClick={() => goStep(phase.key)}
              disabled={!reachable}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
                state === "active"
                  ? "border-proof-to/40 bg-white/[0.05]"
                  : state === "done"
                    ? "border-white/[0.05] bg-white/[0.015]"
                    : "border-white/[0.05] bg-transparent",
                reachable
                  ? "active:scale-[0.98]"
                  : "cursor-not-allowed",
                state === "done" && "opacity-45",
                state === "todo" && "opacity-55",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full font-mono text-[11px] font-medium transition-all duration-300",
                  state === "done"
                    ? "bg-proof text-[#0a1512]"
                    : state === "active"
                      ? "border border-proof-to/50 text-proof-to"
                      : "border border-white/10 text-mist/40",
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : phase.n}
              </span>
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    "text-sm font-medium",
                    state === "todo" ? "text-mist/60" : "text-snow",
                  )}
                >
                  {phase.label}
                </span>
                <span className="font-body text-xs font-light text-mist">
                  {phase.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
