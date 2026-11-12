import { MembreStatut, UserInfo } from './common'

// ─── Réponse membre ───────────────────────────────────────────────────────────
export interface Membre {
  id: string
  tontineId: string
  user: UserInfo
  ordreJackpot: number
  statut: MembreStatut
  dateAdhesion: string
  /** true si le membre a déjà gagné un cycle de cette tontine (un seul jackpot par tontine) */
  aRecuJackpot: boolean
  /** Date de son jackpot, null s'il n'a pas encore gagné */
  dateJackpot: string | null
  createdAt: string
  updatedAt: string
}

// ─── Requête ajout membre ─────────────────────────────────────────────────────
/** Soit `phone`, soit `qrToken` (QR membre scanné), jamais les deux — sinon MEMBER_IDENTIFIER_REQUIRED */
export interface AddMembreRequest {
  phone?: string
  qrToken?: string
  firstName?: string
  lastName?: string
  ordreJackpot?: number
}

// ─── Requête modification statut ──────────────────────────────────────────────
export interface UpdateMembreStatutRequest {
  statut: MembreStatut
  motif?: string
}
