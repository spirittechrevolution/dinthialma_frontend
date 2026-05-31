import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, KeyRound, Lock, Check } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const step1Schema = z.object({
  phone: z.string().min(8, 'Numéro invalide'),
})

const step2Schema = z.object({
  code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/),
})

const step3Schema = z.object({
  newPassword: z.string().min(8, 'Au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

function ShieldIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#16a34a" />
      <path d="M16 6L8 10v6c0 5.25 3.4 10.15 8 11.35C20.6 26.15 24 21.25 24 16v-6l-8-4z" fill="white" fillOpacity="0.9" />
      <path d="M13 16l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STEPS = [
  { label: 'Téléphone', sub: 'Entrez votre numéro de téléphone' },
  { label: 'Vérification', sub: 'Confirmez votre identité par SMS' },
  { label: 'Nouveau mot de passe', sub: 'Choisissez un nouveau mot de passe' },
]

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try {
      await authService.sendForgotPasswordOtp({ phone: p })
    } catch {
      // Anti-énumération : passer à l'étape suivante même si l'API échoue
    }
    setPhone(p)
    setStep(2)
  }

  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyForgotPasswordOtp({ phone, code })
      setOtpCode(code)
      setStep(3)
    } catch {
      setError('Code incorrect ou expiré.')
    }
  }

  const onStep3 = async ({ newPassword }: Step3Data) => {
    setError(null)
    try {
      await authService.resetPassword({ phone, code: otpCode, newPassword })
      navigate('/login', { state: { passwordReset: true } })
    } catch {
      setError('Erreur lors de la réinitialisation. Recommencez.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d1f0f] flex-col justify-between px-12 py-10">
        <div className="flex items-center gap-3">
          <ShieldIcon />
          <div>
            <h1 className="text-white text-lg font-bold leading-none">Dinthialma</h1>
            <p className="text-neutral-400 text-xs">Gestion de tontines</p>
          </div>
        </div>

        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Récupérez
          </h2>
          <h2 className="text-primary-400 text-4xl font-bold leading-tight mb-6">
            votre accès.
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed">
            Réinitialisez votre mot de passe en quelques secondes<br />
            grâce à un code envoyé par SMS.
          </p>
        </div>

        <p className="text-neutral-600 text-sm">© 2026 Dinthialma</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-8 py-12">
        <div className="w-full max-w-md">

          {/* En-tête */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Mot de passe oublié</h2>
            <p className="text-neutral-500 mt-1">{STEPS[step - 1].sub}</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => {
              const n = i + 1
              const done = step > n
              const active = step === n
              return (
                <div key={s.label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      done
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : active
                        ? 'bg-white border-primary-600 text-primary-600'
                        : 'bg-white border-neutral-300 text-neutral-400'
                    }`}>
                      {done ? <Check size={16} strokeWidth={2.5} /> : n}
                    </div>
                    <span className={`text-xs font-medium text-center whitespace-nowrap ${
                      active ? 'text-primary-600' : done ? 'text-neutral-600' : 'text-neutral-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                      step > n ? 'bg-primary-600' : 'bg-neutral-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Étape 1 — Téléphone */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <Input
                label="Numéro de téléphone"
                type="tel"
                placeholder="+221 77 000 00 00"
                icon={<Phone size={16} />}
                error={form1.formState.errors.phone?.message}
                {...form1.register('phone')}
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" loading={form1.formState.isSubmitting}>
                Envoyer le code SMS
              </Button>
            </form>
          )}

          {/* Étape 2 — Code OTP */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700 text-center">
                Un code à 6 chiffres a été envoyé au <strong>{phone}</strong>
              </div>
              <Input
                label="Code de vérification"
                type="text"
                placeholder="123456"
                maxLength={6}
                icon={<KeyRound size={16} />}
                error={form2.formState.errors.code?.message}
                {...form2.register('code')}
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" loading={form2.formState.isSubmitting}>
                Vérifier le code
              </Button>
              <button
                type="button"
                onClick={() => { setError(null); form1.handleSubmit(onStep1)() }}
                className="w-full text-sm text-primary-600 hover:underline text-center"
              >
                Renvoyer le code
              </button>
            </form>
          )}

          {/* Étape 3 — Nouveau mot de passe */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={form3.formState.errors.newPassword?.message}
                {...form3.register('newPassword')}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={form3.formState.errors.confirmPassword?.message}
                {...form3.register('confirmPassword')}
              />
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" loading={form3.formState.isSubmitting}>
                Réinitialiser le mot de passe
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-neutral-500 mt-6">
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
