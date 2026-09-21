import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import './Panel.css'

export default function FulfillPanel() {
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  function handleFulfill() {
    setLoading(true)
    setTimeout(() => {
      setDone(true)
      setLoading(false)
    }, 900)
  }

  if (done) {
    return (
      <Card className="panel-card panel-card--success">
        <div className="panel-success">
          <div className="panel-success-icon">✓</div>
          <h3 className="panel-success-title">Unit Fulfilled</h3>
          <p className="panel-success-text">
            The RWA unit has been settled and marked as <Badge variant="Fulfilled">Fulfilled</Badge>.
            The lifecycle is complete.
          </p>
          <p className="panel-success-hint">
            An audit record is now available to the Observer.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="panel-card">
      <div className="panel-header">
        <span className="panel-step">Step 4</span>
        <h3 className="panel-title">Fulfill</h3>
        <p className="panel-desc">
          Mark the unit as settled and fulfilled. This closes the lifecycle on the ledger.
        </p>
      </div>

      <div className="panel-fields">
        <Input
          label="Settlement Note (optional)"
          placeholder="Payment received — ref TXN-0091"
          value={note}
          onChange={e => setNote(e.target.value)}
          id="fulfill-note"
        />
      </div>

      <div className="panel-action">
        <Button
          variant="primary"
          onClick={handleFulfill}
          disabled={loading}
          id="fulfill-submit"
        >
          {loading ? 'Submitting…' : 'Mark Fulfilled →'}
        </Button>
        <span className="panel-hint">
          Calls Daml <code className="font-mono text-accent">Fulfill</code> choice
        </span>
      </div>
    </Card>
  )
}
