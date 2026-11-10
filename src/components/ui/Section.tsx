import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronRight } from 'lucide-react'

interface SectionProps {
  title: ReactNode
  /** Lien « Tout voir » */
  to?: string
  linkLabel?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Contenu dans une carte blanche (par défaut) */
  card?: boolean
}

/** Bloc de contenu avec titre simple + lien « Tout voir ». */
export function Section({ title, to, linkLabel = 'Tout voir', action, children, className, card = true }: SectionProps) {
  return (
    <section className={clsx('mb-5', className)}>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-[15px] font-bold text-neutral-900">{title}</h2>
        {action}
        {to && !action && (
          <Link to={to} className="text-sm font-semibold text-primary-700 flex items-center gap-0.5 hover:underline">
            {linkLabel} <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {card ? (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">{children}</div>
      ) : (
        children
      )}
    </section>
  )
}

interface ListItemProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  to?: string
  onClick?: () => void
  className?: string
}

/** Ligne de liste simple (style historique de transactions Wave). */
export function ListItem({ leading, title, subtitle, trailing, to, onClick, className }: ListItemProps) {
  const inner = (
    <>
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-neutral-900 truncate">{title}</div>
        {subtitle && <div className="text-xs text-neutral-500 truncate mt-0.5">{subtitle}</div>}
      </div>
      {trailing && <div className="flex-shrink-0 text-right">{trailing}</div>}
    </>
  )
  const cls = clsx(
    'flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 last:border-0',
    (to || onClick) && 'hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer',
    className
  )
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={clsx(cls, 'w-full text-left')}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

/** Pastille ronde colorée avec initiales (couleur stable par nom). */
export function InitialsAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  const palette = ['bg-primary-100 text-primary-800', 'bg-sky-100 text-sky-800', 'bg-violet-100 text-violet-800', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800', 'bg-teal-100 text-teal-800']
  const idx = (name.charCodeAt(0) || 0) % palette.length
  return (
    <span
      className={clsx('rounded-full flex items-center justify-center font-bold flex-shrink-0', palette[idx])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || '?'}
    </span>
  )
}
