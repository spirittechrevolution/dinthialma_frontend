import { Delete } from 'lucide-react'
import { formatF } from '@/lib/format'

interface AmountPadProps {
  value: number
  onChange: (value: number) => void
  /** Montant maximum accepté (garde-fou de saisie) */
  max?: number
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'] as const

/** Pavé numérique pour saisir un montant en FCFA (touches 64 px, séparateur de milliers à l'affichage). */
export function AmountPad({ value, onChange, max = 100_000_000 }: AmountPadProps) {
  const press = (k: (typeof KEYS)[number]) => {
    if (k === 'del') {
      onChange(Math.floor(value / 10))
      return
    }
    const next = Number(`${value || ''}${k}`)
    if (Number.isFinite(next) && next <= max) onChange(next)
  }

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Pavé numérique">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => press(k)}
          aria-label={k === 'del' ? 'Effacer' : k}
          className="h-16 rounded-2xl bg-neutral-100 text-2xl font-semibold text-neutral-900 active:bg-neutral-200 active:scale-[0.97] transition flex items-center justify-center"
        >
          {k === 'del' ? <Delete size={24} /> : k}
        </button>
      ))}
    </div>
  )
}

/** Montant affiché en très grand au-dessus du pavé */
export function BigAmount({ value, placeholder = '0F' }: { value: number | null; placeholder?: string }) {
  return (
    <p className="text-center text-[48px] leading-none font-extrabold tabular-nums text-neutral-900" aria-live="polite">
      {value ? formatF(value) : <span className="text-neutral-300">{placeholder}</span>}
    </p>
  )
}
