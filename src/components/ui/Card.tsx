import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function Card({ children, className, noPadding = false }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-3xl shadow-md border border-neutral-100 hover:shadow-lg transition-shadow', !noPadding && 'p-8', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={clsx('mb-6', className)}>{children}</div>
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h2 className={clsx('text-2xl font-bold text-neutral-900', className)}>{children}</h2>
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={clsx('mt-6 flex items-center justify-between', className)}>{children}</div>
}
