import { clsx } from 'clsx'

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  )
}

interface SpinnerInlineProps {
  size?: 'sm' | 'md' | 'lg'
}

export function SpinnerInline({ size = 'md' }: SpinnerInlineProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className={clsx('animate-spin rounded-full border-b-2 border-primary-500', sizeClasses[size])}>
      {/* This div is just for the spinning animation */}
    </div>
  )
}
