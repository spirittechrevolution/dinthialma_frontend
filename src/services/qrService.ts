/**
 * QR membre (B15), invitations de tontine (B16) et demandes d'adhésion (B17).
 * Voir §8 et §9 de docs/PROMPT_ALIGNEMENT_FRONT.md.
 */
import api from './api'
import { toPage, type CustomResponse, type PageResponse, type RawPage } from '@/types/common'

export interface MonQr { qrToken: string; url: string }

export interface MembreDansMaTontine {
  tontineId: string
  tontineNom: string
  membreId: string
  statutMembre: 'ACTIF' | 'SUSPENDU' | 'SORTI'
  cycleEnCoursId: string | null
  aPayeCycleEnCours: boolean
}

export interface QrResolution {
  type: 'MEMBRE' | 'TONTINE'
  invitationCode: string | null
  /** Identité sans téléphone */
  user: { id: string; firstName: string; lastName: string; accountStatus: 'ACTIVE' | 'PRE_ENROLLED' } | null
  dansMesTontines: MembreDansMaTontine[]
}

export interface Invitation { code: string; url: string; qrToken: string }

export interface InvitationApercu {
  code: string
  nom: string
  tontineType: 'ROTATIVE' | 'EVENEMENTIELLE'
  montant: number | null
  frequence: string | null
  montantLibre: boolean
  montantMinimum: number | null
  nomEvenement: string | null
  dateEcheance: string | null
  dateDebut: string | null
  placesRestantes: number | null
  gestionnairePrenom: string | null
  /** false : complète, suspendue ou terminée → pas de bouton « Rejoindre » */
  ouverte: boolean
  // Renseignés seulement si un JWT valide est envoyé (sinon null)
  dejaMembre: boolean | null
  estGestionnaire: boolean | null
  demandeEnAttente: boolean | null
  /** Seulement si l'appelant est membre ou gestionnaire */
  tontineId: string | null
}

export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE'

export interface DemandeAdhesion {
  id: string
  tontineId: string
  tontineNom: string
  statut: StatutDemande
  userId: string
  firstName: string
  lastName: string
  phone: string | null
  message: string | null
  motifRefus: string | null
  membreId: string | null
  createdAt: string
  dateTraitement: string | null
}

const ouNull = <T>(v: T | undefined | null): T | null => (v === undefined ? null : v)

export const qrService = {
  // ─── QR membre ─────────────────────────────────────────────────────────────
  async getMonQr(): Promise<MonQr> {
    const { data } = await api.get<CustomResponse<MonQr>>('/v1/me/qr')
    return data.data
  },
  async regenererMonQr(): Promise<MonQr> {
    const { data } = await api.post<CustomResponse<MonQr>>('/v1/me/qr/regenerer')
    return data.data
  },
  async resoudre(token: string): Promise<QrResolution> {
    const { data } = await api.get<CustomResponse<Partial<QrResolution>>>(`/v1/qr/${encodeURIComponent(token)}`)
    const r = data.data
    return {
      type: r.type ?? 'MEMBRE',
      invitationCode: ouNull(r.invitationCode),
      user: ouNull(r.user),
      dansMesTontines: (r.dansMesTontines ?? []).map((m) => ({
        ...m,
        cycleEnCoursId: ouNull((m as Partial<MembreDansMaTontine>).cycleEnCoursId),
        aPayeCycleEnCours: !!m.aPayeCycleEnCours,
      })),
    }
  },

  // ─── Invitation de tontine (gestionnaire) ──────────────────────────────────
  /** Code stable : renvoie le même code à chaque appel, sauf `regenerer` */
  async obtenirInvitation(tontineId: string, regenerer = false): Promise<Invitation> {
    const { data } = await api.post<CustomResponse<Invitation>>(
      `/v1/tontines/${tontineId}/invitation`, undefined, { params: regenerer ? { regenerer: true } : {} },
    )
    return data.data
  },
  async revoquerInvitation(tontineId: string): Promise<void> {
    await api.delete(`/v1/tontines/${tontineId}/invitation`)
  },

  // ─── Invitation (invité, sans JWT) ─────────────────────────────────────────
  async apercuInvitation(code: string): Promise<InvitationApercu> {
    const { data } = await api.get<CustomResponse<Partial<InvitationApercu>>>(`/v1/public/invitations/${encodeURIComponent(code)}`)
    const a = data.data
    return {
      code: a.code ?? code,
      nom: a.nom ?? '',
      tontineType: a.tontineType ?? 'ROTATIVE',
      montant: ouNull(a.montant),
      frequence: ouNull(a.frequence),
      montantLibre: !!a.montantLibre,
      montantMinimum: ouNull(a.montantMinimum),
      nomEvenement: ouNull(a.nomEvenement),
      dateEcheance: ouNull(a.dateEcheance),
      dateDebut: ouNull(a.dateDebut),
      placesRestantes: ouNull(a.placesRestantes),
      dejaMembre: ouNull(a.dejaMembre),
      estGestionnaire: ouNull(a.estGestionnaire),
      demandeEnAttente: ouNull(a.demandeEnAttente),
      tontineId: ouNull(a.tontineId),
      gestionnairePrenom: ouNull(a.gestionnairePrenom),
      ouverte: !!a.ouverte,
    }
  },
  async demanderAdhesion(code: string, message?: string): Promise<DemandeAdhesion> {
    const { data } = await api.post<CustomResponse<DemandeAdhesion>>(
      `/v1/invitations/${encodeURIComponent(code)}/demandes`, message ? { message } : {},
    )
    return data.data
  },

  // ─── Demandes d'adhésion ───────────────────────────────────────────────────
  async listDemandesGestion(params: { statut?: StatutDemande; tontineId?: string } = {}, page = 0, size = 100): Promise<PageResponse<DemandeAdhesion>> {
    const { data } = await api.get<CustomResponse<RawPage<DemandeAdhesion>>>('/v1/me/gestion/demandes', {
      params: { page, size, ...params },
    })
    return toPage(data.data)
  },
  async accepterDemande(tontineId: string, demandeId: string, ordreJackpot?: number): Promise<DemandeAdhesion> {
    const { data } = await api.put<CustomResponse<DemandeAdhesion>>(
      `/v1/tontines/${tontineId}/demandes/${demandeId}/accepter`, ordreJackpot ? { ordreJackpot } : {},
    )
    return data.data
  },
  async refuserDemande(tontineId: string, demandeId: string, motif?: string): Promise<DemandeAdhesion> {
    const { data } = await api.put<CustomResponse<DemandeAdhesion>>(
      `/v1/tontines/${tontineId}/demandes/${demandeId}/refuser`, motif ? { motif } : {},
    )
    return data.data
  },
  async listMesDemandes(page = 0, size = 50): Promise<PageResponse<DemandeAdhesion>> {
    const { data } = await api.get<CustomResponse<RawPage<DemandeAdhesion>>>('/v1/me/demandes', { params: { page, size } })
    return toPage(data.data)
  },
}
