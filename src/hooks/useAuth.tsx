import { useContext, createContext, useState, ReactNode, useCallback } from 'react'
import { UserRole } from '@/types/common'
import { AuthUser, AuthContextType, LoginResponse } from '@/types/user'
import { getAccessToken, setTokens, clearTokens, getAuthUser, isTokenExpired } from '@/lib/tokenStorage'
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

  const login = useCallback(async (phone: string, password: string): Promise<AuthUser | null> => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{ data: LoginResponse }>('/auth/login', { phone, password })
      const { accessToken, refreshToken } = data.data
      setTokens(accessToken, refreshToken)
      const authUser = getAuthUser(accessToken)
      setUser(authUser)
      return authUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch {
      // proceed even if server call fails
    } finally {
      clearTokens()
      setUser(null)
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
