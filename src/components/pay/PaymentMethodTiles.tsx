import { clsx } from 'clsx'
import { CheckCircle2, Smartphone, Banknote } from 'lucide-react'
import { useCodeList } from '@/hooks/useCodeList'
import { PAYMENT_METHODS, paymentMethodLabel } from '@/lib/paymentMethods'

interface PaymentMethodTilesProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Grille 2 × 2 des moyens de paiement : pictogramme générique + nom, coche de sélection.
 * Liste issue du référentiel METHODE_PAIEMENT (repli : table locale).
 */
export function PaymentMethodTiles({ value, onChange, error }: PaymentMethodTilesProps) {
  const { data } = useCodeList('METHODE_PAIEMENT')
  const methods = data && data.length
    ? data.map((d) => ({ value: d.value, label: d.description || paymentMethodLabel(d.value) }))
    : PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-neutral-700 mb-2">Moyen de paiement</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-3">
        {methods.map((m) => {
          const selected = value === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(m.value)}
              className={clsx(
                'relative h-[72px] rounded-2xl border-2 px-3 flex items-center gap-3 text-left transition-colors',
                selected ? 'border-primary-700 bg-primary-50' : 'border-neutral-200 bg-white hover:border-neutral-300',
              )}
            >
              <span className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', selected ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-600')}>
                {m.value === 'CASH' ? <Banknote size={20} /> : <Smartphone size={20} />}
              </span>
              <span className="font-semibold text-neutral-900 leading-tight">{m.label}</span>
              {selected && <CheckCircle2 size={20} className="absolute top-2 right-2 text-primary-700" />}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </fieldset>
  )
}
