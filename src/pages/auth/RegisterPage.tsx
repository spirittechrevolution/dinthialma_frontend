import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, User, Lock, KeyRound, Mail, Check } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const step1Schema = z.object({
  phone: z.string().min(8, 'Numéro invalide'),
})

const step2Schema = z.object({
  code: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d{6}$/, 'Chiffres uniquement'),
})

const step3Schema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères'),
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
  { label: 'Téléphone', sub: 'Entrez votre numéro' },
  { label: 'Vérification', sub: 'Confirmez votre identité' },
  { label: 'Informations', sub: 'Finalisez votre compte' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Pré-remplissage depuis LoginPage (cas PRE_ENROLLED)
  const locationState = location.state as { phone?: string } | null
  const preFillPhone = locationState?.phone || ''

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState(preFillPhone)
  const [error, setError] = useState<string | null>(null)

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { phone: preFillPhone },
  })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try {
      await authService.sendRegisterOtp({ phone: p })
      setPhone(p)
      setStep(2)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('Ce numéro de téléphone est déjà utilisé.')
      } else {
        setError('Impossible d\'envoyer le code. Vérifiez votre numéro.')
      }
    }
  }

  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyRegisterOtp({ phone, code })
      setStep(3)
    } catch {
      setError('Code incorrect ou expiré.')
    }
  }

  const onStep3 = async ({ firstName, lastName, password, email }: Step3Data) => {
    setError(null)
    try {
      const result = await authService.registerComplete({ phone, firstName, lastName, password, email: email || undefined })

      // Activation d'un compte PRE_ENROLLED : déjà membre d'une tontine
      if (result.role === 'DINTHIALMA_MEMBER') {
        navigate('/member/tontines', {
          replace: true,
          state: { welcomeActivated: true },
        })
      } else {
        navigate('/login', { state: { registered: true } })
      }
    } catch {
      setError('Erreur lors de la création du compte. Réessayez.')
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
            Rejoignez la
          </h2>
          <h2 className="text-primary-400 text-4xl font-bold leading-tight mb-6">
            communauté.
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed">
            Créez votre compte en quelques étapes et commencez<br />
            à gérer vos tontines dès aujourd'hui.
          </p>
        </div>

        <p className="text-neutral-600 text-sm">© 2026 Dinthialma</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-8 py-12">
        <div className="w-full max-w-md">

          {/* Bandeau PRE_ENROLLED */}
          {preFillPhone && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-800">
              Votre compte a été créé par votre gestionnaire. Complétez votre inscription pour accéder à vos tontines.
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Créer un compte</h2>
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
                    <span className={`text-xs font-medium whitespace-nowrap ${
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
                Recevoir le code SMS
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

          {/* Étape 3 — Informations personnelles */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Prénom"
                  placeholder="Mamadou"
                  icon={<User size={16} />}
                  error={form3.formState.errors.firstName?.message}
                  {...form3.register('firstName')}
                />
                <Input
                  label="Nom"
                  placeholder="Diallo"
                  icon={<User size={16} />}
                  error={form3.formState.errors.lastName?.message}
                  {...form3.register('lastName')}
                />
              </div>
              <Input
                label="Email (optionnel)"
                type="email"
                placeholder="mamadou@email.com"
                icon={<Mail size={16} />}
                error={form3.formState.errors.email?.message}
                {...form3.register('email')}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={form3.formState.errors.password?.message}
                {...form3.register('password')}
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
                Créer mon compte
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-neutral-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
