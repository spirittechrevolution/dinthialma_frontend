import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-primary-50 text-primary-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
  }

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', variants[variant], className)}>
      {children}
    </span>
  )
}
