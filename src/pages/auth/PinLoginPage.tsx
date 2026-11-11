import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getUserPhone, clearAll, getRefreshToken, getClientType } from '@/lib/tokenStorage'
import { PinScreen, PIN_LENGTH } from '@/components/auth/PinPad'
import { UserRole } from '@/types/common'
import { getHomePath } from '@/lib/homePath'
import { parseApiError } from '@/lib/apiError'
import api from '@/services/api'

export function PinLoginPage() {
  const navigate = useNavigate()
  const { loginWithPin, user } = useAuth()

  const phone = getUserPhone()
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (user) redirectAfterLogin(user.roles)
  }, [user])

  useEffect(() => {
    if (!phone) navigate('/login', { replace: true })
  }, [phone])

  const redirectAfterLogin = (roles: UserRole[]) => {
    navigate(getHomePath(roles), { replace: true })
  }

  const handleKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPin((p) => p.slice(0, -1)); return }
    if (pin.length >= PIN_LENGTH) return

    const next = pin + key
    setPin(next)

    if (next.length === PIN_LENGTH) {
      setIsLoading(true)
      try {
        const authUser = await loginWithPin(phone!, next)
        if (authUser) redirectAfterLogin(authUser.roles)
      } catch (err) {
        setPin('')
        setShake(true)
        setTimeout(() => setShake(false), 500)

        const { code, serverMessage } = parseApiError(err, 'pin')
        switch (code) {
          case 'PIN_SESSION_EXPIRED':
            clearAll()
            toast.error('Votre session a expiré. Reconnectez-vous avec votre mot de passe.')
            navigate('/login', { replace: true })
            break
          case 'ACCOUNT_NOT_FOUND':
            clearAll()
            toast.error('Compte introuvable. Reconnectez-vous.')
            navigate('/login', { replace: true })
            break
          case 'PIN_EXPIRED':
            toast.error('Votre PIN a expiré. Réinitialisez-le.')
            navigate('/pin/reset', { replace: true })
            break
          case 'PIN_TOO_SIMPLE':
            toast.error('Code PIN trop simple. Choisissez un autre.')
            break
          case 'PIN_LOCKED':
            toast.error(serverMessage || 'Code PIN verrouillé. Réessayez dans quelques minutes.')
            break
          case 'NETWORK_ERROR':
            toast.error('Pas de connexion. Vérifiez votre réseau et réessayez.')
            break
          default:
            toast.error('Code PIN incorrect.')
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleForgotPIN = () => navigate('/pin/reset')

  const handleChangeAccount = async () => {
    const refreshToken = getRefreshToken()
    const clientType   = getClientType()
    try {
      if (refreshToken) await api.post('/v1/auth/logout', { refreshToken, clientType })
    } catch { /* non bloquant */ } finally {
      clearAll()
      navigate('/login', { replace: true })
    }
  }

  const displayPhone = phone
    ? ('+' + phone).replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
    : ''

  return (
    <PinScreen
      title="Bon retour"
      subtitle={displayPhone}
      badge={
        <span className="w-16 h-16 rounded-full bg-white/15 ring-2 ring-white/25 lg:bg-primary-50 lg:ring-primary-100 flex items-center justify-center text-white lg:text-primary-700">
          <Lock size={26} />
        </span>
      }
      value={pin}
      shake={shake}
      loading={isLoading}
      onKey={handleKey}
      topAction={
        <button onClick={handleChangeAccount} className="flex items-center gap-1.5 h-9 px-3 rounded-full text-white/80 text-xs font-medium hover:bg-white/10">
          <LogOut size={14} /> Changer de compte
        </button>
      }
      footer={
        <div className="flex items-center justify-center lg:justify-between gap-4">
          <button onClick={handleForgotPIN} className="h-11 px-4 rounded-full text-sm font-semibold text-white lg:text-primary-700 hover:bg-white/10 lg:hover:bg-primary-50">
            PIN oublié ?
          </button>
          <button onClick={handleChangeAccount} className="hidden lg:flex items-center gap-1.5 h-11 px-4 rounded-full text-sm text-neutral-500 hover:bg-neutral-100">
            <LogOut size={14} /> Changer de compte
          </button>
        </div>
      }
    />
  )
}
