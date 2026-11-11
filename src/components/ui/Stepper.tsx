import { clsx } from 'clsx'
import { Minus, Plus } from 'lucide-react'

/** Compteur − / + (boutons 48 px, valeur au centre) */
export function Stepper({ value, min, max, onChange, label, small }: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  label: string
  small?: boolean
}) {
  const btn = 'w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 active:scale-95 disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-4">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Moins"><Minus size={20} /></button>
      <span className="text-center" aria-live="polite">
        <span className={clsx('block font-extrabold tabular-nums text-neutral-900', small ? 'text-2xl' : 'text-[40px] leading-none')}>{value}</span>
        <span className="text-sm text-neutral-500">{label}</span>
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Plus"><Plus size={20} /></button>
    </div>
  )
}
