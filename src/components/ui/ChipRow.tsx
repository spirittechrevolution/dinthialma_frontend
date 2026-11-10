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
