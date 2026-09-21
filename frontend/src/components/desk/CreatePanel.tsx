import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import type { RwaUnit } from '../../lib/types'
import './Panel.css'

interface CreatePanelProps {
  onCreated?: (unit: RwaUnit) => void
}

export default function CreatePanel({ onCreated }: CreatePanelProps) {
  const [assetRef,    setAssetRef]    = useState('')
  const [amount,      setAmount]      = useState('')
  const [currency,    setCurrency]    = useState('USD')
  const [description, setDescription] = useState('')
  const [submitted,   setSubmitted]   = useState(false)
  const [loading,     setLoading]     = useState(false)

  function handleCreate() {
    if (!assetRef || !amount) return
    setLoading(true)
    setTimeout(() => {
      const unit: RwaUnit = {
        id: `contract-${Date.now()}`,
        assetRef,
        amount: parseFloat(amount),
        currency,
        status: 'Draft',
        issuer: 'issuer::demo',
        holder: 'holder::demo',
        observer: 'observer::demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description,
      }
      setSubmitted(true)
      setLoading(false)
      onCreated?.(unit)
    }, 1200)
  }

  if (submitted) {
    return (
      <Card className="panel-card panel-card--success">
        <div className="panel-success">
          <div className="panel-success-icon" aria-hidden="true">✓</div>
          <h3 className="panel-success-title">Unit Created</h3>
          <p className="panel-success-text">
            RWA unit <code className="font-mono text-accent">{assetRef}</code> has been created on the ledger as a <Badge variant="Draft">Draft</Badge>
          </p>
          <p className="panel-success-hint">
            Next: use the Status panel to issue the unit.
          </p>
          <Button
            variant="ghost"
            onClick={() => { setSubmitted(false); setAssetRef(''); setAmount(''); setDescription('') }}
          >
            Create another
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="panel-card">
      <div className="panel-header">
        <span className="panel-step">Step 1</span>
        <h3 className="panel-title">Create Unit</h3>
        <p className="panel-desc">
          Issue a new RWA record to the Canton ledger. The unit will begin in <Badge variant="Draft">Draft</Badge> status.
        </p>
      </div>

      <div className="panel-fields">
        <Input
          label="Asset Reference"
          placeholder="e.g. INV-2024-0001"
          value={assetRef}
          onChange={e => setAssetRef(e.target.value)}
          id="create-asset-ref"
        />
        <div className="panel-row">
          <Input
            label="Amount"
            placeholder="250000"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            id="create-amount"
          />
          <div className="input-group">
            <label className="input-label" htmlFor="create-currency">Currency</label>
            <select
              id="create-currency"
              className="input-field"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CHF">CHF</option>
            </select>
          </div>
        </div>
        <Input
          label="Description (optional)"
          placeholder="Trade finance invoice — commodity shipment"
          value={description}
          onChange={e => setDescription(e.target.value)}
          id="create-description"
        />
      </div>

      <div className="panel-action">
        <Button
          variant="primary"
          size="md"
          onClick={handleCreate}
          disabled={!assetRef || !amount || loading}
          id="create-submit"
        >
          {loading ? 'Submitting…' : 'Create Unit →'}
        </Button>
        <span className="panel-hint">Calls Daml <code className="font-mono text-accent">Create</code> choice</span>
      </div>
    </Card>
  )
}
