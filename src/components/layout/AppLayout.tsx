import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { LayoutDashboard, Users, Building2, LogOut } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { hasRole } = useAuth()

  // Define navigation based on user role
  const getNavLinks = () => {
    const commonLinks = [
      { label: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ]

    if (hasRole(UserRole.SUPER_ADMIN)) {
      return [
        ...commonLinks,
        { label: 'Utilisateurs', path: '/superadmin/users', icon: <Users size={20} /> },
        { label: 'Toutes les tontines', path: '/superadmin/tontines', icon: <Building2 size={20} /> },
      ]
    }

    if (hasRole(UserRole.ADMIN)) {
      return [
        ...commonLinks,
        { label: 'Mes tontines', path: '/admin/tontines', icon: <Building2 size={20} /> },
        { label: 'Cotisations', path: '/admin/cotisations', icon: <LogOut size={20} /> },
      ]
    }

    if (hasRole(UserRole.MEMBER)) {
      return [
        ...commonLinks,
        { label: 'Mes tontines', path: '/member/tontines', icon: <Building2 size={20} /> },
        { label: 'Mes cotisations', path: '/member/cotisations', icon: <LogOut size={20} /> },
      ]
    }

    return commonLinks
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar links={getNavLinks()} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
