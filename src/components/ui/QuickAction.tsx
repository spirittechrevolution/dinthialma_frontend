import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

interface QuickActionProps {
  icon: ReactNode
  label: string
  to?: string
  /** État transmis à la route (react-router) */
  state?: unknown
  onClick?: () => void
  /** Couleur de la pastille (classes tailwind bg + text) */
  tone?: 'primary' | 'blue' | 'amber' | 'purple' | 'neutral'
  badge?: number
}

const tones = {
  primary: 'bg-primary-50 text-primary-700',
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  purple: 'bg-violet-50 text-violet-700',
  neutral: 'bg-neutral-100 text-neutral-700',
}

/**
 * Bouton d'action rapide façon Wave : grosse pastille ronde + libellé court.
 * À utiliser en grille de 4 sous la carte solde.
 */
export function QuickAction({ icon, label, to, state, onClick, tone = 'primary', badge }: QuickActionProps) {
  const content = (
    <>
      <span className={clsx('relative w-14 h-14 rounded-full flex items-center justify-center transition-transform group-active:scale-90', tones[tone])}>
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-xs font-medium text-neutral-700 text-center leading-tight">{label}</span>
    </>
  )

  const cls = 'group flex flex-col items-center gap-2 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2xl p-1'

  if (to) return <Link to={to} state={state} className={cls}>{content}</Link>
  return <button type="button" onClick={onClick} className={cls}>{content}</button>
}
