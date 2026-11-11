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
