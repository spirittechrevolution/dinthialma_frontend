import { clsx } from 'clsx'
import { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span className={clsx('inline-flex items-center px-4 py-2 rounded-full text-sm font-bold', variants[variant], className)}>
      {children}
    </span>
  )
}
