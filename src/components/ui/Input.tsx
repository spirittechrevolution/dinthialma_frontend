import { forwardRef, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</div>}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all',
              icon && 'pl-10',
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
