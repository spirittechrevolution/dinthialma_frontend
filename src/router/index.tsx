import { lazy, Suspense, ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { UserRole } from '@/types/common'

function S({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    }>
      {children}
    </Suspense>
  )
}

// Publiques
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))

// Protégées
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))

// Super Admin
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard').then(m => ({ default: m.SuperAdminDashboard })))
const UsersPage = lazy(() => import('@/pages/superadmin/UsersPage').then(m => ({ default: m.UsersPage })))
const AllTontinesPage = lazy(() => import('@/pages/superadmin/AllTontinesPage').then(m => ({ default: m.AllTontinesPage })))

// Page détail tontine unifiée (SuperAdmin + Admin + Membre)
const TontineDetailPage = lazy(() => import('@/pages/tontines/TontineDetailPage').then(m => ({ default: m.TontineDetailPage })))

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })))
const TontinesPage = lazy(() => import('@/pages/admin/TontinesPage').then(m => ({ default: m.TontinesPage })))
const MembresPage = lazy(() => import('@/pages/admin/MembresPage').then(m => ({ default: m.MembresPage })))
const CyclesPage = lazy(() => import('@/pages/admin/CyclesPage').then(m => ({ default: m.CyclesPage })))
const CotisationsPage = lazy(() => import('@/pages/admin/CotisationsPage').then(m => ({ default: m.CotisationsPage })))

// Member
const MemberDashboard = lazy(() => import('@/pages/member/Dashboard').then(m => ({ default: m.MemberDashboard })))
const MesTontinesPage = lazy(() => import('@/pages/member/MesTontinesPage').then(m => ({ default: m.MesTontinesPage })))
const MesCotisationsPage = lazy(() => import('@/pages/member/MesCotisationsPage').then(m => ({ default: m.MesCotisationsPage })))

const router = createBrowserRouter([
  // Publiques
  { path: '/login', element: <S><LoginPage /></S> },
  { path: '/register', element: <S><RegisterPage /></S> },
  { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Super Admin
  {
    path: '/dashboard',
    element: <ProtectedRoute><S><SuperAdminDashboard /></S></ProtectedRoute>,
  },
  {
    path: '/superadmin/users',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><UsersPage /></S></RoleRoute>,
  },
  {
    path: '/superadmin/tontines',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><AllTontinesPage /></S></RoleRoute>,
  },
  {
    path: '/superadmin/tontines/:id',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><TontineDetailPage /></S></RoleRoute>,
  },

  // Admin
  {
    path: '/admin/dashboard',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><AdminDashboard /></S></RoleRoute>,
  },
  {
    path: '/admin/tontines',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><TontinesPage /></S></RoleRoute>,
  },
  {
    path: '/admin/tontines/:id',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><S><TontineDetailPage /></S></RoleRoute>,
  },
  // Routes globales admin (indépendantes d'une tontineId)
  {
    path: '/admin/membres',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><MembresPage /></S></RoleRoute>,
  },
  {
    path: '/admin/cycles',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><CyclesPage /></S></RoleRoute>,
  },
  {
    path: '/admin/cotisations',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><CotisationsPage /></S></RoleRoute>,
  },
  // Routes legacy (per-tontine, conservées pour compatibilité TontineDetailPage)
  {
    path: '/admin/tontines/:tontineId/membres',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><MembresPage /></S></RoleRoute>,
  },
  {
    path: '/admin/tontines/:tontineId/cycles',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><CyclesPage /></S></RoleRoute>,
  },
  {
    path: '/admin/tontines/:tontineId/cotisations',
    element: <RoleRoute requiredRoles={[UserRole.ADMIN]}><S><CotisationsPage /></S></RoleRoute>,
  },

  // Member
  {
    path: '/member/dashboard',
    element: <RoleRoute requiredRoles={[UserRole.MEMBER]}><S><MemberDashboard /></S></RoleRoute>,
  },
  {
    path: '/member/tontines',
    element: <RoleRoute requiredRoles={[UserRole.MEMBER]}><S><MesTontinesPage /></S></RoleRoute>,
  },
  {
    path: '/member/tontines/:id',
    element: <RoleRoute requiredRoles={[UserRole.MEMBER]}><S><TontineDetailPage /></S></RoleRoute>,
  },
  {
    path: '/member/cotisations',
    element: <RoleRoute requiredRoles={[UserRole.MEMBER]}><S><MesCotisationsPage /></S></RoleRoute>,
  },

  // Profil
  {
    path: '/profile',
    element: <ProtectedRoute><S><ProfilePage /></S></ProtectedRoute>,
  },

  // Catch-all
  { path: '*', element: <Navigate to="/login" replace /> },
])

export function Router() {
  return <RouterProvider router={router} />
}
