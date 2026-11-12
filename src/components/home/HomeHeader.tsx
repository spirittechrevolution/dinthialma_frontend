import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Settings, Bell, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react'
import { formatF } from '@/lib/format'
import type { ModeAccueil } from '@/types/me'

interface HomeHeaderProps {
  mode: ModeAccueil
  onModeChange: (m: ModeAccueil) => void
  /** Affiche la bascule (l'utilisateur cotise ET gère) */
  deuxModes: boolean
  /** Pastilles d'alerte sur chaque segment (affichées seulement sur le segment inactif) */
  pastilles: Record<ModeAccueil, number>
  /** null = pas de filtre (nouvel inscrit) */
  filterLabel: string | null
  onOpenFilter: () => void
  amountLabel: string
  amount: number | null
  amountLoading: boolean
  hidden: boolean
  onToggleHidden: () => void
  onAmountClick?: () => void
  unread: number
}

/** Bascule entre les deux espaces : libellés = rôles, les mêmes que les étiquettes de la fiche tontine */
const MODES: { id: ModeAccueil; label: string }[] = [
  { id: 'COTISE', label: 'Membre' },
  { id: 'GERE', label: 'Gestionnaire' },
]

/** Bandeau vert de l'accueil : réglages, alertes, bascule, filtre, montant masquable. */
export function HomeHeader(p: HomeHeaderProps) {
  const iconBtn = 'relative w-12 h-12 -m-1 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 active:scale-95 transition'

  return (
    <header className="bg-primary-700 text-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-16 md:rounded-3xl md:pb-14">
      <div className="flex items-center justify-between">
        <Link to="/parametres" className={iconBtn} aria-label="Paramètres">
          <Settings size={24} />
        </Link>
        <Link
          to="/notifications"
          className={iconBtn}
          aria-label={p.unread > 0 ? `Alertes, ${p.unread} non lue${p.unread > 1 ? 's' : ''}` : 'Alertes'}
        >
          <Bell size={24} />
          {p.unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-primary-700">
              {p.unread > 9 ? '9+' : p.unread}
            </span>
          )}
        </Link>
      </div>

      {p.deuxModes && (
        <div role="tablist" aria-label="Mode" className="mt-2 mx-auto flex w-full max-w-xs rounded-full bg-black/15 p-1">
          {MODES.map((m) => {
            const active = p.mode === m.id
            const pastille = !active ? p.pastilles[m.id] : 0
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                onClick={() => p.onModeChange(m.id)}
                className={clsx(
                  'relative flex-1 h-10 rounded-full text-sm font-semibold transition-colors',
                  active ? 'bg-white text-primary-800' : 'text-white/85 hover:text-white',
                )}
              >
                {m.label}
                {pastille > 0 && (
                  <span className="ml-1.5 inline-flex min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold items-center justify-center align-middle">
                    {pastille > 9 ? '9+' : pastille}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {p.filterLabel !== null && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={p.onOpenFilter}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <span className="max-w-[16rem] truncate">{p.filterLabel}</span>
            <ChevronDown size={16} />
          </button>
        </div>
      )}

      <div className="mt-3 text-center">
        <p className="text-xs font-semibold tracking-[0.14em] text-white/75 uppercase">{p.amountLabel}</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={p.onAmountClick}
            disabled={!p.onAmountClick || p.amountLoading}
            className="inline-flex items-center gap-1 rounded-2xl px-2 disabled:cursor-default"
            aria-label={p.hidden ? 'Montant masqué, voir le détail' : 'Voir le détail par tontine'}
          >
            {p.amountLoading ? (
              <span className="inline-block h-11 w-44 rounded-xl bg-white/20 animate-pulse" />
            ) : (
              <span className="text-[44px] leading-none font-extrabold tabular-nums">
                {p.hidden ? '••••••' : formatF(p.amount)}
              </span>
            )}
            {p.onAmountClick && !p.amountLoading && <ChevronRight size={22} className="text-white/70" />}
          </button>
          <button
            type="button"
            onClick={p.onToggleHidden}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white/85 hover:bg-white/10"
            aria-label={p.hidden ? 'Afficher le montant' : 'Masquer le montant'}
          >
            {p.hidden ? <Eye size={22} /> : <EyeOff size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
