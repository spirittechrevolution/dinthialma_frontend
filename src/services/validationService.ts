/**
 * Validation de paiements hors composant (file « À valider »).
 *
 * L'écran retarde l'envoi de 5 s pour permettre « Annuler » ; si l'utilisateur quitte l'écran
 * entre-temps, l'envoi doit quand même partir : on n'utilise donc pas un hook lié au composant.
 * Validation groupée : B14 de docs/BESOINS_BACKEND.md (un appel par paiement en attendant).
 */
import { queryClient } from '@/lib/queryClient'
import { cotisationService } from './cotisationService'

function invalidate(tontineIds: Iterable<string>) {
  for (const id of new Set(tontineIds)) {
    for (const key of ['cotisations', 'cotisation', 'recapCycle', 'recapTotal', 'cotisationsRecapTotal']) {
      queryClient.invalidateQueries({ queryKey: [key, id] })
    }
  }
  queryClient.invalidateQueries({ queryKey: ['me'] })
}

export interface ValidationCible {
  tontineId: string
  cotisationId: string
}

export const validationService = {
  async valider(cible: ValidationCible): Promise<void> {
    try {
      await cotisationService.validerCotisation(cible.tontineId, cible.cotisationId)
    } finally {
      invalidate([cible.tontineId])
    }
  },

  /** Valide une série ; renvoie les identifiants en échec (la série continue malgré un échec). */
  async validerPlusieurs(cibles: ValidationCible[]): Promise<{ ok: string[]; echecs: string[] }> {
    const results = await Promise.allSettled(
      cibles.map((c) => cotisationService.validerCotisation(c.tontineId, c.cotisationId)),
    )
    invalidate(cibles.map((c) => c.tontineId))
    const ok: string[] = []
    const echecs: string[] = []
    results.forEach((r, i) => (r.status === 'fulfilled' ? ok : echecs).push(cibles[i].cotisationId))
    return { ok, echecs }
  },
}
