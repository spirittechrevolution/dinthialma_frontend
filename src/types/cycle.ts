import { CycleStatut } from './common'

// ─── Gagnant jackpot (multi-gagnants) ────────────────────────────────────────
export interface GagnantInfo {
  membreId: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  /** null en mode MANUEL sans ordre défini */
  ordreJackpot: number | null
  /** montantNet / nombreGagnants — null si non encore calculé */
  montantRecu: number | null
  /** null si cycle clôturé avant la feature */
  dateJackpot: string | null
}

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
  /** Remplace l'ancien champ beneficiaire — liste des gagnants */
  gagnants?: GagnantInfo[]
  createdAt: string
  updatedAt: string
}

// ─── Requête ouverture manuelle ───────────────────────────────────────────────
// beneficiaireId supprimé (point 6 du prompt)
export interface OpenCycleRequest {
  dateDebut: string
  dateFin: string
}

// ─── Requête désignation gagnants (MANUEL uniquement) ────────────────────────
export interface DesignerGagnantsRequest {
  /** null/[] = sélection aléatoire par le backend */
  membreIds?: string[]
}
