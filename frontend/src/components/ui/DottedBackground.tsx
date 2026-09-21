import React, { useEffect, useRef } from 'react';

export interface DottedBackgroundProps {
  className?: string;
  dotSpacing?: number;
  maxRadius?: number;
  baseAlpha?: number;
  speed?: number;
}

export function DottedBackground({
  className = '',
  dotSpacing = 28,
  maxRadius = 1.8,
  baseAlpha = 0.25,
  speed = 1.2,
}: DottedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // Pause rendering when section is scrolled out of viewport
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            cancelAnimationFrame(animationId);
            animationId = requestAnimationFrame(render);
          }
        });
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const startTime = performance.now();

    const render = (now: number) => {
      if (!isVisible || width === 0 || height === 0) return;

      const elapsed = (now - startTime) * 0.001 * speed;
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const maxDist = Math.hypot(centerX, centerY);

      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;

      // Draw black and white animated dotted telemetry grid
      for (let r = 0; r < rows; r++) {
        const y = r * dotSpacing;
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing;

          // Wave equation across coordinates + time
          const wave = Math.sin(x * 0.012 + y * 0.012 + elapsed);
          const secondaryWave = Math.cos(x * 0.02 - y * 0.015 - elapsed * 0.8);
          const combined = (wave + secondaryWave) * 0.5; // -1 to 1

          // Radial vignette: soften towards outer boundaries
          const dist = Math.hypot(x - centerX, y - centerY);
          const vignette = Math.max(0.12, 1 - Math.pow(dist / maxDist, 1.4));

          // Monochromatic luminance calculation (black to off-white)
          const norm = (combined + 1) * 0.5; // 0 to 1
          const alpha = (0.04 + norm * baseAlpha) * vignette;
          const radius = Math.max(0.8, 0.9 + norm * (maxRadius - 0.9));

          // Draw the dot in pure white with computed alpha against the black background
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(242, 244, 247, ${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(animationId);
      } else {
        isVisible = true;
        animationId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dotSpacing, maxRadius, baseAlpha, speed]);

  return (
    <div
      ref={containerRef}
      className={`dotted-bg-container ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default DottedBackground;
