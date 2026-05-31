import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, KeyRound, Lock } from 'lucide-react'
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
      setPhone(p)
      setStep(2)
    } catch {
      // Anti-énumération : l'API répond toujours 200
      setPhone(p)
      setStep(2)
    }
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

  const stepLabels = ['Téléphone', 'Vérification', 'Nouveau mot de passe']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Mot de passe oublié</h1>
          <p className="text-neutral-500 mt-1 text-sm">Réinitialisez votre mot de passe par SMS</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done ? 'bg-primary-500 text-white' :
                  active ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
                  'bg-neutral-200 text-neutral-500'
                }`}>
                  {done ? '✓' : n}
                </div>
                <span className={`text-xs font-medium text-center ${active ? 'text-primary-600' : 'text-neutral-400'}`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

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
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={form1.formState.isSubmitting}>
              Envoyer le code SMS
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
            <p className="text-sm text-neutral-600 text-center">
              Code envoyé au <strong>{phone}</strong>
            </p>
            <Input
              label="Code OTP"
              type="text"
              placeholder="123456"
              maxLength={6}
              icon={<KeyRound size={16} />}
              error={form2.formState.errors.code?.message}
              {...form2.register('code')}
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={form2.formState.isSubmitting}>
              Vérifier
            </Button>
          </form>
        )}

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
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={form3.formState.isSubmitting}>
              Réinitialiser
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
  )
}
