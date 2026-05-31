import { Navigate } from 'react-router-dom'
import { getAccessToken, isTokenExpired } from '@/lib/tokenStorage'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAccessToken()
  const isValid = token && !isTokenExpired(token)

  if (!isValid) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
