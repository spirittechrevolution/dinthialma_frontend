import { CotisationStatut, MembreInfo, ValideurInfo } from './common'

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
