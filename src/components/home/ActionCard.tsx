import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface ActionCardProps {
  icon: ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  tone?: 'urgent' | 'ok' | 'neutral'
  disabled?: boolean
  disabledReason?: string
}

const tones = {
  urgent: 'bg-amber-50 text-amber-800',
  ok: 'bg-primary-50 text-primary-700',
  neutral: 'bg-neutral-100 text-neutral-600',
}

/** Carte d'action de l'accueil : une seule action, la plus urgente. */
export function ActionCard({ icon, title, subtitle, actionLabel, onAction, tone = 'neutral', disabled, disabledReason }: ActionCardProps) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-3">
      <span className={clsx('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', tones[tone])}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-neutral-900 leading-snug">{title}</p>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold text-[15px] flex-shrink-0 active:scale-[0.97] transition disabled:opacity-50"
        >
          {actionLabel}
        </button>
      )}
    </section>
  )
}

export function ActionCardSkeleton() {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-3" aria-busy="true">
      <span className="w-12 h-12 rounded-full bg-neutral-100 animate-pulse" />
      <div className="flex-1 space-y-2">
        <span className="block h-4 w-2/3 rounded bg-neutral-100 animate-pulse" />
        <span className="block h-3 w-1/2 rounded bg-neutral-100 animate-pulse" />
      </div>
    </section>
  )
}
