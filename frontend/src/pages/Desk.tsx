import { useState } from 'react'
import Page from '../components/layout/Page'
import RoleSwitch from '../components/desk/RoleSwitch'
import CreatePanel from '../components/desk/CreatePanel'
import StatusPanel from '../components/desk/StatusPanel'
import TransferPanel from '../components/desk/TransferPanel'
import FulfillPanel from '../components/desk/FulfillPanel'
import Badge from '../components/ui/Badge'
import type { Role } from '../lib/types'
import './Desk.css'

const OBSERVER_STEPS = [
  { label: 'Create',   desc: 'Not available to Observer' },
  { label: 'Status',   desc: 'Not available to Observer' },
  { label: 'Transfer', desc: 'Not available to Observer' },
  { label: 'Fulfill',  desc: 'Not available to Observer' },
]

export default function Desk() {
  const [role, setRole] = useState<Role>('Issuer')

  return (
    <Page>
      <div className="container">
        <header className="desk-header">
          <div>
            <div className="section-label">Application</div>
            <h1 className="desk-title">The Desk</h1>
            <p className="desk-sub">
              Step through the RWA lifecycle. Switch role to act as a different Canton party.
            </p>
          </div>
          <div className="desk-status-pill">
            <span className="desk-status-dot" aria-hidden="true" />
            <span>Canton DevNet</span>
          </div>
        </header>

        <RoleSwitch active={role} onChange={setRole} />

        {/* Active role context */}
        <div className="desk-context">
          <span className="desk-context-label">Acting as</span>
          <span className="desk-context-role">{role}</span>
          <span className="desk-context-sep">·</span>
          <span className="desk-context-hint">
            {role === 'Issuer'   && 'You can create units and update status.'}
            {role === 'Holder'   && 'You can accept transfers and mark units fulfilled.'}
            {role === 'Observer' && 'Read-only access. Use the Audit page for reports.'}
          </span>
        </div>

        {role === 'Observer' ? (
          <div className="desk-observer-notice">
            <div className="desk-observer-icon" aria-hidden="true">◈</div>
            <div>
              <h2 className="desk-observer-title">Observer Access</h2>
              <p className="desk-observer-desc">
                The Observer role provides read-only access to lifecycle events. No ledger writes are available.
                Navigate to the <a href="/audit" className="text-accent">Audit page</a> to pull reports.
              </p>
              <div className="desk-observer-steps">
                {OBSERVER_STEPS.map(({ label }) => (
                  <div key={label} className="desk-observer-step">
                    <span className="desk-observer-step-label">{label}</span>
                    <Badge variant="neutral">Restricted</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="desk-panels">
            {/* Issuer panels */}
            {role === 'Issuer' && (
              <>
                <CreatePanel />
                <StatusPanel />
              </>
            )}
            {/* Holder panels */}
            {role === 'Holder' && (
              <>
                <TransferPanel />
                <FulfillPanel />
              </>
            )}
          </div>
        )}

        {/* Workflow strip */}
        <div className="desk-flow-strip">
          {['Create', 'Status', 'Transfer', 'Fulfill', 'Audit'].map((step, i, arr) => (
            <div key={step} className="desk-flow-item">
              <span className={`desk-flow-label ${
                (role === 'Issuer'   && (step === 'Create'   || step === 'Status'))   ? 'desk-flow-label--active' :
                (role === 'Holder'   && (step === 'Transfer' || step === 'Fulfill'))  ? 'desk-flow-label--active' :
                (role === 'Observer' && step === 'Audit')                             ? 'desk-flow-label--active' :
                ''
              }`}>{step}</span>
              {i < arr.length - 1 && <span className="desk-flow-arrow" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}
