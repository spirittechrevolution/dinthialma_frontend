import { clsx } from 'clsx'
import { Clock, CheckCircle2, AlertTriangle, Trophy, ArrowUpRight, RotateCw, XCircle } from 'lucide-react'
import { formatF, formatDateHeure } from '@/lib/format'
import type { ActiviteItem, ActiviteType, ModeAccueil } from '@/types/me'

const LIBELLES: Record<ActiviteType, string> = {
  COTISATION_DECLAREE: 'Cotisation déclarée',
  COTISATION_VALIDEE: 'Cotisation validée',
  COTISATION_ENCAISSEE: 'Cotisation encaissée',
  COTISATION_EN_RETARD: 'Cotisation en retard',
  COTISATION_REFUSEE: 'Paiement refusé',
  JACKPOT_RECU: 'Jackpot reçu',
}

const STATUT: Record<ActiviteType, { label: string; cls: string; icon: JSX.Element }> = {
  COTISATION_DECLAREE: { label: 'En attente', cls: 'bg-amber-50 text-amber-800', icon: <Clock size={13} /> },
  COTISATION_VALIDEE: { label: 'Validé', cls: 'bg-primary-50 text-primary-800', icon: <CheckCircle2 size={13} /> },
  COTISATION_ENCAISSEE: { label: 'Validé', cls: 'bg-primary-50 text-primary-800', icon: <CheckCircle2 size={13} /> },
  COTISATION_EN_RETARD: { label: 'En retard', cls: 'bg-red-50 text-red-700', icon: <AlertTriangle size={13} /> },
  COTISATION_REFUSEE: { label: 'Refusé', cls: 'bg-red-50 text-red-700', icon: <XCircle size={13} /> },
  JACKPOT_RECU: { label: 'Reçu', cls: 'bg-yellow-50 text-yellow-800', icon: <Trophy size={13} /> },
}

interface ActivityFeedProps {
  mode: ModeAccueil
  items: ActiviteItem[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpen: (item: ActiviteItem) => void
}

/** Fil d'activité de l'accueil : libellé, date, montant à droite, statut toujours visible. */
export function ActivityFeed({ mode, items, isLoading, isError, onRetry, onOpen }: ActivityFeedProps) {
  return (
    <section className="bg-white rounded-3xl shadow-sm">
      <h2 className="px-4 pt-4 pb-1 text-[17px] font-semibold text-neutral-900">Activité</h2>

      {isLoading ? (
        <ul aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse" />
              <span className="flex-1 space-y-2">
                <span className="block h-4 w-1/2 rounded bg-neutral-100 animate-pulse" />
                <span className="block h-3 w-1/3 rounded bg-neutral-100 animate-pulse" />
              </span>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-neutral-600">Impossible de charger l'activité.</p>
          <button onClick={onRetry} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
            <RotateCw size={16} /> Réessayer
          </button>
        </div>
      ) : !items || items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-500">Aucune activité pour l'instant</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((it) => <ActiviteRow key={it.id} mode={mode} it={it} onOpen={onOpen} />)}
        </ul>
      )}
    </section>
  )
}

/** Ligne d'activité (accueil, historique) : libellé, date, montant à droite, statut toujours visible */
export function ActiviteRow({ mode, it, onOpen }: { mode: ModeAccueil; it: ActiviteItem; onOpen: (item: ActiviteItem) => void }) {
  const st = STATUT[it.type]
  const gain = it.sens === 'GAIN'
  const titre = mode === 'GERE' && it.membreNom ? it.membreNom : `${LIBELLES[it.type]} · ${it.tontineNom}`
  const sous = mode === 'GERE' ? `${it.tontineNom} · ${formatDateHeure(it.date)}` : formatDateHeure(it.date)
  return (
    <li>
      <button
        onClick={() => onOpen(it)}
        className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-neutral-50 active:bg-neutral-100"
      >
        <span className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', gain ? 'bg-yellow-50 text-yellow-700' : 'bg-neutral-100 text-neutral-600')}>
          {gain ? <Trophy size={18} /> : <ArrowUpRight size={18} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-neutral-900 truncate">{titre}</span>
          <span className="block text-sm text-neutral-500 truncate">{sous}</span>
        </span>
        <span className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={clsx('font-bold tabular-nums', gain ? 'text-primary-700' : 'text-neutral-900')}>
            {gain ? '+' : ''}{formatF(it.montant)}
          </span>
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', st.cls)}>
            {st.icon} {st.label}
          </span>
        </span>
      </button>
    </li>
  )
}
