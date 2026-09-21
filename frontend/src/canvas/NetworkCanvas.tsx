import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  zone: number // 0=Issuer, 1=Canton, 2=Holder, 3=Observer
  opacity: number
  targetOpacity: number
  pulseTimer: number
}

interface Connection {
  from: number
  to: number
  opacity: number
  targetOpacity: number
  highlighted: boolean
  highlightTimer: number
}

interface Particle {
  progress: number   // 0–1 along connection path
  speed: number
  connectionIndex: number
  opacity: number
  size: number
  active: boolean
}

const ZONE_COLORS = {
  node: 'rgba(242, 244, 247, ',
  line: 'rgba(242, 244, 247, ',
  accent: 'rgba(32, 217, 255, ',
}

export default function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const reducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0

    /* ── Resize ── */
    function resize() {
      if (!canvas) return
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    /* ── Build nodes in 4 cluster zones ── */
    const nodes: Node[] = []
    const zoneCount = [7, 7, 7, 7]

    for (let z = 0; z < 4; z++) {
      for (let i = 0; i < zoneCount[z]; i++) {
        const cx = (0.15 + z * 0.23) * W
        const cy = 0.5 * H
        nodes.push({
          x: cx + (Math.random() - 0.5) * W * 0.14,
          y: cy + (Math.random() - 0.5) * H * 0.40,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: Math.random() * 1.8 + 0.8,
          zone: z,
          opacity: Math.random() * 0.15 + 0.05,
          targetOpacity: Math.random() * 0.15 + 0.05,
          pulseTimer: Math.random() * 200,
        })
      }
    }

    /* ── Build connections ── */
    const MAX_DIST = Math.max(W, H) * 0.26
    const connections: Connection[] = []

    function buildConnections() {
      connections.length = 0
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d  = Math.sqrt(dx * dx + dy * dy)
          // only connect within same zone or adjacent zone
          const zoneDiff = Math.abs(nodes[i].zone - nodes[j].zone)
          if (d < MAX_DIST && zoneDiff <= 1) {
            connections.push({
              from: i,
              to: j,
              opacity: 0.04,
              targetOpacity: Math.random() * 0.06 + 0.02,
              highlighted: false,
              highlightTimer: 0,
            })
          }
        }
      }
    }
    buildConnections()

    /* ── Particles ── */
    const PARTICLE_COUNT = 12
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        progress: Math.random(),
        speed: Math.random() * 0.0012 + 0.0004,
        connectionIndex: Math.floor(Math.random() * Math.max(1, connections.length)),
        opacity: 0,
        size: Math.random() * 1.5 + 0.8,
        active: Math.random() > 0.5,
      })
    }

    /* ── Static render (reduced motion) ── */
    if (reducedMotion.current) {
      ctx.clearRect(0, 0, W, H)
      // Draw static nodes & lines, no animation
      for (const c of connections) {
        const a = nodes[c.from], b = nodes[c.to]
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = ZONE_COLORS.line + '0.04)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx.fillStyle = ZONE_COLORS.node + '0.12)'
        ctx.fill()
      }
      ro.disconnect()
      return
    }

    /* ── Animation loop ── */
    let frame = 0
    let highlightCooldown = 0

    function tick() {
      ctx!.clearRect(0, 0, W, H)
      frame++

      /* Update nodes */
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy

        // Soft boundary
        const zone_cx = (0.15 + n.zone * 0.23) * W
        const zone_cy = 0.5 * H
        n.vx += (zone_cx - n.x) * 0.0004
        n.vy += (zone_cy - n.y) * 0.0004
        n.vx *= 0.992
        n.vy *= 0.992

        // Opacity pulse
        n.pulseTimer++
        if (n.pulseTimer > 160 + Math.random() * 80) {
          n.targetOpacity = Math.random() * 0.18 + 0.04
          n.pulseTimer = 0
        }
        n.opacity += (n.targetOpacity - n.opacity) * 0.015
      }

      /* Rebuild connections occasionally */
      if (frame % 180 === 0) buildConnections()

      /* Draw connections */
      for (let i = 0; i < connections.length; i++) {
        const c = connections[i]
        const a = nodes[c.from], b = nodes[c.to]

        if (c.highlighted) {
          c.highlightTimer++
          if (c.highlightTimer > 90) {
            c.highlighted = false
            c.highlightTimer = 0
          }
          const t = 1 - c.highlightTimer / 90
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.strokeStyle = ZONE_COLORS.accent + (0.22 * t) + ')'
          ctx!.lineWidth = 0.8
          ctx!.stroke()
        } else {
          c.opacity += (c.targetOpacity - c.opacity) * 0.02
        }

        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.strokeStyle = ZONE_COLORS.line + c.opacity + ')'
        ctx!.lineWidth = 0.5
        ctx!.stroke()
      }

      /* Occasional highlight */
      highlightCooldown--
      if (highlightCooldown <= 0 && connections.length > 0) {
        // pick a connection between adjacent zones (the "flow" path)
        const flowConns = connections.filter(c =>
          Math.abs(nodes[c.from].zone - nodes[c.to].zone) === 1
        )
        if (flowConns.length > 0) {
          const pick = flowConns[Math.floor(Math.random() * flowConns.length)]
          pick.highlighted = true
          pick.highlightTimer = 0
        }
        highlightCooldown = 90 + Math.floor(Math.random() * 120)
      }

      /* Draw nodes */
      for (const n of nodes) {
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
        ctx!.fillStyle = ZONE_COLORS.node + n.opacity + ')'
        ctx!.fill()
      }

      /* Draw particles */
      for (const p of particles) {
        if (!p.active || connections.length === 0) continue
        if (p.connectionIndex >= connections.length) {
          p.connectionIndex = Math.floor(Math.random() * connections.length)
        }

        const c = connections[p.connectionIndex]
        const a = nodes[c.from], b = nodes[c.to]

        p.progress += p.speed
        if (p.progress >= 1) {
          p.progress = 0
          p.active = false
          setTimeout(() => {
            p.connectionIndex = Math.floor(Math.random() * Math.max(1, connections.length))
            p.active = true
            p.speed = Math.random() * 0.0012 + 0.0004
          }, Math.random() * 4000 + 1000)
        }

        const px = a.x + (b.x - a.x) * p.progress
        const py = a.y + (b.y - a.y) * p.progress

        // Fade in/out at ends
        const fade = Math.sin(p.progress * Math.PI)
        const opacity = fade * 0.75

        ctx!.beginPath()
        ctx!.arc(px, py, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = ZONE_COLORS.accent + opacity + ')'
        ctx!.fill()

        // Soft glow trail
        ctx!.beginPath()
        ctx!.arc(px, py, p.size * 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = ZONE_COLORS.accent + (opacity * 0.12) + ')'
        ctx!.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  )
}
