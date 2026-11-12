/**
 * Sécurité du compte : mot de passe (B21) et appareils connectés (B20).
 * Une seule session par type de client (WEB, MOBILE) : une nouvelle connexion du même type remplace l'autre.
 */
import api from './api'
import type { CustomResponse } from '@/types/common'

export interface SessionAppareil {
  id: string
  clientType: 'WEB' | 'MOBILE'
  deviceInfo: string | null
  derniereActivite: string | null
  expireLe: string | null
  expiree: boolean
  /** true pour l'appareil utilisé en ce moment */
  courante: boolean
}

export const securiteService = {
  async changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string, deconnecterAutresAppareils: boolean): Promise<void> {
    await api.post('/v1/me/password', { ancienMotDePasse, nouveauMotDePasse, deconnecterAutresAppareils })
  },

  async listSessions(): Promise<SessionAppareil[]> {
    const { data } = await api.get<CustomResponse<Partial<SessionAppareil>[]>>('/v1/me/sessions')
    return (data.data ?? []).map((s) => ({
      id: s.id ?? '',
      clientType: s.clientType ?? 'WEB',
      deviceInfo: s.deviceInfo ?? null,
      derniereActivite: s.derniereActivite ?? null,
      expireLe: s.expireLe ?? null,
      expiree: !!s.expiree,
      courante: !!s.courante,
    }))
  },

  async revoquerSession(id: string): Promise<void> {
    await api.delete(`/v1/me/sessions/${id}`)
  },
}
