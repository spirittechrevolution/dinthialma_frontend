import { CotisationStatut, MembreInfo, ValideurInfo, AccountStatus, MembreStatut } from './common'

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

// ─── Récap d'un cycle : une ligne par membre (GET .../cotisations/recap/{cycleId}) ─
export interface CycleRecapLigne {
  membreId: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  accountStatus?: AccountStatus
  statutMembre: MembreStatut
  ordreJackpot: number | null
  /** null = le membre n'a rien soumis pour ce cycle */
  cotisationId: string | null
  montant: number | null
  methodePaiement: string | null
  referenceTransaction?: string | null
  note?: string | null
  statutCotisation: CotisationStatut | null
  dateValidation: string | null
  cotisationCreatedAt?: string | null
  enregistrePar?: EnregistreParInfo | null
}

// ─── Total cotisé par membre (GET .../cotisations/recap-total) ─────────────────
export interface MembreTotalCotisation {
  membreId: string
  userId?: string
  firstName: string
  lastName: string
  phone: string
  accountStatus?: AccountStatus
  statutMembre: MembreStatut
  ordreJackpot: number | null
  totalCotise: number
  nombreCotisationsValidees: number
}
