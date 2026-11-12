import { useState } from 'react'
import { clsx } from 'clsx'
import { Banknote, Smartphone } from 'lucide-react'
import { PAYMENT_LOGOS, paymentMethodLabel } from '@/lib/paymentMethods'

/**
 * Logo d'un moyen de paiement, dans un cadre blanc arrondi.
 * Espèces : billet ; logo officiel s'il est présent dans /public/moyens-paiement/ ;
 * sinon (fichier manquant ou erreur de chargement) : pastille avec les initiales.
 */
export function PaymentLogo({ value, size = 40, className }: { value: string; size?: number; className?: string }) {
  const [echec, setEchec] = useState(false)
  const src = PAYMENT_LOGOS[value]
  const cadre = clsx('rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden', className)
  const style = { width: size, height: size }

  if (value === 'CASH') {
    return <span className={clsx(cadre, 'text-emerald-700')} style={style} aria-hidden><Banknote size={size * 0.55} /></span>
  }
  if (src && !echec) {
    return (
      <span className={cadre} style={style}>
        <img src={src} alt="" aria-hidden onError={() => setEchec(true)} className="w-full h-full object-contain p-1" />
      </span>
    )
  }
  const initiales = paymentMethodLabel(value).replace(/[^A-Za-zÀ-ÿ ]/g, ' ').split(/\s+/).filter(Boolean).map((m) => m[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={clsx(cadre, 'text-neutral-700 font-bold')} style={{ ...style, fontSize: size * 0.32 }} aria-hidden>
      {initiales || <Smartphone size={size * 0.5} />}
    </span>
  )
}
