/**
 * Validation et refus de paiements (file « À valider », reçu).
 *
 * - Valider un paiement : PUT …/valider. L'écran retarde l'envoi de 5 s pour « Annuler » ;
 *   si l'utilisateur quitte l'écran, l'envoi part quand même (pas de hook lié au composant).
 * - Tout valider (B14) : POST /v1/me/gestion/cotisations/valider — réponse toujours 200,
 *   bilan par paiement dans `resultats`.
 * - Refuser (B18) : PUT …/refuser avec un motif obligatoire (statut REFUSE, final).
 */
import api from './api'
import { queryClient } from '@/lib/queryClient'
import { cotisationService } from './cotisationService'
import type { CustomResponse, CotisationStatut } from '@/types/common'
import type { ApiErrorCode } from '@/lib/apiError'

function invalidate(tontineIds: Iterable<string>) {
  for (const id of new Set(tontineIds)) {
    for (const key of ['cotisations', 'cotisation', 'recapCycle', 'recapTotal']) {
      queryClient.invalidateQueries({ queryKey: [key, id] })
    }
  }
  queryClient.invalidateQueries({ queryKey: ['me'] })
}

export interface ValidationCible {
  tontineId: string
  cotisationId: string
}

export interface ResultatValidation {
  cotisationId: string
  succes: boolean
  statut: CotisationStatut | null
  code: ApiErrorCode | null
  message: string | null
}

export interface BilanValidation {
  total: number
  validees: number
  echecs: number
  resultats: ResultatValidation[]
}

export const validationService = {
  async valider(cible: ValidationCible): Promise<void> {
    try {
      await cotisationService.validerCotisation(cible.tontineId, cible.cotisationId)
    } finally {
      invalidate([cible.tontineId])
    }
  },

  /** Validation groupée (1 à 100 paiements par appel). */
  async validerPlusieurs(cibles: ValidationCible[]): Promise<BilanValidation> {
    const bilan: BilanValidation = { total: 0, validees: 0, echecs: 0, resultats: [] }
    try {
      for (let i = 0; i < cibles.length; i += 100) {
        const lot = cibles.slice(i, i + 100)
        const { data } = await api.post<CustomResponse<Partial<BilanValidation>>>('/v1/me/gestion/cotisations/valider', {
          cotisationIds: lot.map((c) => c.cotisationId),
        })
        const r = data.data ?? {}
        bilan.total += Number(r.total ?? lot.length)
        bilan.validees += Number(r.validees ?? 0)
        bilan.echecs += Number(r.echecs ?? 0)
        bilan.resultats.push(...(r.resultats ?? []).map((x) => ({
          cotisationId: x.cotisationId,
          succes: !!x.succes,
          statut: x.statut ?? null,
          code: x.code ?? null,
          message: x.message ?? null,
        })))
      }
    } finally {
      invalidate(cibles.map((c) => c.tontineId))
    }
    return bilan
  },

  async refuser(cible: ValidationCible, motif: string): Promise<void> {
    try {
      await api.put(`/v1/tontines/${cible.tontineId}/cotisations/${cible.cotisationId}/refuser`, { motif })
    } finally {
      invalidate([cible.tontineId])
    }
  },
}
