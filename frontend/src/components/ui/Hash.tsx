import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateMiddle } from "@/lib/attora";

interface HashProps {
  value: string;
  lead?: number;
  tail?: number;
  /** Show full value untruncated (for long proof payloads in detail views). */
  full?: boolean;
  className?: string;
}

/**
 * Monospace hash/address — middle-truncated, copies the full value on click
 * (frontend contract §7). The copy affordance keeps proof data inspectable.
 */
export function Hash({ value, lead = 6, tail = 4, full = false, className }: HashProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy"
      className={cn(
        "group inline-flex max-w-full items-center gap-2 text-left align-middle",
        className,
      )}
    >
      <span className={cn("hash truncate", full && "break-all")}>
        {full ? value : truncateMiddle(value, lead, tail)}
      </span>
      {copied ? (
        <Check className="size-3.5 shrink-0 text-proof-from" />
      ) : (
        <Copy className="size-3.5 shrink-0 text-mist/50 transition-colors group-hover:text-mist" />
      )}
    </button>
  );
}
