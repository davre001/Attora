import { useState } from 'react'
import Page from '../components/layout/Page'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import './Setup.css'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export default function Setup() {
  const [participantUrl, setParticipantUrl] = useState('http://localhost:7575')
  const [issuerPartyId,  setIssuerPartyId]  = useState('')
  const [holderPartyId,  setHolderPartyId]  = useState('')
  const [observerPartyId, setObserverPartyId] = useState('')
  const [status, setStatus] = useState<ConnectionStatus>('idle')

  function handleConnect() {
    setStatus('connecting')
    setTimeout(() => {
      // Mock: fail if URL is empty
      if (!participantUrl) {
        setStatus('error')
      } else {
        setStatus('connected')
      }
    }, 1400)
  }

  return (
    <Page>
      <div className="container">
        <header className="page-header">
          <div>
            <div className="section-label">Configuration</div>
            <h1 className="page-title">Setup</h1>
            <p className="page-sub">
              Connect to a Canton participant and configure party identifiers.
              This is not a token faucet.
            </p>
          </div>
        </header>

        <div className="setup-grid">
          {/* Connection */}
          <Card className="setup-card">
            <div className="setup-card-header">
              <h2 className="setup-card-title">Participant Connection</h2>
              <div className={`setup-status-indicator setup-status-indicator--${status}`} aria-label={`Connection status: ${status}`}>
                <span className="setup-status-dot" />
                <span className="setup-status-label">
                  {status === 'idle'       && 'Not connected'}
                  {status === 'connecting' && 'Connecting…'}
                  {status === 'connected'  && 'Connected'}
                  {status === 'error'      && 'Error'}
                </span>
              </div>
            </div>

            <div className="setup-fields">
              <Input
                label="Participant URL"
                placeholder="http://localhost:7575"
                value={participantUrl}
                onChange={e => setParticipantUrl(e.target.value)}
                id="setup-participant-url"
                hint="Canton JSON API endpoint"
              />
            </div>

            <div className="setup-action">
              <Button
                variant="primary"
                onClick={handleConnect}
                disabled={status === 'connecting' || status === 'connected'}
                id="setup-connect-btn"
              >
                {status === 'connecting' ? 'Connecting…' :
                 status === 'connected'  ? '✓ Connected' :
                 'Connect Participant →'}
              </Button>
              {status === 'connected' && (
                <Button variant="ghost" size="sm" onClick={() => setStatus('idle')}>
                  Disconnect
                </Button>
              )}
            </div>

            {status === 'error' && (
              <div className="setup-error-banner">
                Could not reach the participant. Check the URL and try again.
              </div>
            )}
          </Card>

          {/* Parties */}
          <Card className="setup-card">
            <div className="setup-card-header">
              <h2 className="setup-card-title">Party Identifiers</h2>
              <span className="setup-hint-tag">Canton party IDs</span>
            </div>

            <div className="setup-fields">
              <Input
                label="Issuer Party ID"
                placeholder="issuer::12209f2a3b…"
                value={issuerPartyId}
                onChange={e => setIssuerPartyId(e.target.value)}
                id="setup-issuer-id"
                hint="Party that creates and issues RWA units"
              />
              <Input
                label="Holder Party ID"
                placeholder="holder::2345b6c7d8…"
                value={holderPartyId}
                onChange={e => setHolderPartyId(e.target.value)}
                id="setup-holder-id"
                hint="Party that accepts transfers and fulfills"
              />
              <Input
                label="Observer Party ID"
                placeholder="observer::3456c7d8e9…"
                value={observerPartyId}
                onChange={e => setObserverPartyId(e.target.value)}
                id="setup-observer-id"
                hint="Party with read-only audit access"
              />
            </div>

            <div className="setup-action">
              <Button
                variant="secondary"
                id="setup-save-parties"
                onClick={() => {}}
              >
                Save Configuration
              </Button>
            </div>
          </Card>

          {/* Info */}
          <Card className="setup-info-card">
            <h2 className="setup-card-title">Quick Start</h2>
            <div className="setup-steps">
              <div className="setup-step">
                <span className="setup-step-num">1</span>
                <div>
                  <p className="setup-step-label">Deploy Daml model</p>
                  <code className="setup-step-code">cd daml && daml build && daml start</code>
                </div>
              </div>
              <div className="setup-step">
                <span className="setup-step-num">2</span>
                <div>
                  <p className="setup-step-label">Allocate parties</p>
                  <code className="setup-step-code">bash scripts/allocate-parties.sh</code>
                </div>
              </div>
              <div className="setup-step">
                <span className="setup-step-num">3</span>
                <div>
                  <p className="setup-step-label">Connect participant</p>
                  <p className="setup-step-desc">Paste the participant URL and party IDs above.</p>
                </div>
              </div>
              <div className="setup-step">
                <span className="setup-step-num">4</span>
                <div>
                  <p className="setup-step-label">Open the Desk</p>
                  <p className="setup-step-desc">Run the full RWA lifecycle from the Desk page.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
