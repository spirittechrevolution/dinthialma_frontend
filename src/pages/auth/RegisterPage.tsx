import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { zPhone, zNom } from '@/lib/validation'
import { Phone, User, Lock, KeyRound, Mail, ArrowLeft } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AuthShell, AuthSteps, AuthAlert } from '@/components/auth/AuthShell'
import { parseApiError } from '@/lib/apiError'

const step1Schema = z.object({
  phone: zPhone,
})
const step2Schema = z.object({
  code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/, 'Chiffres uniquement'),
})
const step3Schema = z.object({
  firstName: zNom(100),
  lastName: zNom(100),
  password: z.string().min(8, 'Au moins 8 caractères'),
  confirmPassword: z.string(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>


// ─── Stepper compact ──────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as { phone?: string } | null
  const preFillPhone = locationState?.phone || ''

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState(preFillPhone)
  const [error, setError] = useState<string | null>(null)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { phone: preFillPhone || '+221' } })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try {
      await authService.sendRegisterOtp({ phone: p })
      setPhone(p)
      setStep(2)
    } catch (err: unknown) {
      const { code } = parseApiError(err, 'register')
      setError(code === 'PHONE_ALREADY_USED' ? 'Ce numéro est déjà utilisé.' : "Impossible d'envoyer le code. Vérifiez votre numéro.")
    }
  }

  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyRegisterOtp({ phone, code })
      setStep(3)
    } catch { setError('Code incorrect ou expiré.') }
  }

  const onStep3 = async ({ firstName, lastName, password, email }: Step3Data) => {
    setError(null)
    try {
      const result = await authService.registerComplete({ phone, firstName, lastName, password, email: email || undefined })
      if (result.role === 'DINTHIALMA_MEMBER') {
        navigate('/tontines', { replace: true, state: { welcomeActivated: true } })
      } else {
        navigate('/login', { state: { registered: true } })
      }
    } catch { setError('Erreur lors de la création. Réessayez.') }
  }

  // ─── Formulaires par étape ─────────────────────────────────────────────────

  return (
    <AuthShell
      title="Créer un compte"
      subtitle={['Entrez votre numéro de téléphone.', 'Saisissez le code reçu par SMS.', 'Finalisez votre compte.'][step - 1]}
      brandTitle={['Rejoignez la', 'communauté.']}
      brandText="Créez votre compte en quelques étapes et commencez à gérer vos tontines dès aujourd'hui."
      footer={
        <p className="text-center text-[15px] text-neutral-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-700 font-bold hover:underline">Se connecter</Link>
        </p>
      }
    >
      <AuthSteps steps={['Téléphone', 'Vérification', 'Informations']} current={step} />
      {preFillPhone && step === 1 && (
        <div className="mb-4">
          <AuthAlert tone="info">
            Votre compte a été créé par votre gestionnaire. Complétez votre inscription pour accéder à vos tontines.
          </AuthAlert>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
          <PhoneInput name="phone" control={form1.control} label="Numéro de téléphone"
            type="tel" inputMode="tel" autoComplete="tel" placeholder="77 000 00 00" icon={<Phone size={16}/>}
            error={form1.formState.errors.phone?.message}/>
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form1.formState.isSubmitting}>
            Recevoir le code SMS
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" placeholder="Prénom" icon={<User size={16}/>}
              error={form3.formState.errors.firstName?.message} {...form3.register('firstName')}/>
            <Input label="Nom" placeholder="Nom" icon={<User size={16}/>}
              error={form3.formState.errors.lastName?.message} {...form3.register('lastName')}/>
          </div>
          <Input label="Email (optionnel)" type="email" placeholder="mon_email@email.com" icon={<Mail size={16}/>}
            error={form3.formState.errors.email?.message} {...form3.register('email')}/>
          <Input label="Mot de passe" type="password" placeholder="••••••••" icon={<Lock size={16}/>}
            error={form3.formState.errors.password?.message} {...form3.register('password')}/>
          <Input label="Confirmer" type="password" placeholder="••••••••" icon={<Lock size={16}/>}
            error={form3.formState.errors.confirmPassword?.message} {...form3.register('confirmPassword')}/>
          {error && <AuthAlert>{error}</AuthAlert>}
          <Button type="submit" className="w-full" size="lg" loading={form3.formState.isSubmitting}>
            Créer mon compte
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
