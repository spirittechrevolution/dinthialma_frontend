import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 max-w-xs mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
