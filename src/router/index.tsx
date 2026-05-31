import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { UserRole } from '@/types/common'

// Lazy load pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard').then(m => ({ default: m.SuperAdminDashboard })))
const UsersPage = lazy(() => import('@/pages/superadmin/UsersPage').then(m => ({ default: m.UsersPage })))
const AllTontinesPage = lazy(() => import('@/pages/superadmin/AllTontinesPage').then(m => ({ default: m.AllTontinesPage })))

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })))
const TontinesPage = lazy(() => import('@/pages/admin/TontinesPage').then(m => ({ default: m.TontinesPage })))
const TontineDetailPage = lazy(() => import('@/pages/admin/TontineDetailPage').then(m => ({ default: m.TontineDetailPage })))
const MembresPage = lazy(() => import('@/pages/admin/MembresPage').then(m => ({ default: m.MembresPage })))
const CyclesPage = lazy(() => import('@/pages/admin/CyclesPage').then(m => ({ default: m.CyclesPage })))
const CotisationsPage = lazy(() => import('@/pages/admin/CotisationsPage').then(m => ({ default: m.CotisationsPage })))

// Member pages
const MemberDashboard = lazy(() => import('@/pages/member/Dashboard').then(m => ({ default: m.MemberDashboard })))
const MesTontinesPage = lazy(() => import('@/pages/member/MesTontinesPage').then(m => ({ default: m.MesTontinesPage })))
const MesCotisationsPage = lazy(() => import('@/pages/member/MesCotisationsPage').then(m => ({ default: m.MesCotisationsPage })))

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<Spinner />}>
        <Navigate to="/dashboard" replace />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<Spinner />}>
          <SuperAdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <AdminDashboard />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/member/dashboard',
    element: (
      <RoleRoute requiredRoles={[UserRole.MEMBER]}>
        <Suspense fallback={<Spinner />}>
          <MemberDashboard />
        </Suspense>
      </RoleRoute>
    ),
  },

  // Super Admin routes
  {
    path: '/superadmin/users',
    element: (
      <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <UsersPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/superadmin/tontines',
    element: (
      <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <AllTontinesPage />
        </Suspense>
      </RoleRoute>
    ),
  },

  // Admin routes
  {
    path: '/admin/tontines',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <TontinesPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/admin/tontines/:id',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <TontineDetailPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/admin/tontines/:tontineId/membres',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <MembresPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/admin/tontines/:tontineId/cycles',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <CyclesPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/admin/tontines/:tontineId/cotisations',
    element: (
      <RoleRoute requiredRoles={[UserRole.ADMIN]}>
        <Suspense fallback={<Spinner />}>
          <CotisationsPage />
        </Suspense>
      </RoleRoute>
    ),
  },

  // Member routes
  {
    path: '/member/tontines',
    element: (
      <RoleRoute requiredRoles={[UserRole.MEMBER]}>
        <Suspense fallback={<Spinner />}>
          <MesTontinesPage />
        </Suspense>
      </RoleRoute>
    ),
  },
  {
    path: '/member/cotisations',
    element: (
      <RoleRoute requiredRoles={[UserRole.MEMBER]}>
        <Suspense fallback={<Spinner />}>
          <MesCotisationsPage />
        </Suspense>
      </RoleRoute>
    ),
  },

  // Catch all
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export function Router() {
  return <RouterProvider router={router} />
}
