import { TontineStatut, ModeCycle, CreateurInfo } from './common'

// ─── Type de tontine ──────────────────────────────────────────────────────────
export enum TontineType {
  ROTATIVE       = 'ROTATIVE',
  EVENEMENTIELLE = 'EVENEMENTIELLE',
}

// ─── Réponse tontine ──────────────────────────────────────────────────────────
export interface Tontine {
  id: string
  tontineType: TontineType
  nom: string
  description?: string
  montant: number
  frequence: string
  /** null pour EVENEMENTIELLE */
  ordreBeneficiaire?: string | null
  /** null pour EVENEMENTIELLE */
  modeCycle?: ModeCycle | null
  dateDebut: string
  nombreMembres: number
  nombreMembresActuels: number
  /** Nombre de gagnants par cycle — 1 = comportement classique */
  nombreGagnants: number
  statut: TontineStatut
  // ── Champs EVENEMENTIELLE ───────────────────────────────────────────────────
  dateEcheance?: string | null
  nomEvenement?: string | null
  montantLibre?: boolean | null
  montantMinimum?: number | null
  creePar: CreateurInfo
  createdAt: string
  updatedAt: string
}

// ─── Requête création ─────────────────────────────────────────────────────────
export interface CreateTontineRequest {
  tontineType: TontineType
  nom: string
  description?: string
  frequence: string
  dateDebut: string
  // ROTATIVE uniquement
  montant?: number
  ordreBeneficiaire?: string
  modeCycle?: ModeCycle
  nombreMembres?: number
  nombreGagnants?: number
  // EVENEMENTIELLE uniquement
  dateEcheance?: string
  nomEvenement?: string
  montantLibre?: boolean
  montantMinimum?: number
}

// ─── Requête mise à jour ──────────────────────────────────────────────────────
export interface UpdateTontineRequest {
  nom?: string
  description?: string
  montant?: number
  frequence?: string
  ordreBeneficiaire?: string
  dateDebut?: string
  nombreMembres?: number
  nombreGagnants?: number
}

// ─── Commission ───────────────────────────────────────────────────────────────
export interface Commission {
  id: string
  tontineId: string
  type: 'POURCENTAGE_JACKPOT' | 'FRAIS_FIXES_PAR_CYCLE' | 'FRAIS_ADHESION'
  valeur: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommissionRequest {
  type: 'POURCENTAGE_JACKPOT' | 'FRAIS_FIXES_PAR_CYCLE' | 'FRAIS_ADHESION'
  valeur: number
  description?: string
}

export interface UpdateCommissionRequest {
  valeur?: number
  description?: string
}
