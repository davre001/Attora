import type { Role } from '../../lib/types'
import './RoleSwitch.css'

interface RoleSwitchProps {
  active: Role
  onChange: (role: Role) => void
}

const roles: { id: Role; label: string; desc: string }[] = [
  { id: 'Issuer',   label: 'Issuer',   desc: 'Create · Issue · Activate' },
  { id: 'Holder',   label: 'Holder',   desc: 'Accept · Fulfill'          },
  { id: 'Observer', label: 'Observer', desc: 'Audit · Report'            },
]

export default function RoleSwitch({ active, onChange }: RoleSwitchProps) {
  return (
    <div className="role-switch" role="tablist" aria-label="Select role">
      {roles.map(({ id, label, desc }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          className={`role-tab ${active === id ? 'role-tab--active' : ''}`}
          onClick={() => onChange(id)}
          id={`role-tab-${id.toLowerCase()}`}
        >
          <span className="role-tab-label">{label}</span>
          <span className="role-tab-desc">{desc}</span>
        </button>
      ))}
    </div>
  )
}
