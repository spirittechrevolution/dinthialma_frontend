import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { isAxiosError } from 'axios'
import { Phone, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginFormData {
  username: string
  password: string
}

function ShieldIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#16a34a" />
      <path d="M16 6L8 10v6c0 5.25 3.4 10.15 8 11.35C20.6 26.15 24 21.25 24 16v-6l-8-4z" fill="white" fillOpacity="0.9" />
      <path d="M13 16l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormData>()

  const redirectAfterLogin = (roles: UserRole[]) => {
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
            Gérez vos tontines
          </h2>
          <h2 className="text-primary-400 text-4xl font-bold leading-tight mb-6">
            en toute sérénité.
          </h2>
          <p className="text-neutral-400 text-base leading-relaxed">
            Suivez les cotisations, validez les paiements, distribuez les<br />
            jackpots — tout est centralisé.
          </p>
        </div>

        <p className="text-neutral-600 text-sm">© 2026 Dinthialma</p>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-8 py-12">
        <div className="w-full max-w-md">

          {/* Cas normal — formulaire de connexion */}
          {!preEnrolledPhone && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-neutral-900">Bon retour 👋</h2>
                <p className="text-neutral-500 mt-1">Connectez-vous à votre espace.</p>
              </div>

              {successMsg && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Téléphone"
                  type="text"
                  placeholder="+221 77 000 00 00"
                  icon={<Phone size={16} />}
                  {...register('username', { required: true })}
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  {...register('password', { required: true })}
                />

                <div className="flex justify-end -mt-2">
                  <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Se connecter
                </Button>
              </form>

              <p className="text-center text-sm text-neutral-500 mt-6">
                Pas encore de compte ?{' '}
                <Link to="/register" className="text-primary-600 font-medium hover:underline">
                  S'inscrire
                </Link>
              </p>
            </>
          )}

          {/* Cas PRE_ENROLLED — compte créé par gestionnaire */}
          {preEnrolledPhone && (
            <div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                  <AlertCircle size={24} className="text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Compte non activé</h2>
                <p className="text-neutral-500">
                  Votre numéro <strong className="text-neutral-700">{preEnrolledPhone}</strong> existe sur la plateforme.
                </p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
                <p className="text-sm text-orange-800 leading-relaxed">
                  Votre compte a été créé par votre gestionnaire de tontine. Inscrivez-vous sur Dinthialma pour vous connecter et accéder à vos tontines.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => navigate('/register', { state: { phone: preEnrolledPhone } })}
              >
                S'inscrire maintenant <ArrowRight size={16} className="ml-2" />
              </Button>

              <button
                onClick={() => { setPreEnrolledPhone(null); setErrorMsg(null) }}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700 mt-4 text-center hover:underline"
              >
                ← Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
