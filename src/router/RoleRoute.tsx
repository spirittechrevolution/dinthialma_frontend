import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Spinner } from '@/components/ui/Spinner'
import { ReactNode } from 'react'

interface RoleRouteProps {
  children: ReactNode
  requiredRoles: UserRole[]
}

export function RoleRoute({ children, requiredRoles }: RoleRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return <Spinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const hasRequiredRole = requiredRoles.some((role) => hasRole(role))

  if (!hasRequiredRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">403</h1>
          <p className="text-neutral-600">Accès refusé. Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
