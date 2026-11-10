import { ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { formatMontant, safeGet, safeSet } from '@/lib/format'

const HIDE_KEY = 'dinthialma_hide_balance'

interface BalanceCardProps {
  label: string
  amount: number
  /** Petit texte au-dessus (ex : nom de la tontine) */
  eyebrow?: ReactNode
  /** Ligne d'info sous le montant */
  footer?: ReactNode
  /** Bouton d'action principal (ex : Payer) */
  action?: ReactNode
}

/**
 * Carte « solde » façon Wave : un seul gros chiffre, masquable d'un tap,
 * et une action principale bien visible.
 */
export function BalanceCard({ label, amount, eyebrow, footer, action }: BalanceCardProps) {
  const [hidden, setHidden] = useState(() => safeGet(HIDE_KEY) === '1')

  const toggle = () => {
    setHidden((h) => {
      safeSet(HIDE_KEY, h ? '0' : '1')
      return !h
    })
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 text-white p-5 sm:p-6 mb-5 shadow-[0_10px_30px_-12px_rgba(22,163,74,0.6)]">
      {/* Décor discret */}
      <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-white/5" />

      <div className="relative">
        {eyebrow && <div className="mb-3">{eyebrow}</div>}

        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span>{label}</span>
          <button
            onClick={toggle}
            className="w-8 h-8 -my-1 rounded-full flex items-center justify-center hover:bg-white/10 transition"
            aria-label={hidden ? 'Afficher le montant' : 'Masquer le montant'}
          >
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <p className="mt-1 text-[34px] sm:text-4xl font-extrabold tracking-tight tabular leading-tight">
          {hidden ? '•••••' : formatMontant(amount)}
          <span className="ml-2 text-lg font-semibold text-white/70">FCFA</span>
        </p>

        {footer && <div className="mt-2 text-sm text-white/85">{footer}</div>}

        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}
