import { useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import type { RwaStatus } from '../../lib/types'
import './Panel.css'

interface StatusPanelProps {
  currentStatus?: RwaStatus
}

const transitions: Record<string, { next: RwaStatus; choice: string; label: string }[]> = {
  Draft:  [{ next: 'Issued', choice: 'Issue', label: 'Issue Unit' }],
  Issued: [{ next: 'Active', choice: 'Activate', label: 'Activate' }],
  Active: [],
}

export default function StatusPanel({ currentStatus = 'Draft' }: StatusPanelProps) {
  const [status, setStatus]   = useState<RwaStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [log, setLog]         = useState<string[]>([])

  function transition(next: RwaStatus, choice: string) {
    setLoading(true)
    setTimeout(() => {
      setLog(l => [`${new Date().toLocaleTimeString()} — ${choice} → ${next}`, ...l])
      setStatus(next)
      setLoading(false)
    }, 900)
  }

  const available = transitions[status] ?? []

  return (
    <Card className="panel-card">
      <div className="panel-header">
        <span className="panel-step">Step 2</span>
        <h3 className="panel-title">Update Status</h3>
        <p className="panel-desc">
          Progress the unit through its lifecycle. Only the issuer may change status.
        </p>
      </div>

      {/* Status track */}
      <div className="status-track">
        {(['Draft', 'Issued', 'Active'] as RwaStatus[]).map((s, i, arr) => (
          <div key={s} className="status-track-item">
            <div className={`status-node ${status === s ? 'status-node--active' : ''} ${isCompleted(s, status) ? 'status-node--done' : ''}`} aria-label={s}>
              {isCompleted(s, status) ? '✓' : i + 1}
            </div>
            <span className="status-track-label">{s}</span>
            {i < arr.length - 1 && (
              <div className={`status-track-line ${isCompleted(arr[i + 1], status) || status === arr[i + 1] ? 'status-track-line--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="panel-status-row">
        <span className="panel-hint">Current status</span>
        <Badge variant={status} dot>{status}</Badge>
      </div>

      <div className="panel-action">
        {available.length > 0 ? (
          available.map(({ next, choice, label }) => (
            <Button
              key={choice}
              variant="primary"
              onClick={() => transition(next, choice)}
              disabled={loading}
              id={`status-${choice.toLowerCase()}`}
            >
              {loading ? 'Updating…' : `${label} →`}
            </Button>
          ))
        ) : (
          <p className="panel-hint text-accent">
            ✓ Unit is {status}. No further status changes available.
          </p>
        )}
        {available[0] && (
          <span className="panel-hint">
            Calls Daml <code className="font-mono text-accent">{available[0].choice}</code> choice
          </span>
        )}
      </div>

      {log.length > 0 && (
        <div className="panel-log">
          {log.map((entry, i) => (
            <div key={i} className="panel-log-entry">{entry}</div>
          ))}
        </div>
      )}
    </Card>
  )
}

function isCompleted(s: RwaStatus, current: RwaStatus): boolean {
  const order: RwaStatus[] = ['Draft', 'Issued', 'Active', 'Transferred', 'Fulfilled']
  return order.indexOf(s) < order.indexOf(current)
}
