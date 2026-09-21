import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import './Panel.css'

export default function TransferPanel() {
  const [holderParty, setHolderParty] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [done,        setDone]        = useState(false)

  function handleTransfer() {
    if (!holderParty) return
    setLoading(true)
    setTimeout(() => {
      setDone(true)
      setLoading(false)
    }, 1100)
  }

  if (done) {
    return (
      <Card className="panel-card panel-card--success">
        <div className="panel-success">
          <div className="panel-success-icon">✓</div>
          <h3 className="panel-success-title">Transfer Initiated</h3>
          <p className="panel-success-text">
            Transfer proposed to <code className="font-mono text-accent">{holderParty}</code>.
            Status is now <Badge variant="Transferred">Transferred</Badge>
          </p>
          <p className="panel-success-hint">
            The new holder must accept on the Canton ledger.
          </p>
          <Button variant="ghost" onClick={() => { setDone(false); setHolderParty('') }}>
            Transfer again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="panel-card">
      <div className="panel-header">
        <span className="panel-step">Step 3</span>
        <h3 className="panel-title">Transfer</h3>
        <p className="panel-desc">
          Propose a transfer to a new holder party. The holder must accept to complete the handoff.
        </p>
      </div>

      <div className="panel-fields">
        <Input
          label="New Holder Party ID"
          placeholder="holder::12209f2a3b…"
          value={holderParty}
          onChange={e => setHolderParty(e.target.value)}
          id="transfer-holder-party"
          hint="Canton party identifier for the receiving party"
        />
      </div>

      <div className="panel-action">
        <Button
          variant="primary"
          onClick={handleTransfer}
          disabled={!holderParty || loading}
          id="transfer-submit"
        >
          {loading ? 'Submitting…' : 'Propose Transfer →'}
        </Button>
        <span className="panel-hint">
          Calls Daml <code className="font-mono text-accent">Transfer</code> choice
        </span>
      </div>
    </Card>
  )
}
