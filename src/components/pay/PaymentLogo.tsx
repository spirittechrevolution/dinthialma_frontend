import { useState } from 'react'
import { clsx } from 'clsx'
import { Smartphone } from 'lucide-react'
import { PAYMENT_LOGOS, paymentMethodLabel } from '@/lib/paymentMethods'

/**
 * Logo d'un moyen de paiement, servi tel quel depuis /public/moyens-paiement/.
 * Les fichiers sont des logos complets (pictogramme carré 88 × 88 à gauche, puis le nom) :
 * on n'en montre que le pictogramme, le nom étant déjà écrit à côté là où le logo apparaît.
 * Fichier absent ou erreur de chargement : pastille avec les initiales.
 */
export function PaymentLogo({ value, size = 40, className }: { value: string; size?: number; className?: string }) {
  const [echec, setEchec] = useState(false)
  const src = PAYMENT_LOGOS[value]
  const style = { width: size, height: size }

  if (src && !echec) {
    return (
      <span className={clsx('flex-shrink-0 overflow-hidden', className)} style={style} aria-hidden>
        {/* object-fit cover + alignement à gauche : l'image est mise à la hauteur du cadre, seul le carré de gauche reste visible */}
        <img src={src} alt="" onError={() => setEchec(true)} className="w-full h-full object-cover object-left" />
      </span>
    )
  }
  const initiales = paymentMethodLabel(value).replace(/[^A-Za-zÀ-ÿ ]/g, ' ').split(/\s+/).filter(Boolean).map((m) => m[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span
      className={clsx('rounded-xl bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0 overflow-hidden text-neutral-700 font-bold', className)}
      style={{ ...style, fontSize: size * 0.32 }}
      aria-hidden
    >
      {initiales || <Smartphone size={size * 0.5} />}
    </span>
  )
}
