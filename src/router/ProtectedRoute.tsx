import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken, isTokenExpired } from '@/lib/tokenStorage'
import { ReactNode } from 'react'
import { memoriserRetour } from '@/lib/retour'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const token = getAccessToken()
  const isValid = token && !isTokenExpired(token)

  if (!isValid) {
    // Sauvegarde la page demandée pour y revenir après la connexion (même via le code secret)
    memoriserRetour(`${location.pathname}${location.search}`)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
