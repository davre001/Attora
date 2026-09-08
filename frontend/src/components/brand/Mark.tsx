interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * Attora logo mark — proof-gradient rounded square with an "A" glyph.
 * The gradient is the only place §2 permits the proof gradient as fill.
 */
export function Mark({ size = 28, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="attora-mark-grad"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#91C5FF" />
          <stop offset="1" stopColor="#3A81F6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#attora-mark-grad)" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="DM Sans, system-ui, sans-serif"
        fontSize="18"
        fontWeight="600"
        fill="#0E1220"
      >
        A
      </text>
    </svg>
  );
}
