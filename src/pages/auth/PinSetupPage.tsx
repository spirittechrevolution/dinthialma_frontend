import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Delete, ArrowRight } from 'lucide-react'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

type SetupStep = 'create' | 'confirm'

function PinDots({ value, length = 6, error = false, dark = false }: {
  value: string; length?: number; error?: boolean; dark?: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length }).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
          error
            ? 'bg-red-400 border-red-400'
            : dark
            ? i < value.length
              ? 'bg-primary-600 border-primary-600 scale-110'
              : 'bg-transparent border-neutral-300'
            : i < value.length
            ? 'bg-white border-white scale-110'
            : 'bg-transparent border-white/50'
        }`} />
      ))}
    </div>
  )
}

export function PinSetupPage() {
  const navigate = useNavigate()
  const { setupPin, user } = useAuth()

  const [step, setStep] = useState<SetupStep>('create')
  const [firstPin, setFirstPin] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)

  const redirectAfterLogin = () => {
    if (!user) { navigate('/login', { replace: true }); return }
    if (user.roles.includes(UserRole.SUPER_ADMIN)) navigate('/dashboard', { replace: true })
    else if (user.roles.includes(UserRole.ADMIN)) navigate('/admin/dashboard', { replace: true })
    else if (user.roles.includes(UserRole.MEMBER)) navigate('/member/dashboard', { replace: true })
    else navigate('/profile', { replace: true })
  }

  const handleKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPin((p) => p.slice(0, -1)); return }

    const next = pin + key
    setPin(next)
    if (next.length < 6) return

    if (step === 'create') {
      setFirstPin(next)
      setPin('')
      setStep('confirm')
      return
    }

    if (next !== firstPin) {
      setError(true)
      setTimeout(() => { setError(false); setPin(''); setStep('create'); setFirstPin('') }, 700)
      toast.error('Les codes ne correspondent pas. Recommencez.')
      return
    }

    setIsLoading(true)
    try {
      await setupPin(next, next)
      toast.success('PIN configuré avec succès !')
      redirectAfterLogin()
    } catch {
      toast.error('Erreur lors de la configuration. Réessayez.')
      setPin('')
      setStep('create')
      setFirstPin('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => redirectAfterLogin()

  // ─── Clavier partagé ──────────────────────────────────────────────────────
  const Numpad = ({ dark = false }: { dark?: boolean }) => (
    <div className="grid grid-rows-4 gap-3">
      {PAD.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-3">
          {row.map((key, ki) => {
            if (key === '') return <div key={ki} />
            if (key === 'del') {
              return (
                <button key={ki}
                  onPointerDown={(e) => { e.preventDefault(); handleKey('del') }}
                  disabled={isLoading || pin.length === 0}
                  className={`h-14 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-30 ${
                    dark
                      ? 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300'
                      : 'bg-white/10 active:bg-white/25'
                  }`}>
                  <Delete size={20} className={dark ? 'text-neutral-700' : 'text-white'} />
                </button>
              )
            }
            return (
              <button key={ki}
                onPointerDown={(e) => { e.preventDefault(); handleKey(key) }}
                disabled={isLoading || pin.length >= 6}
                className={`h-14 rounded-2xl flex items-center justify-center transition-colors text-2xl font-semibold disabled:opacity-30 select-none ${
                  dark
                    ? 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900'
                    : 'bg-white/10 active:bg-white/25 text-white'
                }`}>
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )

  // ─── Layout desktop ────────────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen">
      {/* Panneau gauche */}
      <div className="w-1/2 bg-[#0d1f0f] flex flex-col justify-between px-12 py-10">
        <div className="flex items-center gap-3">
          <LogoIcon size={36} />
          <div>
            <h1 className="text-white text-lg font-bold leading-none">Dinthialma</h1>
            <p className="text-neutral-400 text-xs">Gestion de tontines</p>
          </div>
        </div>
        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">Gérez vos tontines</h2>
          <h2 className="text-primary-400 text-4xl font-bold leading-tight mb-6">en toute sérénité.</h2>
          <p className="text-neutral-400 text-base leading-relaxed">
            Suivez les cotisations, validez les paiements,<br />distribuez les jackpots — tout est centralisé.
          </p>
        </div>
        <p className="text-neutral-600 text-sm">© 2026 Dinthialma</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-8">
        <div className="w-full max-w-sm">
          {/* Indicateur étapes */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-1 rounded-full ${step === 'create' ? 'bg-primary-600' : 'bg-primary-400'}`} />
            <div className={`w-8 h-1 rounded-full ${step === 'confirm' ? 'bg-primary-600' : 'bg-neutral-200'}`} />
          </div>

          <div className="mb-2">
            <h2 className="text-2xl font-bold text-neutral-900">
              {step === 'create' ? 'Créer votre PIN' : 'Confirmez votre PIN'}
            </h2>
            <p className="text-neutral-500 mt-1 text-sm">
              {step === 'create'
                ? 'Choisissez un code PIN à 6 chiffres pour vous connecter rapidement.'
                : 'Entrez à nouveau votre code PIN pour confirmer.'}
            </p>
          </div>

          <PinDots value={pin} error={error} dark />

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm mb-4">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
              Configuration...
            </div>
          )}

          <Numpad dark />

          <button
            onClick={handleSkip}
            className="w-full flex items-center justify-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 mt-5 transition-colors"
          >
            Passer cette étape <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  // ─── Layout mobile ─────────────────────────────────────────────────────────
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen flex flex-col bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <LogoIcon size={22} />
          </div>
          <span className="text-white font-bold text-sm">Dinthialma</span>
        </div>
        <button onClick={handleSkip} className="flex items-center gap-1 text-white/60 text-xs hover:text-white transition-colors">
          Passer <ArrowRight size={12} />
        </button>
      </div>

      {/* Zone centrale */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-1 rounded-full ${step === 'create' ? 'bg-white' : 'bg-primary-400'}`} />
          <div className={`w-8 h-1 rounded-full ${step === 'confirm' ? 'bg-white' : 'bg-white/30'}`} />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-4 ring-2 ring-white/20">
          <span className="text-3xl">{step === 'create' ? '🔑' : '✅'}</span>
        </div>

        <p className="text-white text-xl font-bold mb-1">
          {step === 'create' ? 'Créer votre PIN' : 'Confirmez votre PIN'}
        </p>
        <p className="text-white/60 text-sm text-center max-w-xs">
          {step === 'create'
            ? 'Choisissez un code PIN à 6 chiffres pour vous connecter rapidement.'
            : 'Entrez à nouveau votre code PIN pour confirmer.'}
        </p>

        <PinDots value={pin} error={error} />

        {isLoading && (
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Configuration...
          </div>
        )}
      </div>

      {/* Clavier */}
      <div className="px-8 pb-12">
        <Numpad />
      </div>
    </div>
  )

  return (
    <>
      <DesktopLayout />
      <MobileLayout />
    </>
  )
}
