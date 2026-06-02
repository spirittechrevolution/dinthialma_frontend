import { CotisationStatut, MembreInfo, ValideurInfo } from './common'

// ─── Qui a enregistré la cotisation ──────────────────────────────────────────
export interface EnregistreParInfo {
  id: string
  firstName: string
  lastName: string
  phone: string
}

// ─── Réponse cotisation ───────────────────────────────────────────────────────
export interface Cotisation {
  id: string
  tontineId: string
  cycleId: string
  membre: MembreInfo
  montant: number
  methodePaiement: string
  referenceTransaction?: string
  statut: CotisationStatut
  note?: string
  dateValidation?: string
  validePar?: ValideurInfo
  enregistrePar?: EnregistreParInfo
  createdAt: string
  updatedAt: string
}

// ─── Requête enregistrement cotisation (par le membre) ────────────────────────
export interface RecordCotisationRequest {
  cycleId: string
  montant: number
  methodePaiement?: string
  referenceTransaction?: string
  note?: string
}

// ─── Requête enregistrement admin d'une cotisation ───────────────────────────
export interface AdminRecordCotisationRequest {
  membreId: string
  cycleId: string
  montant: number
  methodePaiement?: string
  referenceTransaction?: string
  note?: string
}
