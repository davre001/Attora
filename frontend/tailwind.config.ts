import type { Config } from "tailwindcss";

/**
 * Attora design system — the "frontend contract" (Attora Frontend.md §2, §6).
 * shadcn semantic tokens (background/foreground/primary/…) are themed to the
 * Attora palette so pasted shadcn primitives render on-brand automatically.
 */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1080px",
      },
    },
    extend: {
      colors: {
        // shadcn semantic tokens (RGB channels → alpha modifiers work)
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        // Attora raw tokens (frontend contract §2)
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        line: "var(--line)",
        mist: "var(--mist)",
        snow: "var(--snow)",
        sealed: "var(--sealed)",
        warn: "#E8B84A",
        danger: "#FF6467",
        // proof accents — the 21st.dev blue chart ramp (chart-1 → chart-2)
        mint: "#91C5FF",
        sand: "#3A81F6",
        "proof-from": "#91C5FF",
        "proof-to": "#3A81F6",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 8px)",
        card: "16px",
        btn: "14px",
        input: "12px",
      },
      fontFamily: {
        // next/font generates hashed family names — target its CSS variables
        display: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        desk: "1080px",
      },
      transitionTimingFunction: {
        institutional: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        proof: "linear-gradient(135deg, #91c5ff 0%, #3a81f6 100%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 180ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
