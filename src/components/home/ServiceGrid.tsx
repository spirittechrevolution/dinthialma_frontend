import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

export interface ServiceItem {
  key: string
  label: string
  icon: ReactNode
  tone: 'green' | 'blue' | 'amber' | 'violet' | 'rose' | 'teal' | 'neutral'
  to?: string
  state?: unknown
  onClick?: () => void
  badge?: number
}

const tones: Record<ServiceItem['tone'], string> = {
  green: 'bg-primary-100 text-primary-800',
  blue: 'bg-sky-100 text-sky-800',
  amber: 'bg-amber-100 text-amber-800',
  violet: 'bg-violet-100 text-violet-800',
  rose: 'bg-rose-100 text-rose-800',
  teal: 'bg-teal-100 text-teal-800',
  neutral: 'bg-neutral-200 text-neutral-700',
}

/** Grille de 8 services (4 × 2) façon Wave : cercle coloré + un mot. */
export function ServiceGrid({ items }: { items: ServiceItem[] }) {
  return (
    <nav aria-label="Services" className="bg-white rounded-3xl shadow-sm px-2 py-4 grid grid-cols-4 gap-y-4">
      {items.map((it) => {
        const content = (
          <>
            <span className={clsx('relative w-16 h-16 rounded-full flex items-center justify-center transition-transform group-active:scale-90', tones[it.tone])}>
              {it.icon}
              {!!it.badge && it.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {it.badge > 9 ? '9+' : it.badge}
                </span>
              )}
            </span>
            <span className="text-[13px] font-medium text-neutral-800 text-center leading-tight px-0.5">{it.label}</span>
          </>
        )
        const cls = 'group flex flex-col items-center gap-1.5 min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary-600'
        return it.to ? (
          <Link key={it.key} to={it.to} state={it.state} className={cls}>{content}</Link>
        ) : (
          <button key={it.key} type="button" onClick={it.onClick} className={cls}>{content}</button>
        )
      })}
    </nav>
  )
}
