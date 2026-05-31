import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface StatProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function Stat({ label, value, icon, trend, className }: StatProps) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-sm p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
          {trend && (
            <p
              className={clsx(
                'text-xs font-semibold mt-2',
                trend.isPositive ? 'text-success' : 'text-error'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && <div className="text-primary-500">{icon}</div>}
      </div>
    </div>
  )
}
