/**
 * Préférences utilisateur synchronisées (B22) : `GET/PUT /v1/me/preferences`.
 *
 * Le `localStorage` reste le cache (hors ligne, lecture immédiate) ; la valeur serveur fait foi.
 * - Au démarrage (connecté) : lecture serveur → écriture du cache → événement pour les écrans ouverts.
 * - À chaque changement local : envoi de l'objet COMPLET (remplacement, pas de fusion), regroupé.
 */
import api from '@/services/api'
import { safeGet, safeSet } from '@/lib/format'
import type { CustomResponse } from '@/types/common'

export const PREF_KEYS = {
  mode: 'dinthialma_home_mode',
  masquer: 'dinthialma_hide_amount',
  favoris: 'dinthialma_tontines_favorites',
  moyen: 'dinthialma_last_method',
  /** Dernière tontine choisie dans l'espace Gestionnaire de l'accueil */
  derniereTontineGeree: 'dinthialma_derniere_tontine_geree',
} as const

/** Événement émis quand le cache local a été mis à jour depuis le serveur */
export const PREFERENCES_EVENT = 'dinthialma-preferences'

interface Preferences {
  tontinesFavorites: string[]
  dernierMode: 'COTISE' | 'GERE'
  masquerMontant: boolean
  dernierMoyenPaiement?: string
  /** null si aucune, ou si le serveur ne la reconnaît pas (pas gestionnaire, tontine supprimée) */
  derniereTontineGeree: string | null
}

function lireLocal(): Preferences {
  let favoris: string[] = []
  try {
    const v = JSON.parse(safeGet(PREF_KEYS.favoris) ?? '[]')
    if (Array.isArray(v)) favoris = v.filter((x) => typeof x === 'string')
  } catch { /* cache illisible */ }
  const moyen = safeGet(PREF_KEYS.moyen)
  const derniereTontineGeree = safeGet(PREF_KEYS.derniereTontineGeree) || null
  return {
    tontinesFavorites: favoris.slice(0, 50),
    dernierMode: safeGet(PREF_KEYS.mode) === 'GERE' ? 'GERE' : 'COTISE',
    masquerMontant: safeGet(PREF_KEYS.masquer) === '1',
    ...(moyen ? { dernierMoyenPaiement: moyen } : {}),
    derniereTontineGeree,
  }
}

function ecrireLocal(p: Partial<Preferences>) {
  if (p.tontinesFavorites) safeSet(PREF_KEYS.favoris, JSON.stringify(p.tontinesFavorites))
  if (p.dernierMode) safeSet(PREF_KEYS.mode, p.dernierMode)
  if (p.masquerMontant !== undefined) safeSet(PREF_KEYS.masquer, p.masquerMontant ? '1' : '0')
  if (p.dernierMoyenPaiement) safeSet(PREF_KEYS.moyen, p.dernierMoyenPaiement)
  // null renvoyé par le serveur (tontine supprimée, plus gestionnaire) : on oublie aussi en local
  if (p.derniereTontineGeree !== undefined) safeSet(PREF_KEYS.derniereTontineGeree, p.derniereTontineGeree ?? '')
}

/** Charge les préférences du serveur dans le cache local (à l'ouverture de l'app, connecté). */
export async function chargerPreferences(): Promise<void> {
  try {
    const { data } = await api.get<CustomResponse<Partial<Preferences>>>('/v1/me/preferences')
    if (data.data) {
      ecrireLocal(data.data)
      window.dispatchEvent(new Event(PREFERENCES_EVENT))
    }
  } catch {
    /* hors ligne ou non connecté : le cache local suffit */
  }
}

let minuteur: ReturnType<typeof setTimeout> | null = null

/** Envoie l'objet complet au serveur, regroupé sur 1,5 s (plusieurs changements = un seul PUT). */
export function synchroniserPreferences(): void {
  if (minuteur) clearTimeout(minuteur)
  minuteur = setTimeout(() => {
    minuteur = null
    api.put('/v1/me/preferences', lireLocal()).catch(() => { /* réessayé au prochain changement */ })
  }, 1500)
}

const CLES_SYNCHRONISEES = new Set<string>(Object.values(PREF_KEYS))
export const estPreferenceSynchronisee = (key: string) => CLES_SYNCHRONISEES.has(key)
