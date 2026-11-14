import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

/**
 * Briques communes des pages web (≥ 1024 px) : en-tête de page, cartes de chiffres clés, carte de section.
 * Principe : titre à gauche, actions à droite ; chiffres clés en haut ; contenu aligné sur 1 200 px max.
 */

/** Conteneur de page desktop (largeur max 1 200 px, marges 32 px) */
export function PageDesktop({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('max-w-[1200px] mx-auto px-8 py-6', className)}>{children}</div>
}

/** En-tête de page : titre + sous-titre à gauche, actions à droite */
export function EnTetePage({ titre, sousTitre, actions, avant }: { titre: ReactNode; sousTitre?: ReactNode; actions?: ReactNode; avant?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-6">
      {avant}
      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] font-bold text-neutral-900 leading-tight truncate">{titre}</h1>
        {sousTitre && <p className="mt-0.5 text-sm text-neutral-500">{sousTitre}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Bouton d'en-tête (principal = vert plein, secondaire = vert pâle) */
export function BoutonEnTete({ children, onClick, to, variante = 'principal', disabled, title }: {
  children: ReactNode
  onClick?: () => void
  to?: string
  variante?: 'principal' | 'secondaire'
  disabled?: boolean
  title?: string
}) {
  const cls = clsx(
    'h-11 px-5 rounded-full text-sm font-bold inline-flex items-center gap-2 transition disabled:opacity-50 disabled:pointer-events-none',
    variante === 'principal' ? 'bg-primary-700 text-white hover:bg-primary-800' : 'bg-primary-50 text-primary-800 hover:bg-primary-100',
  )
  if (to && !disabled) return <Link to={to} className={cls} title={title}>{children}</Link>
  return <button onClick={onClick} disabled={disabled} className={cls} title={title}>{children}</button>
}

/** Carte de chiffre clé : libellé, valeur, détail ; cliquable si `to` ou `onClick` */
export function CarteChiffre({ label, valeur, detail, icone, ton = 'neutre', to, onClick, chargement, children }: {
  label: string
  valeur: ReactNode
  detail?: ReactNode
  icone?: ReactNode
  ton?: 'neutre' | 'vert' | 'ambre' | 'rouge' | 'jaune'
  to?: string
  onClick?: () => void
  chargement?: boolean
  children?: ReactNode
}) {
  const tons = {
    neutre: 'bg-neutral-100 text-neutral-600',
    vert: 'bg-primary-50 text-primary-700',
    ambre: 'bg-amber-50 text-amber-700',
    rouge: 'bg-red-50 text-red-700',
    jaune: 'bg-yellow-50 text-yellow-700',
  }
  const contenu = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-500">{label}</p>
        {icone && <span className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', tons[ton])}>{icone}</span>}
      </div>
      {chargement ? (
        <span className="mt-2 block h-8 w-32 rounded-lg bg-neutral-100 animate-pulse" />
      ) : (
        <p className="mt-1 text-[26px] leading-tight font-extrabold tabular-nums text-neutral-900 truncate">{valeur}</p>
      )}
      {detail && <p className="mt-1 text-sm text-neutral-500 truncate">{detail}</p>}
      {children}
    </>
  )
  const cls = 'block text-left bg-white rounded-3xl shadow-sm p-5 min-w-0'
  if (to) return <Link to={to} className={clsx(cls, 'hover:shadow-md transition-shadow')}>{contenu}</Link>
  if (onClick) return <button onClick={onClick} className={clsx(cls, 'w-full hover:shadow-md transition-shadow')}>{contenu}</button>
  return <div className={cls}>{contenu}</div>
}

/** Carte de section avec titre et lien « Tout voir » optionnel */
export function CarteSection({ titre, lien, children, className, actions }: {
  titre: ReactNode
  lien?: { to: string; label?: string }
  children: ReactNode
  className?: string
  actions?: ReactNode
}) {
  return (
    <section className={clsx('bg-white rounded-3xl shadow-sm min-w-0', className)}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold text-neutral-900">{titre}</h2>
        <div className="flex items-center gap-2">
          {actions}
          {lien && <Link to={lien.to} className="text-sm font-semibold text-primary-700 hover:underline">{lien.label ?? 'Tout voir'}</Link>}
        </div>
      </div>
      {children}
    </section>
  )
}
