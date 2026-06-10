import { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, prefix, className, ...props }, ref) => {
    const paddingClass = icon && prefix ? 'pl-28' : icon ? 'pl-10' : prefix ? 'pl-16' : ''

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute top-1/2 -translate-y-1/2 left-3 text-neutral-500">
              {icon}
            </div>
          )}
          {prefix && (
            <div className="absolute inset-y-0 left-14 flex items-center text-neutral-500 pointer-events-none">
              <span>{prefix}</span>
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all',
              paddingClass,
              error && 'border-error focus:ring-error',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
