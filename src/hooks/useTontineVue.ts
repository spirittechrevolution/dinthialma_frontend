import { useMaTontine } from '@/hooks/useMe'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { jeCotise, jeGere, type MaTontine, type ModeAccueil } from '@/types/me'

export type VueTontine = 'GERE' | 'COTISE' | 'LECTURE'

/**
 * Vue d'une tontine pour l'utilisateur connecté.
 * Gestionnaire ET membre : la vue suit le mode de l'accueil (Je gère / Je cotise), modifiable ici.
 */
export function useTontineVue(tontineId: string) {
  const q = useMaTontine(tontineId)
  const [mode, setMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', ['COTISE', 'GERE'] as const)

  const ma: MaTontine | undefined = q.data
  const gere = !!ma && jeGere(ma)
  const cotise = !!ma && jeCotise(ma)
  const vue: VueTontine = gere && cotise ? (mode === 'GERE' ? 'GERE' : 'COTISE') : gere ? 'GERE' : cotise ? 'COTISE' : 'LECTURE'

  return {
    tontine: q.data,
    ma,
    gere,
    cotise,
    deuxVues: gere && cotise,
    vue,
    setVue: (v: 'GERE' | 'COTISE') => setMode(v),
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  }
}
