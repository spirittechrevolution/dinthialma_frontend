import { CycleStatut, BeneficiaireInfo } from './common'

// ─── Réponse cycle ────────────────────────────────────────────────────────────
export interface Cycle {
  id: string
  tontineId: string
  numeroCycle: number
  dateDebut: string
  dateFin: string
  montantJackpot?: number
  montantCommission?: number
  montantNet?: number
  statut: CycleStatut
  dateRemise?: string
  beneficiaire?: BeneficiaireInfo
  createdAt: string
  updatedAt: string
}

// ─── Requête ouverture manuelle ───────────────────────────────────────────────
export interface OpenCycleRequest {
  dateDebut: string
  dateFin: string
  beneficiaireId?: string
}
