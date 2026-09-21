import { useState } from 'react'
import Page from '../components/layout/Page'
import Badge from '../components/ui/Badge'
import { mockAuditEvents } from '../lib/mock'
import type { AuditEvent } from '../lib/types'
import './Audit.css'

const EVENT_COLORS: Record<AuditEvent['eventType'], string> = {
  Created:     'audit-event--created',
  Issued:      'audit-event--issued',
  Activated:   'audit-event--activated',
  Transferred: 'audit-event--transferred',
  Fulfilled:   'audit-event--fulfilled',
}

const EVENT_BADGE: Record<AuditEvent['eventType'], AuditEvent['eventType']> = {
  Created:     'Created',
  Issued:      'Issued',
  Activated:   'Activated',
  Transferred: 'Transferred',
  Fulfilled:   'Fulfilled',
}

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const uniqueRefs = [...new Set(mockAuditEvents.map(e => e.assetRef))]

export default function Audit() {
  const [ref, setRef] = useState<string>('All')

  const events = ref === 'All'
    ? mockAuditEvents
    : mockAuditEvents.filter(e => e.assetRef === ref)

  return (
    <Page>
      <div className="container">
        <header className="page-header">
          <div>
            <div className="section-label">Observer Report</div>
            <h1 className="page-title">Audit</h1>
            <p className="page-sub">
              Lifecycle events for units visible to the Observer party.
              Commercial terms are not exposed.
            </p>
          </div>
          <div className="audit-badge-row">
            <span className="audit-role-pill">Observer</span>
            <span className="audit-read-only">Read-only</span>
          </div>
        </header>

        {/* Asset filter */}
        <div className="audit-filters" role="group" aria-label="Filter by asset reference">
          <button
            className={`filter-btn ${ref === 'All' ? 'filter-btn--active' : ''}`}
            onClick={() => setRef('All')}
            id="audit-filter-all"
          >
            All
          </button>
          {uniqueRefs.map(r => (
            <button
              key={r}
              className={`filter-btn ${ref === r ? 'filter-btn--active' : ''}`}
              onClick={() => setRef(r)}
              id={`audit-filter-${r}`}
            >
              <code className="font-mono">{r}</code>
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="audit-stats">
          {(['Created', 'Issued', 'Activated', 'Transferred', 'Fulfilled'] as AuditEvent['eventType'][]).map(type => {
            const count = events.filter(e => e.eventType === type).length
            return (
              <div key={type} className="audit-stat">
                <span className="audit-stat-num font-display">{count}</span>
                <span className="audit-stat-label">{type}</span>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div className="audit-timeline" aria-label="Audit event timeline">
          {events.map(evt => (
            <div
              key={evt.id}
              className={`audit-event ${EVENT_COLORS[evt.eventType]}`}
              id={`audit-event-${evt.id}`}
            >
              <div className="audit-event-track">
                <div className="audit-event-dot" aria-hidden="true" />
                <div className="audit-event-line" aria-hidden="true" />
              </div>
              <div className="audit-event-content">
                <div className="audit-event-header">
                  <div className="audit-event-type">{evt.eventType}</div>
                  <div className="audit-event-ref">
                    <code className="font-mono text-sm">{evt.assetRef}</code>
                  </div>
                  <span className="audit-event-time">{fmtDateTime(evt.timestamp)}</span>
                </div>
                <div className="audit-event-meta">
                  <span className="audit-event-party">Party: {evt.party}</span>
                  {evt.note && (
                    <span className="audit-event-note">{evt.note}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="audit-empty">
            <p>No events found for the selected filter.</p>
          </div>
        )}

        <div className="audit-footer-note">
          <span>Observer sees: status, timestamps, asset reference — not amounts or commercial terms.</span>
        </div>
      </div>
    </Page>
  )
}
