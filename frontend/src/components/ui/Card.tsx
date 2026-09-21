import type { ReactNode } from 'react'
import './Card.css'

interface CardProps {
  children: ReactNode
  className?: string
  accent?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export default function Card({ children, className = '', accent = false, onClick, style }: CardProps) {
  return (
    <div
      className={`card ${accent ? 'card--accent' : ''} ${onClick ? 'card--interactive' : ''} ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}
