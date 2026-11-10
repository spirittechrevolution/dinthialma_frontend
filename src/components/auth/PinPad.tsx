import { ReactNode, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Delete } from 'lucide-react'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { AuthBrandPanel } from './AuthShell'

export const PIN_LENGTH = 6

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/**
 * Pastilles de saisie du PIN.
 * Couleurs responsives : blanches sur le fond vert mobile, vertes sur fond clair desktop.
 */
export function PinDots({ value, error = false, length = PIN_LENGTH }: { value: string; error?: boolean; length?: number }) {
  return (
    <div className="flex items-center justify-center gap-3.5 my-7" aria-label={`${value.length} chiffre(s) saisi(s) sur ${length}`}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length
        return (
          <span
            key={i}
            className={clsx(
              'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
              error
                ? 'bg-red-400 border-red-400'
                : filled
                ? 'bg-white border-white scale-110 lg:bg-primary-600 lg:border-primary-600'
                : 'bg-transparent border-white/60 lg:border-neutral-300'
            )}
          />
        )
      })}
    </div>
  )
}

/** Clavier numérique à touches rondes (style Wave). */
export function PinPad({
  onKey,
  disabled = false,
  value,
  length = PIN_LENGTH,
}: {
  onKey: (key: string) => void
  disabled?: boolean
  value: string
  length?: number
}) {
  const keyCls =
    'w-[72px] h-[72px] rounded-full flex items-center justify-center select-none transition-colors ' +
    'text-white bg-white/10 active:bg-white/30 ' +
    'lg:text-neutral-900 lg:bg-white lg:border lg:border-neutral-200 lg:hover:bg-neutral-50 lg:active:bg-neutral-100 ' +
    'disabled:opacity-30 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:focus-visible:ring-primary-500'

  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-4 justify-items-center w-fit mx-auto">
      {KEYS.map((key, i) => {
        if (key === '') return <span key={i} />
        if (key === 'del') {
          return (
            <button
              key={i}
              type="button"
              aria-label="Effacer"
              onPointerDown={(e) => { e.preventDefault(); onKey('del') }}
              disabled={disabled || value.length === 0}
              className={clsx(keyCls, '!bg-transparent lg:!border-transparent')}
            >
              <Delete size={26} />
            </button>
          )
        }
        return (
          <button
            key={i}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onKey(key) }}
            disabled={disabled || value.length >= length}
            className={clsx(keyCls, 'text-[28px] font-medium')}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Saisie du PIN au clavier physique (chiffres, pavé numérique, Retour arrière).
 * Avant, sur ordinateur, il fallait cliquer chaque touche à l'écran.
 */
export function usePinKeyboard(onKey: (key: string) => void, enabled = true) {
  const handler = useRef(onKey)
  handler.current = onKey

  useEffect(() => {
    if (!enabled) return
    const listener = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); handler.current(e.key) }
      else if (e.key === 'Backspace') { e.preventDefault(); handler.current('del') }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [enabled])
}

interface PinScreenProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Visuel au-dessus du titre (avatar, icône…) */
  badge?: ReactNode
  /** Progression (ex : 2 sur 2) */
  steps?: { current: number; total: number }
  value: string
  error?: boolean
  shake?: boolean
  loading?: boolean
  loadingLabel?: string
  onKey: (key: string) => void
  /** Action discrète en haut à droite (mobile) */
  topAction?: ReactNode
  /** Liens sous le clavier */
  footer?: ReactNode
}

/**
 * Écran PIN unique (rendu une seule fois) :
 * - Mobile : plein écran vert, clavier rond en bas, à portée de pouce
 * - Desktop : panneau de marque + carte claire
 */
export function PinScreen({
  title, subtitle, badge, steps, value, error, shake, loading, loadingLabel = 'Vérification…', onKey, topAction, footer,
}: PinScreenProps) {
  usePinKeyboard(onKey, !loading)

  return (
    <div className="min-h-[100dvh] lg:flex">
      <AuthBrandPanel />

      <div className="flex-1 min-h-[100dvh] flex flex-col bg-gradient-to-b from-primary-700 via-primary-600 to-emerald-600 lg:bg-none lg:bg-[#f5f6f8] lg:items-center lg:justify-center">
        {/* Barre du haut — mobile */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><LogoIcon size={22} /></span>
            <span className="text-white font-bold text-sm">Dinthialma</span>
          </div>
          {topAction}
        </div>

        {/* Zone centrale */}
        <div className="flex-1 lg:flex-none flex flex-col items-center justify-center px-6 text-center lg:w-full lg:max-w-sm lg:pt-0">
          {steps && (
            <div className="flex items-center gap-1.5 mb-6">
              {Array.from({ length: steps.total }).map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    'h-1.5 rounded-full transition-all',
                    i < steps.current ? 'w-8 bg-white lg:bg-primary-600' : 'w-4 bg-white/30 lg:bg-neutral-200'
                  )}
                />
              ))}
            </div>
          )}
          {badge && <div className="mb-4">{badge}</div>}
          <h1 className="text-2xl font-bold text-white lg:text-neutral-900">{title}</h1>
          {subtitle && <p className="text-[15px] text-white/75 lg:text-neutral-500 mt-1 max-w-xs">{subtitle}</p>}

          <div className={shake ? 'animate-shake' : ''}>
            <PinDots value={value} error={error} />
          </div>

          <div className="h-6 -mt-3 mb-1">
            {loading && (
              <span className="inline-flex items-center gap-2 text-sm text-white/80 lg:text-neutral-500">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white lg:border-neutral-300 lg:border-t-primary-600 rounded-full animate-spin" />
                {loadingLabel}
              </span>
            )}
          </div>
        </div>

        {/* Clavier + liens */}
        <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:w-full lg:max-w-sm lg:pb-0">
          <PinPad onKey={onKey} disabled={loading} value={value} />
          {footer && <div className="mt-6">{footer}</div>}
          <p className="hidden lg:block text-center text-xs text-neutral-400 mt-8">
            Astuce : vous pouvez aussi taper votre code au clavier.
          </p>
        </div>
      </div>
    </div>
  )
}
