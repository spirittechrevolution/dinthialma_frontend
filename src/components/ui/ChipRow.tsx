import { ReactNode, useEffect, useRef } from 'react'
import { clsx } from 'clsx'

interface ChipRowProps {
  children: ReactNode
  className?: string
  /**
   * Bord à bord sur mobile (déborde dans la marge de la page pour un défilement naturel).
   * La page elle-même ne défile jamais horizontalement (overflow-x-hidden dans AppLayout).
   */
  bleed?: boolean
}

/**
 * Rangée de pastilles défilable horizontalement (filtres, onglets).
 * - La pastille active (`aria-pressed="true"`) est ramenée automatiquement dans le champ
 * - Fondu léger sur les bords pour signaler qu'on peut faire défiler
 */
export function ChipRow({ children, className, bleed = true }: ChipRowProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const row = ref.current
    if (!row) return
    const active = row.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!active) return
    // Calcul manuel (pas de scrollIntoView : il ferait aussi défiler la page verticalement)
    const left = active.offsetLeft - row.offsetLeft
    const right = left + active.offsetWidth
    const pad = 16
    if (left < row.scrollLeft + pad) row.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' })
    else if (right > row.scrollLeft + row.clientWidth - pad) row.scrollTo({ left: right - row.clientWidth + pad, behavior: 'smooth' })
  })

  return (
    <div
      ref={ref}
      role="toolbar"
      className={clsx(
        'flex items-center gap-2 overflow-x-auto no-scrollbar overscroll-x-contain',
        bleed && '-mx-4 px-4 sm:mx-0 sm:px-0',
        // fondu sur les bords (mobile uniquement)
        bleed && '[mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)] sm:[mask-image:none]',
        className
      )}
    >
      {children}
      {/* Marge de fin : le padding droit d'un conteneur flex défilant est ignoré par certains navigateurs */}
      {bleed && <span aria-hidden className="shrink-0 w-2 sm:hidden" />}
    </div>
  )
}

interface FilterChipProps {
  label: ReactNode
  actif: boolean
  onClick: () => void
  /** Nombre d'éléments, affiché discrètement après le libellé (masqué si 0 ou absent) */
  count?: number
  /** Petit point rouge devant le nombre : quelque chose demande une action */
  alerte?: boolean
}

/**
 * Pastille de filtre, style unique de l'app (simplicité Wave) :
 * - active : fond vert clair, texte vert foncé (le vert plein reste réservé au niveau principal, ex. la bascule Membre / Gestionnaire) ;
 * - inactive : simple texte gris, sans fond ni ombre ;
 * - compteur en gris discret ; point rouge seulement quand il faut agir.
 */
export function FilterChip({ label, actif, onClick, count, alerte }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={clsx(
        'h-9 px-3.5 rounded-full text-sm whitespace-nowrap inline-flex items-center gap-1.5 transition-colors flex-shrink-0',
        actif ? 'bg-primary-100 text-primary-800 font-semibold' : 'text-neutral-600 font-medium hover:bg-black/5',
      )}
    >
      {label}
      {!!count && (
        <span className={clsx('inline-flex items-center gap-1 text-[13px] tabular-nums', actif ? 'text-primary-700' : 'text-neutral-400')}>
          {alerte && <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-red-600" />}
          {count}
        </span>
      )}
    </button>
  )
}
