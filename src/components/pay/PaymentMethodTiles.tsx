import { clsx } from 'clsx'
import { CheckCircle2 } from 'lucide-react'
import { useCodeList } from '@/hooks/useCodeList'
import { PAYMENT_METHODS, METHODES_RETIREES, paymentMethodLabel, ordreMethode, estDisponible } from '@/lib/paymentMethods'
import { PaymentLogo } from './PaymentLogo'

interface PaymentMethodTilesProps {
  value: string
  onChange: (value: string) => void
  error?: string
  /** Desktop : une seule ligne de 4 tuiles plus basses */
  compact?: boolean
}

/**
 * Grille 2 × 2 des moyens de paiement : logo + nom, coche de sélection.
 * Liste issue du référentiel METHODE_PAIEMENT (repli : table locale), sans les moyens retirés (Free Money).
 * Les moyens pas encore ouverts (voir METHODES_DISPONIBLES) sont grisés et non sélectionnables.
 */
export function PaymentMethodTiles({ value, onChange, error, compact = false }: PaymentMethodTilesProps) {
  const { data } = useCodeList('METHODE_PAIEMENT')
  const methods = (data && data.length
    ? data.map((d) => ({ value: d.value, label: paymentMethodLabel(d.value) !== d.value ? paymentMethodLabel(d.value) : d.description || d.value }))
    : PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label as string })))
    .filter((m) => !METHODES_RETIREES.includes(m.value))
    .sort((a, b) => ordreMethode(a.value) - ordreMethode(b.value))

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-neutral-700 mb-2">Moyen de paiement</legend>
      <div role="radiogroup" className={clsx('grid gap-3', compact ? 'grid-cols-4 gap-2' : 'grid-cols-2')}>
        {methods.map((m) => {
          const disponible = estDisponible(m.value)
          const selected = disponible && value === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={!disponible}
              disabled={!disponible}
              onClick={() => onChange(m.value)}
              className={clsx(
                'relative rounded-2xl border-2 flex items-center text-left transition-colors',
                compact ? 'h-14 px-2.5 gap-2' : 'h-[72px] px-3 gap-3',
                !disponible ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed'
                  : selected ? 'border-primary-700 bg-primary-50' : 'border-neutral-200 bg-white hover:border-neutral-300',
              )}
            >
              <PaymentLogo value={m.value} size={compact ? 30 : 44} className={clsx(!disponible && 'grayscale opacity-50')} />
              <span className="min-w-0">
                <span className={clsx('block font-semibold leading-tight', compact && 'text-sm truncate', disponible ? 'text-neutral-900' : 'text-neutral-400')}>{m.label}</span>
                {!disponible && <span className="block text-xs text-neutral-400">{compact ? 'Bientôt' : 'Bientôt disponible'}</span>}
              </span>
              {selected && <CheckCircle2 size={compact ? 16 : 20} className={clsx('absolute text-primary-700', compact ? 'top-1.5 right-1.5' : 'top-2 right-2')} />}
            </button>
          )
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </fieldset>
  )
}
