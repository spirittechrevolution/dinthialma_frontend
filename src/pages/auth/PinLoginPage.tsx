import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Delete, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getUserPhone, clearAll, getRefreshToken, getClientType } from '@/lib/tokenStorage'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { UserRole } from '@/types/common'
import api from '@/services/api'

const PAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

function PinDots({ value, length = 6, dark = false }: { value: string; length?: number; dark?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3 my-8">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
            dark
              ? i < value.length
                ? 'bg-primary-600 border-primary-600 scale-110'
                : 'bg-transparent border-neutral-300'
              : i < value.length
              ? 'bg-white border-white scale-110'
              : 'bg-transparent border-white/50'
          }`}
        />
      ))}
    </div>
  )
}

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
    if (roles.includes(UserRole.SUPER_ADMIN)) navigate('/dashboard', { replace: true })
    else if (roles.includes(UserRole.ADMIN)) navigate('/admin/dashboard', { replace: true })
    else if (roles.includes(UserRole.MEMBER)) navigate('/member/dashboard', { replace: true })
    else navigate('/profile', { replace: true })
  }

  const handleKey = async (key: string) => {
    if (isLoading) return
    if (key === 'del') { setPin((p) => p.slice(0, -1)); return }

    const next = pin + key
    setPin(next)

    if (next.length === 6) {
      setIsLoading(true)
      try {
        const authUser = await loginWithPin(phone!, next)
        if (authUser) redirectAfterLogin(authUser.roles)
      } catch (err) {
        setPin('')
        setShake(true)
        setTimeout(() => setShake(false), 500)

        if (isAxiosError(err)) {
          const status = err.response?.status
          const msg: string = err.response?.data?.message ?? ''

          if (status === 401 && msg.toLowerCase().includes('session')) {
            clearAll()
            toast.error('Votre session a expiré. Reconnectez-vous avec votre mot de passe.')
            navigate('/login', { replace: true })
          } else if (status === 404) {
            clearAll()
            toast.error('Compte introuvable. Reconnectez-vous.')
            navigate('/login', { replace: true })
          } else if (status === 400 && msg.toLowerCase().includes('expiré')) {
            toast.error('Votre PIN a expiré. Réinitialisez-le.')
            navigate('/pin/reset', { replace: true })
          } else if (status === 400 && msg.toLowerCase().includes('simple')) {
            toast.error('Code PIN trop simple. Choisissez un autre.')
          } else if (status === 429) {
            toast.error(msg || 'Code PIN verrouillé. Réessayez dans quelques minutes.')
          } else {
            toast.error('Code PIN incorrect.')
          }
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

  // ─── Clavier partagé ──────────────────────────────────────────────────────
  const Numpad = ({ dark = false }: { dark?: boolean }) => (
    <div className="grid grid-rows-4 gap-3">
      {PAD.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-3">
          {row.map((key, ki) => {
            if (key === '') return <div key={ki} />
            if (key === 'del') {
              return (
                <button
                  key={ki}
                  onPointerDown={(e) => { e.preventDefault(); handleKey('del') }}
                  disabled={isLoading || pin.length === 0}
                  className={`h-14 rounded-2xl flex items-center justify-center transition-colors disabled:opacity-30 ${
                    dark
                      ? 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300'
                      : 'bg-white/10 active:bg-white/25'
                  }`}
                >
                  <Delete size={20} className={dark ? 'text-neutral-700' : 'text-white'} />
                </button>
              )
            }
            return (
              <button
                key={ki}
                onPointerDown={(e) => { e.preventDefault(); handleKey(key) }}
                disabled={isLoading || pin.length >= 6}
                className={`h-14 rounded-2xl flex items-center justify-center transition-colors text-2xl font-semibold disabled:opacity-30 select-none ${
                  dark
                    ? 'bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-900'
                    : 'bg-white/10 active:bg-white/25 text-white'
                }`}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )

  // ─── Layout desktop ────────────────────────────────────────────────────────
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen">
      {/* Panneau gauche — identique à LoginPage */}
      <div className="w-1/2 bg-[#0d1f0f] flex flex-col justify-between px-12 py-10">
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

      {/* Panneau droit */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 px-8">
        <div className="w-full max-w-sm">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-neutral-900">Bon retour 👋</h2>
            <p className="text-neutral-500 mt-1">{displayPhone}</p>
          </div>

          <div className={shake ? 'animate-shake' : ''}>
            <PinDots value={pin} dark />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm mb-4">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-600 rounded-full animate-spin" />
              Vérification...
            </div>
          )}

          <Numpad dark />

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handleForgotPIN}
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              PIN oublié ?
            </button>
            <button
              onClick={handleChangeAccount}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <LogOut size={14} /> Changer de compte
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Layout mobile (plein écran vert) ─────────────────────────────────────
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen flex flex-col bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <LogoIcon size={22} />
          </div>
          <span className="text-white font-bold text-sm">Dinthialma</span>
        </div>
        <button
          onClick={handleChangeAccount}
          className="flex items-center gap-1.5 text-white/60 text-xs hover:text-white transition-colors"
        >
          <LogOut size={14} /> Changer de compte
        </button>
      </div>

      {/* Zone centrale */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 ring-2 ring-white/30">
          <span className="text-white text-2xl font-bold">🔐</span>
        </div>
        <p className="text-white text-xl font-bold mb-1">Bon retour</p>
        <p className="text-white/60 text-sm">{displayPhone}</p>

        <div className={shake ? 'animate-shake' : ''}>
          <PinDots value={pin} />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Vérification...
          </div>
        )}
        <p className="text-white/50 text-xs mt-2">Entrez votre code PIN à 6 chiffres</p>
      </div>

      {/* Clavier */}
      <div className="px-8 pb-12">
        <Numpad />
        <button
          onClick={handleForgotPIN}
          className="w-full text-center text-white/50 text-sm mt-5 hover:text-white/80 transition-colors"
        >
          PIN oublié ?
        </button>
      </div>
    </div>
  )

  return (
    <>
      <DesktopLayout />
      <MobileLayout />
    </>
  )
}
