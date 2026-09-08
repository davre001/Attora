import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Attora card — flat ink-2 panel, 1px line border, 20px radius, no shadow
 * (frontend contract §2). `hover` enables the line-only border lift.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("card", hover && "card-hover", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/** Small uppercase mono label used for rail rows and section keys. */
export function CardLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.08em] text-mist",
        className,
      )}
      {...props}
    />
  );
}
