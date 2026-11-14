import { ReactNode } from 'react'
import { LogoIcon } from '@/components/ui/LogoIcon'

interface AuthShellProps {
  /** Titre de l'écran (ex : « Bon retour ») */
  title: ReactNode
  subtitle?: ReactNode
  /** Accroche du panneau desktop, sur deux lignes */
  brandTitle?: [string, string]
  brandText?: ReactNode
  /** Contenu (formulaire) — rendu UNE SEULE FOIS, pour mobile et desktop */
  children: ReactNode
  /** Pied de page sous le formulaire (ex : lien « S'inscrire ») */
  footer?: ReactNode
}

/**
 * Mise en page commune des écrans d'authentification.
 * - Mobile : bandeau de marque compact + carte blanche qui remonte dessus
 * - Desktop : panneau de marque à gauche, formulaire centré à droite
 *
 * Le formulaire n'est monté qu'une fois (avant, chaque page le dupliquait
 * pour mobile et desktop, avec des champs react-hook-form en double).
 */
export function AuthShell({
  title,
  subtitle,
  brandTitle = ['Gérez vos tontines', 'en toute sérénité.'],
  brandText = 'Suivez les cotisations, validez les paiements et distribuez les jackpots — tout est centralisé.',
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-[100dvh] lg:flex bg-[#f5f6f8]">
      <AuthBrandPanel title={brandTitle} text={brandText} />

      {/* Zone formulaire */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Bandeau de marque — mobile */}
        <div className="lg:hidden relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-14 text-white">
          <div className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <LogoIcon size={24} variant="white" />
            </span>
            <span className="font-bold text-[15px]">Dinthialma</span>
          </div>
        </div>

        <main className="flex-1 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-10">
          <div className="relative -mt-8 lg:mt-0 mx-auto w-full max-w-md bg-white lg:bg-transparent rounded-t-3xl lg:rounded-none px-5 pt-7 pb-8 lg:p-0 min-h-[calc(100dvh-7rem)] lg:min-h-0">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
              {subtitle && <p className="text-[15px] text-neutral-500 mt-1">{subtitle}</p>}
            </header>

            {children}

            {footer && <div className="mt-6">{footer}</div>}

            <p className="lg:hidden text-center text-xs text-neutral-400 mt-10">© 2026 Dinthialma</p>
          </div>
        </main>
      </div>
    </div>
  )
}

/** Panneau de marque affiché à gauche sur desktop (auth + PIN). */
export function AuthBrandPanel({
  title = ['Gérez vos tontines', 'en toute sérénité.'],
  text = 'Suivez les cotisations, validez les paiements et distribuez les jackpots — tout est centralisé.',
}: { title?: [string, string]; text?: ReactNode }) {
  return (
    <aside className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-emerald-600 flex-col justify-between px-12 py-10 text-white">
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-3">
        <LogoIcon size={36} variant="white" />
        <div>
          <p className="text-lg font-bold leading-none">Dinthialma</p>
          <p className="text-white/70 text-xs mt-1">Gestion de tontines</p>
        </div>
      </div>
      <div className="relative max-w-md">
        <h2 className="text-4xl font-bold leading-tight">{title[0]}</h2>
        <h2 className="text-4xl font-bold leading-tight text-lime-200 mb-5">{title[1]}</h2>
        <p className="text-white/80 text-base leading-relaxed">{text}</p>
      </div>
      <p className="relative text-white/60 text-sm">© 2026 Dinthialma</p>
    </aside>
  )
}

/** Indicateur d'étapes simple : « Étape 2 sur 3 · Vérification » + barre segmentée. */
export function AuthSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-6" aria-label={`Étape ${current} sur ${steps.length}`}>
      <div className="flex gap-1.5 mb-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < current ? 'bg-primary-600' : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">
        Étape {current} sur {steps.length} · <span className="font-semibold text-neutral-700">{steps[current - 1]}</span>
      </p>
    </div>
  )
}

/** Message d'erreur / succès homogène dans les formulaires d'auth. */
export function AuthAlert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'bg-red-50 border-red-100 text-red-700',
    success: 'bg-primary-50 border-primary-100 text-primary-800',
    info: 'bg-sky-50 border-sky-100 text-sky-800',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`p-3.5 border rounded-2xl text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  )
}
