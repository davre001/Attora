import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Attora input — ink-3 field, 12px radius, proof-blue focus ring.
 * Suffix slot is used for unit labels (e.g. the collateral asset ticker).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-input border border-white/10 bg-white/[0.05] px-4 text-[15px] text-snow backdrop-blur-md",
        "placeholder:text-mist/60 outline-none transition-all duration-200",
        "focus:border-proof-to/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-proof-to/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/** Field wrapper: mono label above, optional trailing unit chip on the input. */
export function Field({
  label,
  unit,
  className,
  children,
}: {
  label: string;
  unit?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-mist">
        {label}
      </span>
      <div className="relative">
        {children}
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-mist">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}
