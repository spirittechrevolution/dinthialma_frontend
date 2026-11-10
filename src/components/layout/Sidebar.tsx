import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import type { NavLink } from './AppLayout'
import { LogoIcon } from '@/components/ui/LogoIcon'

interface SidebarProps {
  links: NavLink[]
}

function getRoleLabel(hasRole: (r: UserRole) => boolean) {
  if (hasRole(UserRole.SUPER_ADMIN)) return 'Super Admin'
  if (hasRole(UserRole.ADMIN)) return 'Admin'
  if (hasRole(UserRole.MEMBER)) return 'Membre'
  return 'Utilisateur'
}

export function Sidebar({ links }: SidebarProps) {
  const location = useLocation()
  const { hasRole, logout } = useAuth()
  const roleLabel = getRoleLabel(hasRole)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const item = (active: boolean) =>
    clsx(
      'flex items-center gap-3 px-3 h-11 rounded-full text-sm font-medium transition-colors',
      active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    )

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-white border-r border-neutral-100 flex-shrink-0 h-[100dvh]">
      {/* Logo */}
      <div className="px-5 pt-6 pb-6 flex items-center gap-3">
        <LogoIcon size={30} />
        <div>
          <p className="text-base font-bold leading-none text-neutral-900">Dinthialma</p>
          <p className="text-xs text-neutral-500 mt-1">{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <Link key={link.path} to={link.path} className={item(isActive(link.path))}>
            <span className="flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">{link.icon}</span>
            <span className="truncate">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Profil + déconnexion */}
      <div className="px-3 pb-5 pt-3 space-y-1 border-t border-neutral-100">
        <Link to="/profile" className={item(location.pathname === '/profile')}>
          <UserCircle size={20} className="flex-shrink-0" />
          <span>Mon profil</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 h-11 rounded-full text-sm font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
