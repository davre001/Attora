import { cn } from "@/lib/utils";

/**
 * Linear progress bar — adapted from a 21st.dev shadcn `Progress` onto the
 * Attora v3 tokens (no `radix-ui` dependency; the indicator is a plain div
 * translated by `-(100 - value)%`, the same technique Radix's primitive uses).
 * Track is `bg-white/10`, the fill is the proof gradient by default.
 */
export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  /** 0–100. Clamped. */
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-white/10",
        className,
      )}
    >
      <div
        className={cn(
          "h-full w-full flex-1 rounded-full bg-proof transition-transform duration-700 ease-institutional",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </div>
  );
}
