import { TontineStatut, ModeCycle, CreateurInfo } from './common'

// ─── Réponse tontine ──────────────────────────────────────────────────────────
export interface Tontine {
  id: string
  nom: string
  description?: string
  montant: number
  frequence: string
  ordreBeneficiaire: string
  modeCycle: ModeCycle
  dateDebut: string
  nombreMembres: number
  nombreMembresActuels: number
  /** Nombre de gagnants par cycle — 1 = comportement classique */
  nombreGagnants: number
  statut: TontineStatut
  creePar: CreateurInfo
  createdAt: string
  updatedAt: string
}

// ─── Requête création ─────────────────────────────────────────────────────────
export interface CreateTontineRequest {
  nom: string
  description?: string
  montant: number
  frequence: string
  ordreBeneficiaire: string
  modeCycle: ModeCycle
  dateDebut: string
  nombreMembres: number
  /** min 1, défaut 1 */
  nombreGagnants: number
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
