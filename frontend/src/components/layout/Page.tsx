import type { ReactNode } from 'react'
import WavesBackground from '../ui/WavesBackground'
import './Page.css'

interface PageProps {
  children: ReactNode
  className?: string
}

export default function Page({ children, className = '' }: PageProps) {
  return (
    <main className={`page ${className}`} role="main">
      <WavesBackground opacity={0.10} />
      {children}
    </main>
  )
}
