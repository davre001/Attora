import type { RwaStatus } from '../../lib/types'
import './Badge.css'

type BadgeVariant = RwaStatus | 'neutral' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
}

const variantMap: Record<BadgeVariant, string> = {
  Draft:       'badge--draft',
  Issued:      'badge--issued',
  Active:      'badge--active',
  Fulfilled:   'badge--fulfilled',
  Transferred: 'badge--transferred',
  neutral:     'badge--neutral',
  info:        'badge--info',
}

export default function Badge({ variant = 'neutral', children, dot = false }: BadgeProps) {
  return (
    <span className={`badge ${variantMap[variant]}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}
