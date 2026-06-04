import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { isAxiosError } from 'axios'
import { Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { getPinConfigured } from '@/lib/tokenStorage'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'

interface LoginFormData {
  username: string
  password: string
}

// ─── Panneau gauche desktop ────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex w-1/2 bg-[#0d1f0f] flex-col justify-between px-12 py-10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#16a34a"/>
          <path d="M16 6L8 10v6c0 5.25 3.4 10.15 8 11.35C20.6 26.15 24 21.25 24 16v-6l-8-4z" fill="white" fillOpacity="0.9"/>
          <path d="M13 16l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
  )
}

// ─── Header mobile ────────────────────────────────────────────────────────────
function MobileHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="lg:hidden relative bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600 pt-14 pb-20 px-6 text-center flex-shrink-0">
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <path d="M16 3L6 8v7c0 6.55 4.25 12.68 10 14.19C21.75 27.68 26 21.55 26 15V8L16 3z" fill="white" fillOpacity="0.95"/>
            <path d="M12 15.5l3 3 5-5" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-white text-xl font-extrabold leading-none tracking-tight">Dinthialma</p>
          <p className="text-white/60 text-xs mt-0.5">Gestion de tontines</p>
        </div>
      </div>
      <h1 className="text-white text-2xl font-bold">{title}</h1>
      <p className="text-white/70 text-sm mt-1">{subtitle}</p>
      <div className="absolute -bottom-px left-0 right-0">
        <svg viewBox="0 0 390 32" preserveAspectRatio="none" className="w-full h-8 fill-neutral-50">
          <path d="M0 32 C97.5 0 292.5 0 390 32 L390 32 L0 32 Z"/>
        </svg>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [preEnrolledPhone, setPreEnrolledPhone] = useState<string | null>(null)

  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null
  const successMsg = state?.registered
    ? 'Compte créé avec succès ! Connectez-vous.'
    : state?.passwordReset
    ? 'Mot de passe réinitialisé. Connectez-vous.'
    : null

  const { control, register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormData>({
    defaultValues: { username: '+221' },
  })

  const redirectAfterLogin = (roles: UserRole[]) => {
    if (getPinConfigured() === false) {
      navigate('/pin/setup', { replace: true })
      return
    }
    if (roles.includes(UserRole.SUPER_ADMIN)) navigate('/dashboard', { replace: true })
    else if (roles.includes(UserRole.ADMIN)) navigate('/admin/dashboard', { replace: true })
    else if (roles.includes(UserRole.MEMBER)) navigate('/member/dashboard', { replace: true })
    else navigate('/profile', { replace: true })
  }

  const onSubmit = async ({ username, password }: LoginFormData) => {
    setErrorMsg(null)
    setPreEnrolledPhone(null)
    try {
      const user = await login(username, password)
      if (user) redirectAfterLogin(user.roles)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        const msg: string = err.response?.data?.message || ''
        if (
          msg.toLowerCase().includes('gestionnaire') ||
          msg.toLowerCase().includes('pre_enrolled') ||
          msg.toLowerCase().includes('pré-inscrit') ||
          msg.toLowerCase().includes('pas encore inscrit')
        ) {
          setPreEnrolledPhone(username)
          return
        }
      }
      setErrorMsg('Identifiants incorrects. Vérifiez votre téléphone et mot de passe.')
    }
  }

  // ─── Cas PRE_ENROLLED ─────────────────────────────────────────────────────
  if (preEnrolledPhone) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50">
        <LeftPanel />
        <MobileHeader title="Compte non activé" subtitle="Finalisez votre inscription" />
        <div className="flex-1 flex items-center justify-center px-5 lg:px-8 py-6 lg:py-0">
          <div className="w-full max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <AlertCircle size={26} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Compte non activé</h2>
            <p className="text-neutral-500 text-sm mb-4">
              Le numéro <strong className="text-neutral-700">{preEnrolledPhone}</strong> existe déjà sur la plateforme.
            </p>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-5 text-sm text-orange-800 leading-relaxed">
              Votre compte a été créé par votre gestionnaire. Inscrivez-vous pour accéder à vos tontines.
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate('/register', { state: { phone: preEnrolledPhone } })}>
              S'inscrire maintenant <ArrowRight size={16} />
            </Button>
            <button
              onClick={() => { setPreEnrolledPhone(null); setErrorMsg(null) }}
              className="w-full text-sm text-neutral-400 hover:text-neutral-600 mt-4 text-center"
            >
              ← Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Formulaire login ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-50">
      <LeftPanel />
      <MobileHeader title="Bon retour 👋" subtitle="Connectez-vous à votre espace" />

      {/* Zone formulaire — UNE SEULE instance */}
      <div className="flex-1 flex items-center justify-center px-5 lg:px-8 py-6 lg:py-0">
        <div className="w-full max-w-md">

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Bon retour 👋</h2>
            <p className="text-neutral-500 mt-1">Connectez-vous à votre espace.</p>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <PhoneInput
              name="username"
              control={control}
              label="Téléphone"
              type="tel"
              placeholder="77 000 00 00"
              icon={<Phone size={16} />}
              error={undefined}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              {...register('password', { required: true })}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 font-medium hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Se connecter
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-5">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:underline">
              S'inscrire
            </Link>
          </p>

          <p className="lg:hidden text-center text-xs text-neutral-400 pt-4 pb-2">
            © 2026 Dinthialma
          </p>
        </div>
      </div>
    </div>
  )
}
