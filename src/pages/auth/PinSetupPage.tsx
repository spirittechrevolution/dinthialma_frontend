import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { PinScreen, PIN_LENGTH } from '@/components/auth/PinPad'
import { useAuth } from '@/hooks/useAuth'
import { getHomePath } from '@/lib/homePath'
import { consommerRetour } from '@/lib/retour'

type SetupStep = 'create' | 'confirm'

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
    navigate(consommerRetour() ?? getHomePath(user.roles), { replace: true })
  }

  const handleKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPin((p) => p.slice(0, -1)); return }
    if (pin.length >= PIN_LENGTH) return

    const next = pin + key
    setPin(next)
    if (next.length < PIN_LENGTH) return

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

  return (
    <PinScreen
      title={step === 'create' ? 'Créez votre PIN' : 'Confirmez votre PIN'}
      subtitle={step === 'create'
        ? 'Choisissez 6 chiffres pour vous connecter rapidement, sans mot de passe.'
        : 'Saisissez à nouveau les mêmes 6 chiffres.'}
      steps={{ current: step === 'create' ? 1 : 2, total: 2 }}
      badge={
        <span className="w-16 h-16 rounded-full bg-white/15 ring-2 ring-white/25 lg:bg-primary-50 lg:ring-primary-100 flex items-center justify-center text-white lg:text-primary-700">
          {step === 'create' ? <KeyRound size={26} /> : <ShieldCheck size={26} />}
        </span>
      }
      value={pin}
      error={error}
      shake={error}
      loading={isLoading}
      loadingLabel="Configuration…"
      onKey={handleKey}
      topAction={
        <button onClick={handleSkip} className="flex items-center gap-1 h-9 px-3 rounded-full text-white/80 text-xs font-medium hover:bg-white/10">
          Plus tard <ArrowRight size={13} />
        </button>
      }
      footer={
        <button onClick={handleSkip} className="hidden lg:flex w-full items-center justify-center gap-1 h-11 rounded-full text-sm text-neutral-500 hover:bg-neutral-100">
          Configurer plus tard <ArrowRight size={14} />
        </button>
      }
    />
  )
}
