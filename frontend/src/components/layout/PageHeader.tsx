import { cn } from "@/lib/utils";

/**
 * Shared page hero — bold display title with a thin, light-weight description.
 * Used at the top of every app page for a consistent editorial rhythm.
 */
export function PageHeader({
  kicker,
  title,
  description,
  className,
}: {
  /** Small mono eyebrow above the title, e.g. "01 · Desk" */
  kicker?: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-up", className)}>
      {kicker && (
        <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-mist/90 backdrop-blur-md">
          {kicker}
        </span>
      )}
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.035em] text-snow sm:text-5xl lg:text-[52px] lg:leading-[1.1]">
        {title}
      </h1>
      <p className="mt-3.5 max-w-2xl font-body text-base font-light leading-relaxed text-mist sm:text-lg">
        {description}
      </p>
    </div>
  );
}

