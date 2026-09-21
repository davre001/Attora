export type RwaStatus = 'Draft' | 'Issued' | 'Active' | 'Fulfilled' | 'Transferred'
export type Role = 'Issuer' | 'Holder' | 'Observer'

export interface RwaUnit {
  id: string
  assetRef: string
  amount: number
  currency: string
  status: RwaStatus
  issuer: string
  holder: string
  observer: string
  createdAt: string
  updatedAt: string
  description?: string
}

export interface AuditEvent {
  id: string
  unitId: string
  assetRef: string
  eventType: 'Created' | 'Issued' | 'Activated' | 'Transferred' | 'Fulfilled'
  timestamp: string
  party: string
  note?: string
}

export interface Party {
  id: string
  displayName: string
  role: Role
}

export interface ConnectionConfig {
  participantUrl: string
  issuerPartyId: string
  holderPartyId: string
  observerPartyId: string
}
