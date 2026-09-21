import { Link, useLocation } from 'react-router-dom'
import { Cta69 } from '../ui/cta69'
import './Footer.css'

export default function Footer() {
  const location = useLocation()

  // Do not show the footer on application/console pages (Desk, Positions, Audit, Setup, Docs)
  if (location.pathname !== '/') {
    return null
  }

  return (
    <footer className="footer" role="contentinfo">
      {/* Cta69 Integrated Marquee Section */}
      <Cta69
        badge={{ label: 'Canton / Daml Protocol' }}
        heading="Private real-world assets on Canton."
        button={{
          label: 'Open Desk',
          href: '/app',
        }}
        labels={{
          marqueePhrase: 'Private RWA · Canton',
          note: 'Issue, transfer, and settle institutional assets across trusted counterparties with need-to-know confidentiality enforced directly at the ledger.',
          footnote: 'Zero public ledger leakages · Deterministic audit trails for designated observers.',
        }}
      />

      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Tacet home">
              <span className="footer-logo-mark">T</span>
              <span>Tacet</span>
            </Link>
            <p className="footer-tagline">
              Private RWA infrastructure on Canton.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-group">
              <p className="footer-group-label">Application</p>
              <Link to="/app"       className="footer-link">Desk</Link>
              <Link to="/positions" className="footer-link">Positions</Link>
              <Link to="/audit"     className="footer-link">Audit</Link>
            </div>
            <div className="footer-group">
              <p className="footer-group-label">Resources</p>
              <Link to="/setup" className="footer-link">Setup</Link>
              <Link to="/docs"  className="footer-link">Docs</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            Built for HackCanton — Track 1: Real-World Assets &amp; Business Workflows
          </p>
          <p className="footer-tech">
            <span>Daml</span>
            <span className="footer-sep">·</span>
            <span>Canton</span>
            <span className="footer-sep">·</span>
            <span>MIT License</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
