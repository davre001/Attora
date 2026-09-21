import Page from '../components/layout/Page'
import Card from '../components/ui/Card'
import './Docs.css'

const templateFields = [
  { name: 'issuer',    type: 'Party',  desc: 'Creates and issues the unit' },
  { name: 'holder',   type: 'Party',  desc: 'Accepts transfers and fulfills' },
  { name: 'observer', type: 'Party',  desc: 'Read-only audit access' },
  { name: 'assetRef', type: 'Text',   desc: 'External reference (invoice, fund, receipt)' },
  { name: 'amount',   type: 'Decimal',desc: 'Unit value (kept private from Observer)' },
  { name: 'currency', type: 'Text',   desc: 'ISO 4217 currency code' },
  { name: 'status',   type: 'Status', desc: 'Draft | Issued | Active | Transferred | Fulfilled' },
]

const choices = [
  { name: 'Create',    controller: 'Issuer',       desc: 'Record a new RWA unit on the ledger in Draft status.' },
  { name: 'Issue',     controller: 'Issuer',       desc: 'Advance status from Draft to Issued.' },
  { name: 'Activate',  controller: 'Issuer',       desc: 'Advance status from Issued to Active.' },
  { name: 'Transfer',  controller: 'Issuer/Holder', desc: 'Propose a holder transfer. New holder must accept.' },
  { name: 'Fulfill',   controller: 'Holder',       desc: 'Mark the unit settled. Lifecycle is closed.' },
]

const partyMap = [
  { role: 'Issuer',   sees: 'Full payload',                  can: 'Create, Issue, Activate, Transfer' },
  { role: 'Holder',   sees: 'Full payload',                  can: 'Accept Transfer, Fulfill' },
  { role: 'Observer', sees: 'Status, assetRef, timestamps',  can: 'Query only' },
]

const sections = [
  {
    id: 'brief',
    title: 'Brief',
    content: (
      <div className="docs-prose">
        <p>
          <strong>Tacet</strong> is a private RWA workflow on Canton. It is not a DeFi protocol,
          not a public-chain confidential-order system, and not a token faucet.
        </p>
        <p>
          The ICP is an operations lead at a mid-market issuer — trade-finance desk, fund admin, or commodity registrar —
          that already issues paper units and cannot put size on a public chain.
        </p>
        <p>
          <strong>Who pays.</strong> The issuer (workflow fee per live unit or monthly pilot).
          Holder is invited. Observer is included so the pilot can close.
        </p>
        <p>
          <strong>Why Canton.</strong> Shared workflow across firms with need-to-know data.
          Same reason institutions use Canton: coordination without a public book.
        </p>
      </div>
    ),
  },
  {
    id: 'pilot',
    title: 'Pilot Plan',
    content: (
      <div className="docs-steps">
        <div className="docs-step">
          <span className="docs-step-num">1</span>
          <div>
            <h4>Internal Dry Run</h4>
            <p>One issuer party, one holder party, ten test units on Canton DevNet. Integrations: Daml model + Tacet UI + party IDs.</p>
          </div>
        </div>
        <div className="docs-step">
          <span className="docs-step-num">2</span>
          <div>
            <h4>Auditor Pass</h4>
            <p>Add observer party; export status report. Integration: observer-authorized ledger query.</p>
          </div>
        </div>
        <div className="docs-step">
          <span className="docs-step-num">3</span>
          <div>
            <h4>Post-Pilot (not MVP)</h4>
            <p>Map assetRef to one real registrar or custodian system off-ledger.</p>
          </div>
        </div>
      </div>
    ),
  },
]

export default function Docs() {
  return (
    <Page>
      <div className="container">
        <header className="page-header">
          <div>
            <div className="section-label">Reference</div>
            <h1 className="page-title">Documentation</h1>
            <p className="page-sub">
              Brief, pilot steps, template schema, choices, and party map.
            </p>
          </div>
        </header>

        <div className="docs-layout">
          {/* Sidebar nav */}
          <nav className="docs-sidebar" aria-label="Documentation sections">
            {['brief', 'pilot', 'template', 'choices', 'parties'].map(id => (
              <a key={id} href={`#docs-${id}`} className="docs-sidebar-link">
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </nav>

          {/* Content */}
          <div className="docs-content">
            {/* Brief + Pilot */}
            {sections.map(({ id, title, content }) => (
              <section key={id} id={`docs-${id}`} className="docs-section">
                <h2 className="docs-section-title">{title}</h2>
                {content}
              </section>
            ))}

            {/* Template */}
            <section id="docs-template" className="docs-section">
              <h2 className="docs-section-title">Template — RwaUnit</h2>
              <div className="docs-code-header">
                <code className="font-mono text-accent text-sm">Tacet.RwaUnit</code>
              </div>
              <div className="docs-table-wrapper">
                <table className="docs-table" aria-label="Template fields">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateFields.map(f => (
                      <tr key={f.name}>
                        <td><code className="font-mono text-accent text-sm">{f.name}</code></td>
                        <td><span className="docs-type">{f.type}</span></td>
                        <td className="docs-desc-cell">{f.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Choices */}
            <section id="docs-choices" className="docs-section">
              <h2 className="docs-section-title">Daml Choices</h2>
              <div className="docs-choices">
                {choices.map(c => (
                  <div key={c.name} className="docs-choice">
                    <div className="docs-choice-header">
                      <code className="font-mono text-accent">{c.name}</code>
                      <span className="docs-choice-controller">{c.controller}</span>
                    </div>
                    <p className="docs-choice-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Party map */}
            <section id="docs-parties" className="docs-section">
              <h2 className="docs-section-title">Party Map</h2>
              <div className="docs-table-wrapper">
                <table className="docs-table" aria-label="Party map">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Sees</th>
                      <th>Can Do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyMap.map(p => (
                      <tr key={p.role}>
                        <td><span className="docs-role">{p.role}</span></td>
                        <td className="docs-desc-cell">{p.sees}</td>
                        <td className="docs-desc-cell">{p.can}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Page>
  )
}
