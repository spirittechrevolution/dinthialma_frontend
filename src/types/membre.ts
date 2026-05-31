import { MembreStatut, UserInfo } from './common'

// ─── Réponse membre ───────────────────────────────────────────────────────────
export interface Membre {
  id: string
  tontineId: string
  user: UserInfo
  ordreJackpot: number
  statut: MembreStatut
  dateAdhesion: string
  createdAt: string
  updatedAt: string
}

// ─── Requête ajout membre ─────────────────────────────────────────────────────
export interface AddMembreRequest {
  phone: string
  firstName?: string
  lastName?: string
  ordreJackpot?: number
}

// ─── Requête modification statut ──────────────────────────────────────────────
export interface UpdateMembreStatutRequest {
  statut: MembreStatut
  motif?: string
}
