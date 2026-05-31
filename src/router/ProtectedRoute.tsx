import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, isTokenExpired } from '@/lib/tokenStorage'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const token = getAccessToken()
  const isValid = token && !isTokenExpired(token)

  if (!isValid) {
    // Sauvegarde la page demandée pour rediriger après login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
