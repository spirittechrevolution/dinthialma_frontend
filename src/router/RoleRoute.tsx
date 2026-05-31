import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Spinner } from '@/components/ui/Spinner'
import { ReactNode } from 'react'

interface RoleRouteProps {
  children: ReactNode
  requiredRoles: UserRole[]
}

export function RoleRoute({ children, requiredRoles }: RoleRouteProps) {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // SUPER_ADMIN a accès à tout
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN)
  const hasRequiredRole = isSuperAdmin || requiredRoles.some((role) => hasRole(role))

  if (!hasRequiredRole) {
    // Rediriger vers la bonne page selon le rôle réel
    const redirectPath = hasRole(UserRole.ADMIN)
      ? '/admin/dashboard'
      : hasRole(UserRole.MEMBER)
      ? '/member/dashboard'
      : '/profile'

    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Accès refusé</h1>
          <p className="text-neutral-500 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-neutral-400 mb-6">
            Rôles requis : {requiredRoles.join(', ')}<br />
            Vos rôles : {user?.roles.join(', ') || 'aucun'}
          </p>
          <button
            onClick={() => navigate(redirectPath, { replace: true })}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Retour à mon espace
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
