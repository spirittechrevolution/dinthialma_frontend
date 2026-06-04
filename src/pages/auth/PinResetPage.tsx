import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Phone, KeyRound, Delete, Check } from 'lucide-react'
import { authService } from '@/services/authService'
import { getUserPhone } from '@/lib/tokenStorage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const step1Schema = z.object({ phone: z.string().min(8, 'Numéro invalide') })
const step2Schema = z.object({ code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/) })

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

function PinDots({ value, error }: { value: string; error?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
          error ? 'bg-red-400 border-red-400'
            : i < value.length ? 'bg-white border-white scale-110'
            : 'bg-transparent border-white/50'
        }`} />
      ))}
    </div>
  )
}

type Step = 'phone' | 'otp' | 'newpin' | 'confirmpin'

export function PinResetPage() {
  const navigate = useNavigate()
  const storedPhone = getUserPhone()

  const [step, setStep] = useState<Step>(storedPhone ? 'otp' : 'phone')
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

  // Étape 2 — vérification OTP
  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyPinResetOtp({ phone, code })
      setOtp(code)
      setStep('newpin')
    } catch { setError('Code incorrect ou expiré.') }
  }

  // Étape 3 & 4 — saisie PIN via clavier
  const handlePinKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPinInput((p) => p.slice(0, -1)); return }

    const next = pinInput + key
    setPinInput(next)
    if (next.length < 6) return

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

  // ─── Layout commun ─────────────────────────────────────────────────────────
  const isPinStep = step === 'newpin' || step === 'confirmpin'

  if (isPinStep) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600">
        <div className="flex items-center px-5 pt-12 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path d="M16 3L6 8v7c0 6.55 4.25 12.68 10 14.19C21.75 27.68 26 21.55 26 15V8L16 3z" fill="white" fillOpacity="0.95"/>
                <path d="M12 15.5l3 3 5-5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-sm">Dinthialma</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-1 rounded-full bg-primary-400" />
            <div className="w-8 h-1 rounded-full bg-primary-400" />
            <div className={`w-8 h-1 rounded-full ${step === 'newpin' ? 'bg-white' : 'bg-primary-400'}`} />
            <div className={`w-8 h-1 rounded-full ${step === 'confirmpin' ? 'bg-white' : 'bg-white/30'}`} />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-4 ring-2 ring-white/20">
            <span className="text-3xl">🔑</span>
          </div>

          <p className="text-white text-xl font-bold mb-1">
            {step === 'newpin' ? 'Nouveau PIN' : 'Confirmez le PIN'}
          </p>
          <p className="text-white/60 text-sm">
            {step === 'newpin' ? 'Choisissez un code à 6 chiffres.' : 'Entrez à nouveau votre nouveau PIN.'}
          </p>

          <PinDots value={pinInput} error={pinError} />
          {isLoading && <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        </div>

        <div className="px-8 pb-12">
          <div className="grid grid-rows-4 gap-3">
            {PAD.map((row, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-3">
                {row.map((key, ki) => {
                  if (key === '') return <div key={ki} />
                  if (key === 'del') return (
                    <button key={ki} onPointerDown={(e) => { e.preventDefault(); handlePinKey('del') }}
                      disabled={isLoading || pinInput.length === 0}
                      className="h-16 rounded-2xl bg-white/10 active:bg-white/25 flex items-center justify-center disabled:opacity-30">
                      <Delete size={22} className="text-white" />
                    </button>
                  )
                  return (
                    <button key={ki} onPointerDown={(e) => { e.preventDefault(); handlePinKey(key) }}
                      disabled={isLoading || pinInput.length >= 6}
                      className="h-16 rounded-2xl bg-white/10 active:bg-white/25 flex items-center justify-center text-white text-2xl font-semibold disabled:opacity-30 select-none">
                      {key}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── Étapes phone / OTP ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 lg:bg-white">
      {/* Header mobile */}
      <div className="lg:hidden relative bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600 pt-12 pb-20 px-6 text-center">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center ring-2 ring-white/20">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L6 8v7c0 6.55 4.25 12.68 10 14.19C21.75 27.68 26 21.55 26 15V8L16 3z" fill="white" fillOpacity="0.95"/>
              <path d="M12 15.5l3 3 5-5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white text-lg font-extrabold">Réinitialiser le PIN</p>
            <p className="text-white/60 text-xs mt-0.5">
              {step === 'phone' ? 'Entrez votre numéro' : 'Vérifiez votre identité'}
            </p>
          </div>
        </div>
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {['phone', 'otp', 'newpin', 'confirmpin'].map((s, i) => {
            const steps = ['phone', 'otp', 'newpin', 'confirmpin']
            const curr = steps.indexOf(step)
            return (
              <div key={s} className={`h-1 rounded-full transition-all ${
                i <= curr ? 'w-8 bg-white' : 'w-4 bg-white/30'
              }`} />
            )
          })}
        </div>
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 390 32" preserveAspectRatio="none" className="w-full h-8 fill-neutral-50">
            <path d="M0 32 C97.5 0 292.5 0 390 32 L390 32 L0 32 Z"/>
          </svg>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-5 py-6 lg:flex lg:items-center lg:justify-center">
        <div className="w-full max-w-md">
          {/* Desktop header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Réinitialiser le PIN</h2>
            <p className="text-neutral-500 mt-1">
              {step === 'phone' ? 'Entrez votre numéro de téléphone' : 'Entrez le code reçu par SMS'}
            </p>
          </div>

          {step === 'phone' && (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <PhoneInput name="phone" control={form1.control} label="Numéro de téléphone"
                type="tel" placeholder="77 000 00 00" icon={<Phone size={16}/>}
                error={form1.formState.errors.phone?.message}/>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <Button type="submit" className="w-full" size="lg" loading={form1.formState.isSubmitting}>
                Envoyer le code SMS
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700 text-center">
                Code envoyé au <strong>{phone}</strong>
              </div>
              <Input label="Code de vérification" type="text" placeholder="123456" maxLength={6}
                icon={<KeyRound size={16}/>} error={form2.formState.errors.code?.message}
                {...form2.register('code')}/>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
              <Button type="submit" className="w-full" size="lg" loading={form2.formState.isSubmitting}>
                <Check size={16} /> Vérifier le code
              </Button>
            </form>
          )}

          <p className="text-center mt-5">
            <Link to="/pin" className="text-sm text-primary-600 font-medium hover:underline">
              ← Retour
            </Link>
          </p>
          <p className="text-center text-xs text-neutral-400 mt-4">© 2026 Dinthialma</p>
        </div>
      </div>
    </div>
  )
}
