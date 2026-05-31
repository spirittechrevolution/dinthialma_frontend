import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, User, Lock, KeyRound } from 'lucide-react'
import { authService } from '@/services/authService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ─── Étape 1 : saisie du numéro ───────────────────────────────────────────────
const step1Schema = z.object({
  phone: z.string().min(8, 'Numéro invalide'),
})

// ─── Étape 2 : vérification OTP ──────────────────────────────────────────────
const step2Schema = z.object({
  code: z.string().length(6, 'Le code doit contenir 6 chiffres').regex(/^\d{6}$/, 'Chiffres uniquement'),
})

// ─── Étape 3 : création du compte ────────────────────────────────────────────
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

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ─── Formulaires par étape ────────────────────────────────────────────────
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) })

  // ─── Étape 1 : envoi OTP ─────────────────────────────────────────────────
  const onStep1 = async ({ phone: p }: Step1Data) => {
    setError(null)
    try {
      await authService.sendRegisterOtp({ phone: p })
      setPhone(p)
      setStep(2)
    } catch {
      setError('Impossible d\'envoyer le code. Vérifiez votre numéro.')
    }
  }

  // ─── Étape 2 : vérification OTP ──────────────────────────────────────────
  const onStep2 = async ({ code }: Step2Data) => {
    setError(null)
    try {
      await authService.verifyRegisterOtp({ phone, code })
      setStep(3)
    } catch {
      setError('Code incorrect ou expiré.')
    }
  }

  // ─── Étape 3 : création du compte ────────────────────────────────────────
  const onStep3 = async ({ firstName, lastName, password, email }: Step3Data) => {
    setError(null)
    try {
      await authService.registerComplete({
        phone,
        firstName,
        lastName,
        password,
        email: email || undefined,
      })
      navigate('/login', { state: { registered: true } })
    } catch {
      setError('Erreur lors de la création du compte. Réessayez.')
    }
  }

  const stepLabels = ['Téléphone', 'Vérification', 'Informations']

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">Dinthialma</h1>
          <p className="text-neutral-500 mt-1">Créer un compte</p>
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
                <span className={`text-xs font-medium ${active ? 'text-primary-600' : 'text-neutral-400'}`}>
                  {label}
                </span>
                {i < 2 && <div className={`absolute hidden`} />}
              </div>
            )
          })}
        </div>

        {/* ─── Étape 1 ─────────────────────────────────────────────────────── */}
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
              Recevoir le code SMS
            </Button>
          </form>
        )}

        {/* ─── Étape 2 ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
            <p className="text-sm text-neutral-600 text-center">
              Un code à 6 chiffres a été envoyé au <strong>{phone}</strong>
            </p>
            <Input
              label="Code de vérification"
              type="text"
              placeholder="123456"
              maxLength={6}
              icon={<KeyRound size={16} />}
              error={form2.formState.errors.code?.message}
              {...form2.register('code')}
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={form2.formState.isSubmitting}>
              Vérifier le code
            </Button>
            <button
              type="button"
              onClick={() => { setError(null); form1.handleSubmit(onStep1)({ phone }) }}
              className="w-full text-sm text-primary-600 hover:underline"
            >
              Renvoyer le code
            </button>
          </form>
        )}

        {/* ─── Étape 3 ─────────────────────────────────────────────────────── */}
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
                error={form3.formState.errors.lastName?.message}
                {...form3.register('lastName')}
              />
            </div>
            <Input
              label="Email (optionnel)"
              type="email"
              placeholder="mamadou@email.com"
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
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={form3.formState.isSubmitting}>
              Créer mon compte
            </Button>
          </form>
        )}

        {/* Lien retour login */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
