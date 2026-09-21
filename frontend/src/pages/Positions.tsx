import { useState } from 'react'
import Page from '../components/layout/Page'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { mockUnits } from '../lib/mock'
import type { RwaUnit, RwaStatus } from '../lib/types'
import './Positions.css'

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusFilters: { label: string; value: RwaStatus | 'All' }[] = [
  { label: 'All',         value: 'All' },
  { label: 'Draft',       value: 'Draft' },
  { label: 'Issued',      value: 'Issued' },
  { label: 'Active',      value: 'Active' },
  { label: 'Transferred', value: 'Transferred' },
  { label: 'Fulfilled',   value: 'Fulfilled' },
]

export default function Positions() {
  const [filter,   setFilter]   = useState<RwaStatus | 'All'>('All')
  const [selected, setSelected] = useState<RwaUnit | null>(null)

  const visible = filter === 'All'
    ? mockUnits
    : mockUnits.filter(u => u.status === filter)

  return (
    <Page>
      <div className="container">
        <header className="page-header">
          <div>
            <div className="section-label">Ledger View</div>
            <h1 className="page-title">Positions</h1>
            <p className="page-sub">
              All RWA units visible to your party on the Canton ledger.
            </p>
          </div>
          <div className="positions-count">
            <span className="positions-count-num font-display">{visible.length}</span>
            <span className="positions-count-label">units visible</span>
          </div>
        </header>

        {/* Filters */}
        <div className="positions-filters" role="group" aria-label="Filter by status">
          {statusFilters.map(({ label, value }) => (
            <button
              key={value}
              className={`filter-btn ${filter === value ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(value)}
              id={`filter-${value.toLowerCase()}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="positions-table-wrapper">
          <table className="positions-table" aria-label="RWA positions">
            <thead>
              <tr>
                <th>Asset Ref</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Issuer</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(unit => (
                <tr
                  key={unit.id}
                  className={`positions-row ${selected?.id === unit.id ? 'positions-row--selected' : ''}`}
                  onClick={() => setSelected(selected?.id === unit.id ? null : unit)}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(selected?.id === unit.id ? null : unit)}
                  aria-selected={selected?.id === unit.id}
                >
                  <td>
                    <code className="font-mono text-fg">{unit.assetRef}</code>
                  </td>
                  <td>
                    <Badge variant={unit.status} dot>{unit.status}</Badge>
                  </td>
                  <td>
                    <span className="positions-amount font-display">
                      {fmt(unit.amount, unit.currency)}
                    </span>
                  </td>
                  <td>
                    <span className="positions-party">Issuer</span>
                  </td>
                  <td>
                    <span className="positions-date">{fmtDate(unit.updatedAt)}</span>
                  </td>
                  <td>
                    <button className="positions-expand" aria-label="Expand">
                      {selected?.id === unit.id ? '↑' : '↓'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <Card className="positions-detail animate-in" accent>
            <div className="positions-detail-header">
              <div>
                <div className="section-label">Unit Detail</div>
                <h2 className="positions-detail-ref font-display">{selected.assetRef}</h2>
              </div>
              <Badge variant={selected.status} dot>{selected.status}</Badge>
            </div>

            <div className="positions-detail-grid">
              <div className="positions-detail-field">
                <span className="positions-detail-key">Amount</span>
                <span className="positions-detail-val font-display">
                  {fmt(selected.amount, selected.currency)}
                </span>
              </div>
              <div className="positions-detail-field">
                <span className="positions-detail-key">Currency</span>
                <span className="positions-detail-val">{selected.currency}</span>
              </div>
              <div className="positions-detail-field">
                <span className="positions-detail-key">Created</span>
                <span className="positions-detail-val">{fmtDate(selected.createdAt)}</span>
              </div>
              <div className="positions-detail-field">
                <span className="positions-detail-key">Updated</span>
                <span className="positions-detail-val">{fmtDate(selected.updatedAt)}</span>
              </div>
              {selected.description && (
                <div className="positions-detail-field positions-detail-field--wide">
                  <span className="positions-detail-key">Description</span>
                  <span className="positions-detail-val">{selected.description}</span>
                </div>
              )}
              <div className="positions-detail-field positions-detail-field--wide">
                <span className="positions-detail-key">Contract ID</span>
                <code className="font-mono text-sm text-accent">{selected.id}</code>
              </div>
            </div>

            <div className="positions-detail-actions">
              <Button variant="primary" size="sm" id="detail-view-desk">
                Open in Desk →
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}
