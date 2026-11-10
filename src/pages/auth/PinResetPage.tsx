import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zPhone } from '@/lib/validation'
import { toast } from 'sonner'
import { Phone, KeyRound, Check, ArrowLeft, ShieldCheck } from 'lucide-react'
import { authService } from '@/services/authService'
import { getUserPhone } from '@/lib/tokenStorage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AuthShell, AuthSteps, AuthAlert } from '@/components/auth/AuthShell'
import { PinScreen, PIN_LENGTH } from '@/components/auth/PinPad'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const step1Schema = z.object({ phone: zPhone })
const step2Schema = z.object({ code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/) })

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

type Step = 'phone' | 'otp' | 'newpin' | 'confirmpin'
const STEP_LABELS = ['Téléphone', 'Vérification', 'Nouveau PIN', 'Confirmation']
const STEP_INDEX: Record<Step, number> = { phone: 1, otp: 2, newpin: 3, confirmpin: 4 }

export function PinResetPage() {
  const navigate = useNavigate()
  const storedPhone = getUserPhone()

  // Toujours commencer par l'étape téléphone (pré-remplie si connue) :
  // avant, on sautait directement à « Code envoyé » sans jamais envoyer le SMS.
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState(storedPhone || '')
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinInput, setPinInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { phone: storedPhone || '+221' } })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  // Étape 1 — envoi OTP
  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try { await authService.sendPinResetOtp({ phone: p }) } catch { /* anti-énumération */ }
    setPhone(p)
    setStep('otp')
  }

  const resendOtp = async () => {
    setError(null)
    try { await authService.sendPinResetOtp({ phone }) } catch { /* anti-énumération */ }
    toast.success('Nouveau code envoyé')
  }

  // Étape 2 — vérification OTP
  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyPinResetOtp({ phone, code })
      setOtp(code)
      setStep('newpin')
    } catch { setError('Code incorrect ou expiré.') }
  }

  // Étapes 3 & 4 — saisie PIN via clavier
  const handlePinKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPinInput((p) => p.slice(0, -1)); return }
    if (pinInput.length >= PIN_LENGTH) return

    const next = pinInput + key
    setPinInput(next)
    if (next.length < PIN_LENGTH) return

    if (step === 'newpin') {
      setNewPin(next)
      setPinInput('')
      setStep('confirmpin')
      return
    }

    // Confirmation
    if (next !== newPin) {
      setPinError(true)
      setTimeout(() => { setPinError(false); setPinInput(''); setStep('newpin'); setNewPin('') }, 700)
      toast.error('Les codes ne correspondent pas.')
      return
    }

    setIsLoading(true)
    try {
      await authService.resetPin({ phone, otp, newPin: next, confirmPin: next })
      toast.success('PIN réinitialisé avec succès !')
      navigate('/pin', { replace: true })
    } catch {
      toast.error('Erreur. Recommencez.')
      setPinInput(''); setStep('newpin'); setNewPin('')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Étapes PIN (clavier) ──────────────────────────────────────────────────
  if (step === 'newpin' || step === 'confirmpin') {
    return (
      <PinScreen
        title={step === 'newpin' ? 'Nouveau PIN' : 'Confirmez le PIN'}
        subtitle={step === 'newpin' ? 'Choisissez 6 chiffres.' : 'Saisissez à nouveau les mêmes 6 chiffres.'}
        steps={{ current: STEP_INDEX[step], total: 4 }}
        badge={
          <span className="w-16 h-16 rounded-full bg-white/15 ring-2 ring-white/25 lg:bg-primary-50 lg:ring-primary-100 flex items-center justify-center text-white lg:text-primary-700">
            {step === 'newpin' ? <KeyRound size={26} /> : <ShieldCheck size={26} />}
          </span>
        }
        value={pinInput}
        error={pinError}
        shake={pinError}
        loading={isLoading}
        loadingLabel="Enregistrement…"
        onKey={handlePinKey}
      />
    )
  }

  // ─── Étapes téléphone / OTP ────────────────────────────────────────────────
  return (
    <AuthShell
      title="Réinitialiser le PIN"
      subtitle={step === 'phone' ? 'Nous allons vous envoyer un code par SMS.' : 'Saisissez le code reçu par SMS.'}
      brandTitle={['Un nouveau PIN', 'en quelques secondes.']}
      brandText="Confirmez votre identité par SMS puis choisissez un nouveau code à 6 chiffres."
      footer={
        <p className="text-center">
          <Link to="/pin" className="inline-flex items-center gap-1 text-[15px] text-primary-700 font-semibold hover:underline">
            <ArrowLeft size={16} /> Retour
          </Link>
        </p>
      }
    >
      <AuthSteps steps={STEP_LABELS} current={STEP_INDEX[step]} />

      {step === 'phone' && (
        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
          <PhoneInput name="phone" control={form1.control} label="Numéro de téléphone"
            type="tel" inputMode="tel" autoComplete="tel" placeholder="77 000 00 00" icon={<Phone size={16} />}
            error={form1.formState.errors.phone?.message} />
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form1.formState.isSubmitting}>
            Recevoir le code SMS
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 bg-primary-50 border border-primary-100 rounded-2xl text-sm text-primary-800">
            <span>Code envoyé au <strong>{phone}</strong></span>
            <button type="button" onClick={() => { setError(null); setStep('phone') }} className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline flex-shrink-0">
              <ArrowLeft size={14} /> Modifier
            </button>
          </div>
          <Input label="Code de vérification" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
            placeholder="123456" maxLength={6}
            icon={<KeyRound size={16} />} error={form2.formState.errors.code?.message}
            {...form2.register('code')} />
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form2.formState.isSubmitting}>
            <Check size={18} /> Vérifier le code
          </Button>
          <button type="button" onClick={resendOtp} className="w-full h-11 text-sm text-primary-700 font-semibold text-center hover:underline">
            Renvoyer le code
          </button>
        </form>
      )}
    </AuthShell>
  )
}
