import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { Step } from "@/store/desk";

const STEPS: { key: Step; n: string; label: string }[] = [
  { key: "commit", n: "01", label: "Commit" },
  { key: "prove", n: "02", label: "Prove" },
  { key: "borrow", n: "03", label: "Borrow" },
];

/**
 * Three-segment desk stepper in a glass pill. The active step sits in a
 * proof-gradient circle; segments are clickable when `onStep` is provided
 * (the store guards forward jumps).
 */
export function Stepper({
  current,
  onStep,
}: {
  current: Step;
  onStep?: (step: Step) => void;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="glass inline-flex max-w-full items-center gap-3 overflow-x-auto rounded-full px-5 py-3 sm:gap-4">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const clickable = !!onStep && (done || active === false);
        return (
          <Fragment key={step.key}>
            {i > 0 && (
              <div
                className={cn(
                  "h-0.5 w-6 shrink-0 rounded-full transition-colors duration-300 sm:w-10",
                  i <= currentIndex ? "bg-proof" : "bg-white/10",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onStep?.(step.key)}
              disabled={!onStep}
              className={cn(
                "group flex shrink-0 items-center gap-2.5 rounded-full transition-transform duration-200 ease-out",
                onStep && "hover:scale-[1.04] active:scale-95",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full font-mono text-[11px] font-medium transition-all duration-300",
                  done || active
                    ? "bg-proof text-[#0a1512] shadow-[0_6px_18px_-8px_rgba(148,210,189,0.7)]"
                    : "border border-white/10 bg-white/[0.04] text-mist group-hover:border-white/25 group-hover:text-snow",
                )}
              >
                {step.n}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors",
                  active
                    ? "font-medium text-snow"
                    : done
                      ? "text-snow/80"
                      : "text-mist group-hover:text-snow",
                )}
              >
                {step.label}
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
