import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { getHomePath } from '@/lib/homePath'
import { parseApiError, messageErreur } from '@/lib/apiError'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'

interface LoginFormData {
  username: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [preEnrolledPhone, setPreEnrolledPhone] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null
  const successMsg = state?.registered
    ? 'Compte créé avec succès ! Connectez-vous.'
    : state?.passwordReset
    ? 'Mot de passe réinitialisé. Connectez-vous.'
    : null

  const { control, register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormData>({
    defaultValues: { username: '+221' },
  })

  const redirectAfterLogin = (roles: UserRole[], pinConfigured?: boolean) => {
    if (pinConfigured === false) {
      navigate('/pin/setup', { replace: true })
      return
    }
    navigate(getHomePath(roles), { replace: true })
  }

  const onSubmit = async ({ username, password }: LoginFormData) => {
    setErrorMsg(null)
    setPreEnrolledPhone(null)
    try {
      const { user, pinConfigured } = await login(username, password)
      if (user) redirectAfterLogin(user.roles, pinConfigured)
    } catch (err) {
      const { code } = parseApiError(err)
      if (code === 'ACCOUNT_PRE_ENROLLED') {
        setPreEnrolledPhone(username)
        return
      }
      setErrorMsg(messageErreur(err, 'Connexion impossible. Réessayez.'))
    }
  }

  // ─── Cas PRE_ENROLLED ─────────────────────────────────────────────────────
  if (preEnrolledPhone) {
    return (
      <AuthShell title="Compte non activé" subtitle="Finalisez votre inscription">
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
          <AlertCircle size={26} />
        </div>
        <p className="text-[15px] text-neutral-600 mb-4">
          Le numéro <strong className="text-neutral-900">{preEnrolledPhone}</strong> existe déjà sur la plateforme.
        </p>
        <div className="mb-6">
          <AuthAlert tone="info">
            Votre compte a été créé par votre gestionnaire. Inscrivez-vous pour accéder à vos tontines.
          </AuthAlert>
        </div>
        <Button className="w-full" size="lg" onClick={() => navigate('/register', { state: { phone: preEnrolledPhone } })}>
          S'inscrire maintenant <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => { setPreEnrolledPhone(null); setErrorMsg(null) }}
          className="w-full h-11 mt-3 text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          Retour à la connexion
        </button>
      </AuthShell>
    )
  }

  // ─── Formulaire login ─────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Bon retour 👋"
      subtitle="Connectez-vous à votre espace."
      footer={
        <p className="text-center text-[15px] text-neutral-500">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-700 font-bold hover:underline">S'inscrire</Link>
        </p>
      }
    >
      {successMsg && <div className="mb-4"><AuthAlert tone="success">{successMsg}</AuthAlert></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PhoneInput
          name="username"
          control={control}
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="77 000 00 00"
          icon={<Phone size={18} />}
          error={undefined}
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            icon={<Lock size={18} />}
            className="pr-12"
            {...register('password', { required: true })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1 bottom-1 w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="flex justify-end -mt-1">
          <Link to="/forgot-password" className="text-sm text-primary-700 font-semibold hover:underline py-1">
            Mot de passe oublié ?
          </Link>
        </div>

        {errorMsg && <AuthAlert>{errorMsg}</AuthAlert>}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Se connecter
        </Button>
      </form>
    </AuthShell>
  )
}
