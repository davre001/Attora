import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimatedGradient from '../components/ui/animated-gradient'
import DottedBackground from '../components/ui/DottedBackground'
import Button from '../components/ui/Button'
import './Home.css'

const workflow = [
  { step: '01', label: 'Create', desc: 'Issuer records an asset ref and amount on the Canton ledger.' },
  { step: '02', label: 'Status', desc: 'Draft → Issued → Active. Each transition is a Daml choice.' },
  { step: '03', label: 'Transfer', desc: 'Holder accepts the unit. Confidential — no public book.' },
  { step: '04', label: 'Fulfill', desc: 'Settlement is recorded. Lifecycle is closed.' },
  { step: '05', label: 'Audit',   desc: 'Observer reads a status report. No access to amounts or terms.' },
]

const roles = [
  {
    id: 'issuer',
    label: 'Issuer',
    desc: 'Originates the RWA record. Controls status progression from Draft to Active. Sees the full commercial file.',
    actions: ['Create', 'Issue', 'Activate'],
  },
  {
    id: 'holder',
    label: 'Holder',
    desc: 'Accepts transfers and executes settlement. Sees the full record they hold. Initiates fulfillment.',
    actions: ['Accept Transfer', 'Fulfill'],
  },
  {
    id: 'observer',
    label: 'Observer',
    desc: 'Reads lifecycle events and status without access to commercial terms. Suitable for auditors and regulators.',
    actions: ['View Status', 'Pull Report'],
  },
]

const pillars = [
  {
    id: 'confidentiality',
    title: 'Confidentiality',
    desc: 'Canton enforces need-to-know at the ledger level. Counterparties see what they are entitled to, nothing more.',
  },
  {
    id: 'coordination',
    title: 'Coordination',
    desc: 'Multiple organizations share one workflow without sharing the whole book. Canton makes this default, not an afterthought.',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    desc: 'Every lifecycle event is recorded. Observers receive a clean audit trail without exposure to commercial terms.',
  },
]

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    const elements = document.querySelectorAll('.reveal-on-scroll')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-canvas" aria-hidden="true">
          <AnimatedGradient
            config={{
              preset: 'custom',
              color1: '#080A0F',
              color2: '#20D9FF',
              color3: '#060810',
              rotation: -20,
              proportion: 12,
              scale: 0.28,
              speed: 14,
              distortion: 3,
              swirl: 52,
              swirlIterations: 7,
              softness: 96,
              offset: -180,
              shape: 'Checks',
              shapeSize: 22,
            }}
            noise={{ opacity: 0.18, scale: 0.6 }}
            style={{ zIndex: 0 }}
          />
        </div>

        <div className="hero-content container animate-in">
          <div className="hero-label section-label">Private RWA Workflow · Canton / Daml</div>
          <h1 id="hero-heading" className="hero-heading">
            Confidential Real-World Assets
            <br />
            <span className="hero-heading-accent">on Canton Network.</span>
          </h1>
          <p className="hero-subline">
            Create, issue, transfer, and settle real-world assets across trusted parties —
            with need-to-know confidentiality enforced at the ledger.
          </p>
          <div className="hero-actions">
            <Link to="/app" id="hero-cta-desk">
              <Button variant="primary" size="lg">Open the Desk →</Button>
            </Link>
            <Link to="/docs" id="hero-cta-docs">
              <Button variant="secondary" size="lg">Read the Docs</Button>
            </Link>
          </div>

          {/* Roles indicator */}
          <div className="hero-roles">
            {['Issuer', 'Canton', 'Holder', 'Observer'].map((r, i) => (
              <div key={r} className="hero-roles-item">
                <span className="hero-roles-label">{r}</span>
                {i < 3 && <span className="hero-roles-arrow" aria-hidden="true">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-scroll-hint" aria-hidden="true">
          <span>Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* ── Workflow ── */}
      <section id="workflow" className="section home-workflow" aria-labelledby="workflow-heading">
        <DottedBackground dotSpacing={30} baseAlpha={0.28} speed={1.2} />
        <div className="container">
          <div className="reveal-on-scroll">
            <div className="section-label">Workflow</div>
            <h2 id="workflow-heading" className="home-section-title">
              One loop. Five steps.
            </h2>
            <p className="home-section-sub">
              The entire RWA lifecycle runs as Daml choices on a Canton participant.
            </p>
          </div>

          <div className="workflow-steps">
            {workflow.map(({ step, label, desc }, i) => (
              <div
                key={step}
                className="workflow-step reveal-on-scroll"
                style={{ '--reveal-index': i } as React.CSSProperties}
              >
                <div className="workflow-step-number">{step}</div>
                <div className="workflow-step-content">
                  <h3 className="workflow-step-label">{label}</h3>
                  <p className="workflow-step-desc">{desc}</p>
                </div>
                {i < workflow.length - 1 && (
                  <div className="workflow-connector" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider container" />

      {/* ── Roles ── */}
      <section id="roles" className="section home-roles" aria-labelledby="roles-heading">
        <DottedBackground dotSpacing={28} baseAlpha={0.30} speed={1.0} />
        <div className="container">
          <div className="reveal-on-scroll">
            <div className="section-label">Three Roles</div>
            <h2 id="roles-heading" className="home-section-title">
              Role-based access, by design.
            </h2>
            <p className="home-section-sub">
              Switch role in the UI to act as a different Canton party. Each role sees only what it is entitled to.
            </p>
          </div>

          <div className="roles-grid">
            {roles.map(({ id, label, desc, actions }, i) => (
              <div
                key={id}
                className="role-card glass reveal-on-scroll"
                id={`role-card-${id}`}
                style={{ '--reveal-index': i } as React.CSSProperties}
              >
                <div className="role-card-header">
                  <span className="role-card-tag">{label}</span>
                </div>
                <p className="role-card-desc">{desc}</p>
                <div className="role-card-actions">
                  {actions.map(a => (
                    <span key={a} className="role-card-action">{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider container" />

      {/* ── Why Canton ── */}
      <section id="why-canton" className="section home-canton" aria-labelledby="canton-heading">
        <DottedBackground dotSpacing={32} baseAlpha={0.28} speed={1.1} />
        <div className="container">
          <div className="reveal-on-scroll">
            <div className="section-label">Why Canton</div>
            <h2 id="canton-heading" className="home-section-title">
              Private by default.
            </h2>
            <p className="home-section-sub">
              Public chains make RWA issuance look easy and unusable. Canton exists so several organizations
              can share one workflow without sharing the whole book.
            </p>
          </div>

          <div className="pillars-grid">
            {pillars.map(({ id, title, desc }, i) => (
              <div
                key={id}
                className="pillar glass reveal-on-scroll"
                id={`pillar-${id}`}
                style={{ '--reveal-index': i } as React.CSSProperties}
              >
                <div className="pillar-accent-line" aria-hidden="true" />
                <h3 className="pillar-title">{title}</h3>
                <p className="pillar-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
