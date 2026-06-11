import { useContext, createContext, useState, ReactNode, useCallback } from 'react'
import { UserRole } from '@/types/common'
import { AuthUser, AuthContextType } from '@/types/user'
import {
  getAccessToken,
  storeSession, clearAccessToken,
  getAuthUser, isTokenExpired,
  setPinConfigured, detectClientType,
} from '@/lib/tokenStorage'
import api from '@/services/api'

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
  const login = useCallback(async (username: string, password: string): Promise<{ user: AuthUser | null; pinConfigured?: boolean }> => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{
        data: { access_token: string; refresh_token: string; pin_configured?: boolean }
      }>('/v1/auth/login', {
        username,
        password,
        clientType: detectClientType(),
        deviceInfo: navigator.userAgent,
      })

      const { access_token, refresh_token, pin_configured: pinConfigured } = data.data
      storeSession(access_token, refresh_token, username)

      if (pinConfigured !== undefined) setPinConfigured(pinConfigured)

      const authUser = getAuthUser(access_token)
      setUser(authUser)
      return { user: authUser, pinConfigured }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Login PIN ─────────────────────────────────────────────────────────────
  // Pas de Bearer manuel — l'intercepteur Axios gère le refresh automatiquement
  // si l'access token est expiré, ce qui fournit le Bearer pour identifier la session.
  const loginWithPin = useCallback(async (phone: string, pin: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{ data: { access_token: string; refresh_token: string } }>(
        '/v1/auth/login-pin',
        {
          phone,
          pin,
          clientType: detectClientType(),
          deviceInfo: navigator.userAgent,
        }
      )
      const { access_token, refresh_token } = data.data
      storeSession(access_token, refresh_token, phone)
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
  // Ne termine pas la session Keycloak côté backend : refresh token + phone +
  // isPinConfigured restent en localStorage.
  // StartRoute voit phone+isPinConfigured=true → redirige vers /pin.
  // L'intercepteur Axios gère le refresh si l'access token est expiré.
  // Pour un logout complet (changer de compte), utiliser handleChangeAccount
  // sur l'écran PIN qui appelle /auth/logout + clearAll().
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
      isAdmin:      () => hasRole(UserRole.ADMIN),
      isMember:     () => hasRole(UserRole.MEMBER),
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
