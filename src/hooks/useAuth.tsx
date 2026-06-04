import { useContext, createContext, useState, ReactNode, useCallback } from 'react'
import { UserRole } from '@/types/common'
import { AuthUser, AuthContextType } from '@/types/user'
import {
  getAccessToken, getRefreshToken, setTokens, clearAccessToken, getAuthUser,
  isTokenExpired, setUserPhone, setPinConfigured,
} from '@/lib/tokenStorage'
import api from '@/services/api'

// ─── Type étendu du contexte ──────────────────────────────────────────────────
interface ExtendedAuthContextType extends AuthContextType {
  loginWithPin: (phone: string, pin: string) => Promise<AuthUser | null>
  setupPin: (pin: string, confirmPin: string) => Promise<void>
}

const AuthContext = createContext<ExtendedAuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) {
      clearAccessToken()
      return null
    }
    return getAuthUser(token)
  })
  const [isLoading, setIsLoading] = useState(false)

  // ─── Login mot de passe ────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{
        data: { access_token: string; refresh_token: string; pinConfigured?: boolean }
      }>('/v1/auth/login', { username, password, clientType: 'WEB' })

      const { access_token, refresh_token, pinConfigured } = data.data
      setTokens(access_token, refresh_token)

      // Stocker le phone pour le login PIN futur
      const normalized = username.replace(/\s/g, '')
      setUserPhone(normalized)

      // Stocker si le PIN est déjà configuré
      if (pinConfigured !== undefined) setPinConfigured(pinConfigured)

      const authUser = getAuthUser(access_token)
      setUser(authUser)
      return authUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login PIN ─────────────────────────────────────────────────────────────
  const loginWithPin = useCallback(async (phone: string, pin: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      // Le backend identifie la session via le Bearer token.
      // Après un soft logout, l'access token est absent mais le refresh token
      // est encore valide — on l'utilise pour maintenir la session active.
      const sessionToken = getAccessToken() ?? getRefreshToken()
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}
      const { data } = await api.post<{ data: { access_token: string; refresh_token: string } }>(
        '/v1/auth/login-pin',
        { phone, pin, clientType: 'MOBILE' },
        { headers }
      )
      const { access_token, refresh_token } = data.data
      setTokens(access_token, refresh_token)
      const authUser = getAuthUser(access_token)
      setUser(authUser)
      return authUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Setup PIN ─────────────────────────────────────────────────────────────
  const setupPin = useCallback(async (pin: string, confirmPin: string): Promise<void> => {
    await api.post('/v1/auth/pin/setup', { pin, confirmPin })
    setPinConfigured(true)
  }, [])

  // ─── Logout (soft) ────────────────────────────────────────────────────────
  // Ne termine pas la session Keycloak côté backend : le refresh token reste
  // valide pour le login PIN. Seul l'access token est supprimé localement.
  // "Changer de compte" sur l'écran PIN fait un logout complet.
  const logout = useCallback(async (): Promise<void> => {
    clearAccessToken()
    setUser(null)
    window.location.href = '/'
  }, [])

  const hasRole = (role: UserRole): boolean => user?.roles.includes(role) ?? false

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithPin,
      setupPin,
      logout,
      hasRole,
      isSuperAdmin: () => hasRole(UserRole.SUPER_ADMIN),
      isAdmin: () => hasRole(UserRole.ADMIN),
      isMember: () => hasRole(UserRole.MEMBER),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): ExtendedAuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
