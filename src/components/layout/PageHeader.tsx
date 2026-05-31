import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {description && <p className="text-neutral-600 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
