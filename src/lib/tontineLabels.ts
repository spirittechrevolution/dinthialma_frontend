import { CycleStatut } from '@/types/common'

/** Rythme court pour « 5.000F / mois » */
const RYTHME: Record<string, string> = {
  JOURNALIERE: 'jour',
  HEBDOMADAIRE: 'semaine',
  BIMENSUEL: '2 semaines',
  MENSUEL: 'mois',
  TRIMESTRIEL: 'trimestre',
}

export function rythmeCourt(frequence: string | null | undefined): string {
  return (frequence && RYTHME[frequence]) || (frequence ?? '').toLowerCase()
}

/** Vocabulaire unique du brief : À venir / En cours / Terminé */
export const TOUR_STATUT: Record<CycleStatut, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'À venir', cls: 'bg-neutral-100 text-neutral-700' },
  EN_COURS: { label: 'En cours', cls: 'bg-primary-50 text-primary-800' },
  TERMINE: { label: 'Terminé', cls: 'bg-violet-50 text-violet-800' },
}

/** Durée d'un tour en jours selon le rythme (pour préremplir la date de fin) */
const DUREE_JOURS: Record<string, number> = {
  JOURNALIERE: 1,
  HEBDOMADAIRE: 7,
  BIMENSUEL: 14,
  MENSUEL: 30,
  TRIMESTRIEL: 90,
}

/** Dates proposées pour un nouveau tour : aujourd'hui → aujourd'hui + durée du rythme (format yyyy-mm-dd) */
export function datesTourSuggerees(frequence: string | null | undefined): { debut: string; fin: string } {
  const debut = new Date()
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + (DUREE_JOURS[frequence ?? ''] ?? 30) - 1)
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { debut: iso(debut), fin: iso(fin) }
}

/** Nombre de jours avant une date (négatif si passée) */
export function joursAvant(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function compteARebours(iso: string | null | undefined): string | null {
  const j = joursAvant(iso)
  if (j === null) return null
  return j > 0 ? `J-${j}` : j === 0 ? "Aujourd'hui" : `J+${Math.abs(j)}`
}

/**
 * Crans du réglage de rythme, du plus court au plus long. Rythme limité à 1 mois maximum (décision 2026-11-12).
 * `code` = valeur FREQUENCE_TONTINE acceptée aujourd'hui par le backend ; null = rythme prévu par B26
 * (rythme libre), masqué tant que le backend ne l'accepte pas. Quand B26 sera livré, renseigner
 * l'envoi `rythmeIntervalle` / `rythmeUnite` et afficher tous les crans.
 */
export interface Rythme {
  intervalle: number
  unite: 'JOUR' | 'SEMAINE' | 'MOIS'
  code: string | null
  /** « Chaque semaine », « Tous les 3 jours » */
  label: string
  /** Libellé court sous la barre : « 1 sem » */
  court: string
  /** Libellé affiché sous la barre même quand il y a beaucoup de crans */
  repere?: boolean
  /** Au-delà d'un mois : plus proposé, affiché seulement pour une ancienne tontine qui l'utilise */
  horsLimite?: boolean
}

export const RYTHMES: Rythme[] = [
  { intervalle: 1, unite: 'JOUR', code: 'JOURNALIERE', label: 'Chaque jour', court: '1 j', repere: true },
  { intervalle: 2, unite: 'JOUR', code: null, label: 'Tous les 2 jours', court: '2 j' },
  { intervalle: 3, unite: 'JOUR', code: null, label: 'Tous les 3 jours', court: '3 j' },
  { intervalle: 4, unite: 'JOUR', code: null, label: 'Tous les 4 jours', court: '4 j' },
  { intervalle: 5, unite: 'JOUR', code: null, label: 'Tous les 5 jours', court: '5 j' },
  { intervalle: 1, unite: 'SEMAINE', code: 'HEBDOMADAIRE', label: 'Chaque semaine', court: '1 sem', repere: true },
  { intervalle: 10, unite: 'JOUR', code: null, label: 'Tous les 10 jours', court: '10 j' },
  { intervalle: 2, unite: 'SEMAINE', code: 'BIMENSUEL', label: 'Toutes les 2 semaines', court: '2 sem' },
  { intervalle: 3, unite: 'SEMAINE', code: null, label: 'Toutes les 3 semaines', court: '3 sem' },
  { intervalle: 1, unite: 'MOIS', code: 'MENSUEL', label: 'Chaque mois', court: '1 mois', repere: true },
  // Anciennes tontines uniquement
  { intervalle: 3, unite: 'MOIS', code: 'TRIMESTRIEL', label: 'Tous les 3 mois', court: '3 mois', horsLimite: true },
]

/** Rythme en phrase (« chaque semaine », « toutes les 2 semaines ») ; repli : « par semaine » */
export function rythmePhrase(code: string | null | undefined): string {
  const r = RYTHMES.find((x) => x.code === code)
  return r ? r.label.charAt(0).toLowerCase() + r.label.slice(1) : `par ${rythmeCourt(code)}`
}

/** Durée d'un tour en toutes lettres : « 3 jours », « 1 semaine », « 2 mois » */
export function dureeRythme(r: Rythme): string {
  const mots = { JOUR: ['jour', 'jours'], SEMAINE: ['semaine', 'semaines'], MOIS: ['mois', 'mois'] }[r.unite]
  return `${r.intervalle} ${r.intervalle > 1 ? mots[1] : mots[0]}`
}

/** Date + un intervalle de rythme */
export function ajouterRythme(d: Date, r: Rythme, fois = 1): Date {
  const n = new Date(d)
  if (r.unite === 'MOIS') n.setMonth(n.getMonth() + r.intervalle * fois)
  else n.setDate(n.getDate() + r.intervalle * fois * (r.unite === 'SEMAINE' ? 7 : 1))
  return n
}

/** Valeurs de repli si les listes de valeurs (référentiels) ne répondent pas */
export const FREQUENCES_DEFAUT = ['JOURNALIERE', 'HEBDOMADAIRE', 'BIMENSUEL', 'MENSUEL', 'TRIMESTRIEL']
export const ORDRES_DEFAUT = ['ROTATION', 'ALEATOIRE', 'MANUEL']
export const ORDRE_LABEL: Record<string, string> = { ROTATION: 'Ordre fixe', ALEATOIRE: 'Tirage au sort', MANUEL: 'Je choisis' }
export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
