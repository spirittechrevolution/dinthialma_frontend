import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginFormData {
  phone: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormData>()

  const onSubmit = async ({ phone, password }: LoginFormData) => {
    setErrorMsg(null)
    try {
      const user = await login(phone, password)
      if (user?.roles.includes(UserRole.SUPER_ADMIN)) {
        navigate('/dashboard', { replace: true })
      } else if (user?.roles.includes(UserRole.ADMIN)) {
        navigate('/admin/tontines', { replace: true })
      } else {
        navigate('/member/tontines', { replace: true })
      }
    } catch {
      setErrorMsg('Identifiants incorrects. Vérifiez votre téléphone et mot de passe.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dinthialma</h1>
          <p className="text-neutral-500 mt-1">Gestion de Tontines Africaines</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Téléphone"
            type="tel"
            placeholder="+221 77 000 00 00"
            icon={<Phone size={16} />}
            {...register('phone', { required: true })}
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            {...register('password', { required: true })}
          />

          {errorMsg && (
            <p className="text-sm text-error text-center">{errorMsg}</p>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  )
}
