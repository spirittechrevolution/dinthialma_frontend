import { useContext, createContext, useState, ReactNode, useCallback } from 'react'
import { UserRole } from '@/types/common'
import { AuthUser, AuthContextType } from '@/types/user'
import { getAccessToken, setTokens, clearTokens, getAuthUser, isTokenExpired, getRefreshToken } from '@/lib/tokenStorage'
import api from '@/services/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) {
      clearTokens()
      return null
    }
    return getAuthUser(token)
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (username: string, password: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{ data: { access_token: string; refresh_token: string } }>(
        '/v1/auth/login',
        { username, password, clientType: 'WEB' }
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

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await api.post('/v1/auth/logout', { refreshToken })
      }
    } catch {
      // on continue même si l'appel serveur échoue
    } finally {
      clearTokens()
      setUser(null)
      window.location.href = '/login'
    }
  }, [])

  const hasRole = (role: UserRole): boolean => user?.roles.includes(role) ?? false
  const isSuperAdmin = () => hasRole(UserRole.SUPER_ADMIN)
  const isAdmin = () => hasRole(UserRole.ADMIN)
  const isMember = () => hasRole(UserRole.MEMBER)

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
      isSuperAdmin,
      isAdmin,
      isMember,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
