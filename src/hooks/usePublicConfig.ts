import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { CustomResponse } from '@/types/common'

export interface PublicConfig {
  supportWhatsapp: string | null
  supportEmail: string | null
  versionMinimaleApp: string | null
}

/** Configuration publique (B25, sans JWT) : support et version minimale de l'application. */
export function usePublicConfig() {
  return useQuery({
    queryKey: ['public-config'],
    queryFn: async (): Promise<PublicConfig> => {
      const { data } = await api.get<CustomResponse<Partial<PublicConfig>>>('/v1/public/config')
      return {
        supportWhatsapp: data.data?.supportWhatsapp ?? null,
        supportEmail: data.data?.supportEmail ?? null,
        versionMinimaleApp: data.data?.versionMinimaleApp ?? null,
      }
    },
    staleTime: 30 * 60_000,
    retry: false,
  })
}

/** true si `version` < `minimale` (comparaison numérique x.y.z) */
export function versionInferieure(version: string, minimale: string): boolean {
  const a = version.split('.').map((n) => parseInt(n, 10) || 0)
  const b = minimale.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x < y
  }
  return false
}
