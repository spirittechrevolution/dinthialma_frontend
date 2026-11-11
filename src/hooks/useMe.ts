/**
 * Hooks de la couche « moi » (voir src/services/meService.ts).
 * Toutes les clés commencent par ['me'] : toute mutation réussie les invalide
 * (MutationCache dans src/lib/queryClient.ts).
 */
import { useQuery } from '@tanstack/react-query'
import { meService } from '@/services/meService'
import { jeCotise, jeGere } from '@/types/me'
import type { CotisationStatut } from '@/types/common'
import type { MaTontine, ModeAccueil, ActiviteType } from '@/types/me'

const STALE_MS = 60_000

/** B01 — mes tontines avec mon rôle et mon identifiant de membre */
export function useMesTontines() {
  return useQuery({
    queryKey: ['me', 'tontines'],
    queryFn: () => meService.listMesTontines(),
    staleTime: STALE_MS,
  })
}

/** B01 pour une seule tontine */
export function useMaTontine(tontineId: string) {
  return useQuery({
    queryKey: ['me', 'tontine', tontineId],
    queryFn: () => meService.getMaTontine(tontineId),
    enabled: !!tontineId,
    staleTime: STALE_MS,
  })
}

/** Ce que l'utilisateur peut faire : sert à afficher (ou non) la bascule Je cotise / Je gère */
export function useMesRoles() {
  const { data, ...rest } = useMesTontines()
  const tontines: MaTontine[] = data ?? []
  return {
    ...rest,
    tontines,
    cotise: tontines.some(jeCotise),
    gere: tontines.some(jeGere),
    /** true si l'utilisateur a les deux rôles → afficher la bascule */
    deuxModes: tontines.some(jeCotise) && tontines.some(jeGere),
  }
}

/** B04 — résumé « Je cotise » */
export function useCotisantSummary(enabled = true) {
  return useQuery({
    queryKey: ['me', 'cotisant'],
    queryFn: () => meService.getCotisantSummary(),
    enabled,
    staleTime: STALE_MS,
  })
}

/** B05 — résumé « Je gère » */
export function useGestionSummary(enabled = true) {
  return useQuery({
    queryKey: ['me', 'gestion'],
    queryFn: () => meService.getGestionSummary(),
    enabled,
    staleTime: STALE_MS,
  })
}

/** B06 — file « À valider » (toutes mes tontines gérées, ou une seule) */
export function useCotisationsAValider(tontineId?: string, enabled = true) {
  return useQuery({
    queryKey: ['me', 'a-valider', tontineId ?? 'toutes'],
    queryFn: () => meService.listCotisationsAValider(tontineId),
    enabled,
    staleTime: STALE_MS,
  })
}

/** B07 — paiements d'une tontine filtrés par statut */
export function useCotisationsParStatut(
  tontineId: string,
  statuts: CotisationStatut[],
  opts: { cycleId?: string; membreId?: string; q?: string } = {},
) {
  return useQuery({
    queryKey: ['me', 'cotisations-statut', tontineId, [...statuts].sort().join(','), opts.cycleId, opts.membreId, opts.q],
    queryFn: () => meService.listCotisationsParStatut(tontineId, statuts, opts),
    enabled: !!tontineId,
    staleTime: STALE_MS,
  })
}

/** B09 — fil d'activité */
export function useActivite(
  mode: ModeAccueil,
  opts: { tontineId?: string; statut?: CotisationStatut; type?: ActiviteType; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ['me', 'activite', mode, opts.tontineId ?? 'toutes', opts.statut ?? 'tous', opts.type ?? 'tous', opts.limit ?? 50],
    queryFn: () => meService.listActivite(mode, opts),
    enabled,
    staleTime: STALE_MS,
  })
}

/** B10 — mes jackpots reçus et à venir */
export function useMesJackpots() {
  return useQuery({
    queryKey: ['me', 'jackpots'],
    queryFn: () => meService.getMesJackpots(),
    staleTime: STALE_MS,
  })
}
