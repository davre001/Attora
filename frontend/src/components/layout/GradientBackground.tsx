"use client";

import { usePathname } from "next/navigation";
import { ShaderBackground } from "@/components/ui/shader-b3e94fd7";

/**
 * App-wide background. The landing page (`/`) keeps the 21st.dev "Mesh drift"
 * WebGL shader (near-black → navy → blue → periwinkle). Every other page drops
 * the animated gradient for a plain pure-black field with the same blue
 * highlights, so the app surfaces read calmer under content.
 */

export function GradientBackground() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <ShaderBackground className="absolute inset-0 h-full w-full" />
        {/* ultra-light subtle vignette to ensure crisp glass contrast while keeping the gradient bright */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, transparent 20%, rgba(13,13,15,0.3) 100%)",
          }}
        />
      </div>
    );
  }

  // Non-landing pages: pure-black base + blue highlights + 40% grain.
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* blue highlights — the same #91C5FF / #3A81F6 accents as the shader */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 42% at 50% -8%, rgba(58,129,246,0.18) 0%, transparent 60%), radial-gradient(42% 32% at 88% 12%, rgba(145,197,255,0.10) 0%, transparent 55%)",
        }}
      />
    </div>
  );
}
