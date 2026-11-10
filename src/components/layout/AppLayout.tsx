import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { MobileQuickActions } from './MobileQuickActions'
import { PWABanner } from '@/components/shared/PWABanner'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import {
  Home,
  Users,
  Wallet,
  CreditCard,
  RefreshCw,
  List,
  UserCheck,
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export interface NavLink {
  label: string
  /** Libellé court pour la barre du bas mobile */
  shortLabel?: string
  path: string
  icon: React.ReactNode
  /** Affiché dans la barre du bas mobile (max 4 + Profil) */
  mobile?: boolean
}

export function AppLayout({ children }: AppLayoutProps) {
  const { hasRole } = useAuth()

  const getNavLinks = (): NavLink[] => {
    if (hasRole(UserRole.SUPER_ADMIN)) {
      return [
        { label: 'Accueil', path: '/dashboard', icon: <Home size={22} />, mobile: true },
        { label: 'Tontines', path: '/superadmin/tontines', icon: <Wallet size={22} />, mobile: true },
        { label: 'Cotisations', shortLabel: 'Paiements', path: '/superadmin/cotisations', icon: <CreditCard size={22} />, mobile: true },
        { label: 'Utilisateurs', path: '/superadmin/users', icon: <Users size={22} />, mobile: true },
        { label: 'Référentiels', path: '/superadmin/code-list', icon: <List size={22} /> },
      ]
    }

    if (hasRole(UserRole.ADMIN)) {
      return [
        { label: 'Accueil', path: '/admin/dashboard', icon: <Home size={22} />, mobile: true },
        { label: 'Mes tontines', shortLabel: 'Tontines', path: '/admin/tontines', icon: <Wallet size={22} />, mobile: true },
        { label: 'Cotisations', shortLabel: 'Paiements', path: '/admin/cotisations', icon: <CreditCard size={22} />, mobile: true },
        { label: 'Membres', path: '/admin/membres', icon: <Users size={22} />, mobile: true },
        { label: 'Cycles', path: '/admin/cycles', icon: <RefreshCw size={22} /> },
        { label: 'Mes participations', path: '/member/dashboard', icon: <UserCheck size={22} /> },
      ]
    }

    if (hasRole(UserRole.MEMBER)) {
      return [
        { label: 'Accueil', path: '/member/dashboard', icon: <Home size={22} />, mobile: true },
        { label: 'Mes tontines', shortLabel: 'Tontines', path: '/member/tontines', icon: <Wallet size={22} />, mobile: true },
        { label: 'Mes cotisations', shortLabel: 'Paiements', path: '/member/cotisations', icon: <CreditCard size={22} />, mobile: true },
      ]
    }

    return [
      { label: 'Accueil', path: '/user/dashboard', icon: <Home size={22} />, mobile: true },
    ]
  }

  const links = getNavLinks()

  return (
    <div className="flex h-[100dvh] bg-[#f5f6f8] overflow-hidden">
      {/* Sidebar — desktop seulement */}
      <Sidebar links={links} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {/* Colonne centrée et étroite : lisible sur mobile comme sur desktop */}
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 sm:pt-6 pb-28 md:pb-10">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile seulement */}
      <BottomNav links={links.filter((l) => l.mobile).slice(0, 4)} />

      {/* FAB Quick Actions — mobile, Admin + Membre */}
      <MobileQuickActions />

      {/* Bannière PWA */}
      <PWABanner />
    </div>
  )
}
