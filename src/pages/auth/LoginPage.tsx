import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginFormData {
  username: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Messages de succès venant d'autres pages
  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null
  const successMsg = state?.registered
    ? 'Compte créé avec succès ! Connectez-vous.'
    : state?.passwordReset
    ? 'Mot de passe réinitialisé. Connectez-vous.'
    : null

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormData>()

  const onSubmit = async ({ username, password }: LoginFormData) => {
    setErrorMsg(null)
    try {
      const user = await login(username, password)
      if (user?.roles.includes(UserRole.SUPER_ADMIN)) {
        navigate('/dashboard', { replace: true })
      } else if (user?.roles.includes(UserRole.ADMIN)) {
        navigate('/admin/dashboard', { replace: true })
      } else if (user?.roles.includes(UserRole.MEMBER)) {
        navigate('/member/dashboard', { replace: true })
      } else {
        // Rôle USER de base : pas encore MEMBER ni ADMIN
        navigate('/profile', { replace: true })
      }
    } catch {
      setErrorMsg('Identifiants incorrects. Vérifiez votre téléphone/email et mot de passe.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dinthialma</h1>
          <p className="text-neutral-500 mt-1">Gestion de Tontines Africaines</p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Téléphone ou Email"
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

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 text-center">{errorMsg}</p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Se connecter
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
