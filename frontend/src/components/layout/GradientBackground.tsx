import { ShaderBackground } from "@/components/ui/shader-b3e94fd7";

/**
 * App-wide background — the 21st.dev "Mesh drift" WebGL shader
 * (teal-navy → teal → mint → sand), pinned behind every page. The scrim
 * keeps text contrast on glass surfaces while letting the mesh drift show
 * through, and the bottom fade settles the footer into ink.
 */
export function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <ShaderBackground className="absolute inset-0 h-full w-full" />
      {/* ultra-light subtle vignette to ensure crisp glass contrast while keeping the gradient bright */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, transparent 20%, rgba(4,9,12,0.25) 100%)",
        }}
      />
    </div>
  );
}
