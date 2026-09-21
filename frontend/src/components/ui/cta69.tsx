import React from "react";
import { Badge7 } from "./cta69-utils/badge7";
import { Button12 } from "./cta69-utils/button12";
import { cn } from "../../lib/utils";
import "./cta69.css";

// Compatible Link component supporting internal & external hrefs in Vite/React
interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href = "#", className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  }
);
Link.displayName = "Link";

interface Badge {
  label: string;
}

interface ActionButton {
  label: string;
  href: string;
}

interface Cta69Labels {
  /** Repeated phrase scrolling across the backdrop */
  marqueePhrase?: string;
  /** Short supporting line beneath the heading */
  note?: string;
  /** Fine print sitting under the button */
  footnote?: string;
}

interface Cta69Props {
  badge?: Badge;
  heading?: string;
  button?: ActionButton;
  labels?: Cta69Labels;
  className?: string;
}

export const cta69Demo: Cta69Props = {
  badge: { label: "Canton / Daml Protocol" },
  heading: "Private real-world assets on Canton.",
  button: {
    label: "Open Desk",
    href: "/app",
  },
  labels: {
    marqueePhrase: "Private RWA · Canton",
    note: "Issue, transfer, and settle institutional assets across trusted counterparties with need-to-know confidentiality enforced directly at the ledger.",
    footnote: "Zero public ledger leakages · Deterministic audit trails for designated observers.",
  },
};

/**
 * How many times the phrase is written into one half of the marquee.
 *
 * The loop is two identical halves slid by exactly half their width, so it only
 * reads as endless while a single half is wider than the screen. A short phrase
 * written once is not: it reaches the right edge and then drags a hole across
 * the section until the animation restarts. Repeating it is what closes that
 * hole, and eight is enough for a one-word phrase at this size.
 */
const REPEATS = 8;

export function Cta69({
  badge = cta69Demo.badge,
  heading = cta69Demo.heading,
  button = cta69Demo.button,
  labels = cta69Demo.labels,
  className,
}: Cta69Props) {
  const marqueePhrase = labels?.marqueePhrase;
  // The separator lives inside the phrase rather than in padding between spans:
  // padding is only applied between elements, so it left one wide gap per copy
  // instead of the same small gap between every repeat.
  const marqueeLine = marqueePhrase
    ? `${marqueePhrase} · `.repeat(REPEATS)
    : "";

  return (
    <section
      className={cn(
        "cta69-section relative overflow-hidden bg-background py-16 md:py-24 w-full",
        className,
      )}
    >
      {/* Giant scrolling backdrop */}
      {marqueePhrase && (
        <div
          aria-hidden="true"
          className="cta69-backdrop pointer-events-none absolute inset-0 flex items-center overflow-hidden select-none"
        >
          <div className="cta69-track flex w-max shrink-0 whitespace-nowrap text-foreground/[0.06]">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="cta69-marquee-text text-[22vw] font-bold leading-none tracking-tighter md:text-[16vw]"
              >
                {marqueeLine}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Centered statement */}
      <div className="cta69-container relative mx-auto flex max-w-3xl flex-col items-center px-4 text-center md:px-6">
        {badge && <Badge7 label={badge.label} />}

        {heading && (
          <h2 className="cta69-heading mt-8 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            {heading}
          </h2>
        )}

        {labels?.note && (
          <p className="cta69-note mt-6 max-w-xl text-balance text-lg text-muted-foreground md:text-xl">
            {labels.note}
          </p>
        )}

        {button && (
          <div className="cta69-btn-wrap mt-12">
            <Button12 asChild label={button.label}>
              <Link href={button.href} />
            </Button12>
          </div>
        )}

        {labels?.footnote && (
          <p className="cta69-footnote mt-8 text-base text-muted-foreground">
            {labels.footnote}
          </p>
        )}
      </div>
    </section>
  );
}

export default Cta69;
