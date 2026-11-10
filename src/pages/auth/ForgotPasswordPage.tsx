import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zPhone } from '@/lib/validation'
import { Phone, KeyRound, Lock, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AuthShell, AuthSteps, AuthAlert } from '@/components/auth/AuthShell'

const step1Schema = z.object({ phone: zPhone })
const step2Schema = z.object({ code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/) })
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

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { phone: '+221' } })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try { await authService.sendForgotPasswordOtp({ phone: p }) } catch { /* anti-enumération */ }
    setPhone(p)
    setStep(2)
  }

  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyForgotPasswordOtp({ phone, code })
      setOtpCode(code)
      setStep(3)
    } catch { setError('Code incorrect ou expiré.') }
  }

  const onStep3 = async ({ newPassword }: Step3Data) => {
    setError(null)
    try {
      await authService.resetPassword({ phone, code: otpCode, newPassword })
      navigate('/login', { state: { passwordReset: true } })
    } catch { setError('Erreur lors de la réinitialisation. Recommencez.') }
  }


  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle={['Entrez votre numéro de téléphone.', 'Saisissez le code reçu par SMS.', 'Choisissez un nouveau mot de passe.'][step - 1]}
      brandTitle={['Récupérez', 'votre accès.']}
      brandText="Réinitialisez votre mot de passe en quelques secondes grâce à un code SMS."
      footer={
        <p className="text-center">
          <Link to="/login" className="inline-flex items-center gap-1 text-[15px] text-primary-700 font-semibold hover:underline">
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>
        </p>
      }
    >
      <AuthSteps steps={['Téléphone', 'Vérification', 'Nouveau mot de passe']} current={step} />
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
          <PhoneInput name="phone" control={form1.control} label="Numéro de téléphone"
            type="tel" inputMode="tel" autoComplete="tel" placeholder="77 000 00 00" icon={<Phone size={16}/>}
            error={form1.formState.errors.phone?.message}/>
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form1.formState.isSubmitting}>
            Envoyer le code SMS
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 bg-primary-50 border border-primary-100 rounded-2xl text-sm text-primary-800">
            <span>Code envoyé au <strong>{phone}</strong></span>
            <button type="button" onClick={() => { setError(null); setStep(1) }} className="inline-flex items-center gap-1 font-semibold text-primary-700 hover:underline flex-shrink-0">
              <ArrowLeft size={14} /> Modifier
            </button>
          </div>
          <Input label="Code de vérification" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="123456" maxLength={6}
            icon={<KeyRound size={16}/>} error={form2.formState.errors.code?.message}
            {...form2.register('code')}/>
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form2.formState.isSubmitting}>
            Vérifier le code
          </Button>
          <button type="button" onClick={() => { setError(null); form1.handleSubmit(onStep1)() }}
            className="w-full h-11 text-sm text-primary-700 font-semibold text-center hover:underline">
            Renvoyer le code
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
          <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" icon={<Lock size={16}/>}
            error={form3.formState.errors.newPassword?.message} {...form3.register('newPassword')}/>
          <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••" icon={<Lock size={16}/>}
            error={form3.formState.errors.confirmPassword?.message} {...form3.register('confirmPassword')}/>
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form3.formState.isSubmitting}>
            Réinitialiser le mot de passe
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
