import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-3 mb-5', className)}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">{title}</h1>
        {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
