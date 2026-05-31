import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import {
  LayoutDashboard,
  Users,
  BookCopy,
  CreditCard,
  RefreshCw,
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { hasRole } = useAuth()

  const getNavLinks = () => {
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return [
        { label: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Utilisateurs', path: '/superadmin/users', icon: <Users size={20} /> },
        { label: 'Toutes les tontines', path: '/superadmin/tontines', icon: <BookCopy size={20} /> },
      ]
    }

    if (hasRole(UserRole.ADMIN)) {
      return [
        { label: 'Tableau de bord', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Mes tontines', path: '/admin/tontines', icon: <BookCopy size={20} /> },
        { label: 'Membres', path: '/admin/membres', icon: <Users size={20} /> },
        { label: 'Cycles', path: '/admin/cycles', icon: <RefreshCw size={20} /> },
        { label: 'Cotisations', path: '/admin/cotisations', icon: <CreditCard size={20} /> },
      ]
    }

    if (hasRole(UserRole.MEMBER)) {
      return [
        { label: 'Tableau de bord', path: '/member/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Mes tontines', path: '/member/tontines', icon: <BookCopy size={20} /> },
        { label: 'Mes cotisations', path: '/member/cotisations', icon: <CreditCard size={20} /> },
      ]
    }

    return [
      { label: 'Tableau de bord', path: '/member/dashboard', icon: <LayoutDashboard size={20} /> },
    ]
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar links={getNavLinks()} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
