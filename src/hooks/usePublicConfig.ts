import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { CustomResponse } from '@/types/common'

export interface PublicConfig {
  supportWhatsapp: string | null
  supportEmail: string | null
  /** En dessous : écran bloquant « Mise à jour requise » */
  versionMinimaleApp: string | null
  /** En dessous : bandeau non bloquant « Nouvelle version disponible » */
  versionRecommandeeApp: string | null
}

/** Configuration publique (B25, sans JWT). Inaccessible → aucun contrôle de version. */
export function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: async (): Promise<PublicConfig> => {
      const { data } = await api.get<CustomResponse<Partial<PublicConfig>>>('/v1/public/config')
      return {
        supportWhatsapp: data.data?.supportWhatsapp ?? null,
        supportEmail: data.data?.supportEmail ?? null,
        versionMinimaleApp: data.data?.versionMinimaleApp ?? null,
        versionRecommandeeApp: data.data?.versionRecommandeeApp ?? null,
      }
    },
    staleTime: 30 * 60_000,
    retry: false,
  })
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

function parseSemver(v: string | null | undefined): [number, number, number] | null {
  const m = v ? SEMVER.exec(v.trim()) : null
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

/**
 * true seulement si les deux versions sont au format MAJEUR.MINEUR.CORRECTIF
 * et que `version` est strictement inférieure à `seuil` (comparaison numérique : 1.10.0 > 1.9.0).
 * Champ absent ou format inattendu → false : en cas de doute, on ne bloque jamais.
 */
export function versionInferieure(version: string, seuil: string | null | undefined): boolean {
  const a = parseSemver(version)
  const b = parseSemver(seuil)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return false
}
