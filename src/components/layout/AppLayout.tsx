import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { PWABanner } from '@/components/shared/PWABanner'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import {
  LayoutDashboard,
  Users,
  BookCopy,
  CreditCard,
  RefreshCw,
  List,
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export interface NavLink {
  label: string
  path: string
  icon: React.ReactNode
}
export function AppLayout({ children }: AppLayoutProps) {
  const { hasRole } = useAuth()

  const getNavLinks = (): NavLink[] => {
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return [
        { label: 'Tableau de bord', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Utilisateurs', path: '/superadmin/users', icon: <Users size={20} /> },
        { label: 'Tontines', path: '/superadmin/tontines', icon: <BookCopy size={20} /> },
        { label: 'Référentiels', path: '/superadmin/code-list', icon: <List size={20} /> },
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
        { label: 'Cotisations', path: '/member/cotisations', icon: <CreditCard size={20} /> },
      ]
    }

    return [
      { label: 'Tableau de bord', path: '/member/dashboard', icon: <LayoutDashboard size={20} /> },
    ]
  }

  const links = getNavLinks()

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar — desktop seulement */}
      <Sidebar links={links} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {/* padding-bottom sur mobile pour laisser de la place à la bottom nav */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile seulement */}
      <BottomNav links={links} />

      {/* Bannière PWA */}
      <PWABanner />
    </div>
  )
}
