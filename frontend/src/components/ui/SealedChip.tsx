import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SealedChipProps {
  /** e.g. "HIDDEN", "SEALED", "TIER 2", "AMOUNT HIDDEN ON-CHAIN" */
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

/**
 * Sealed/hidden chip — neutral frost glass (no purple). Marks anything the
 * protocol keeps confidential — commitment chips, sealed proof payloads, tiers.
 */
export function SealedChip({ children, icon = false, className }: SealedChipProps) {
  return (
    <span
      className={cn(
        "chip-sealed inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        className,
      )}
    >
      {icon && <Lock className="size-3" />}
      {children}
    </span>
  );
}
