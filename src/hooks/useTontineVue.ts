import { useMesTontines } from '@/hooks/useMe'
import { useTontine } from '@/hooks/useTontines'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { jeCotise, jeGere, type MaTontine, type ModeAccueil } from '@/types/me'

export type VueTontine = 'GERE' | 'COTISE' | 'LECTURE'

/**
 * Vue d'une tontine pour l'utilisateur connecté.
 * Gestionnaire ET membre : la vue suit le mode de l'accueil (Je gère / Je cotise), modifiable ici.
 */
export function useTontineVue(tontineId: string) {
  const tontineQuery = useTontine(tontineId)
  const mes = useMesTontines()
  const [mode, setMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', ['COTISE', 'GERE'] as const)

  const ma: MaTontine | undefined = mes.data?.find((t) => t.id === tontineId)
  const gere = !!ma && jeGere(ma)
  const cotise = !!ma && jeCotise(ma)
  const vue: VueTontine = gere && cotise ? (mode === 'GERE' ? 'GERE' : 'COTISE') : gere ? 'GERE' : cotise ? 'COTISE' : 'LECTURE'

  return {
    tontine: tontineQuery.data,
    ma,
    gere,
    cotise,
    deuxVues: gere && cotise,
    vue,
    setVue: (v: 'GERE' | 'COTISE') => setMode(v),
    isLoading: tontineQuery.isLoading || mes.isLoading,
    isError: tontineQuery.isError,
    refetch: tontineQuery.refetch,
  }
}
