import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import type { NavLink } from './AppLayout'

interface SidebarProps {
  links: NavLink[]
}

function getRoleLabel(hasRole: (r: UserRole) => boolean) {
  if (hasRole(UserRole.SUPER_ADMIN)) return 'Super Admin'
  if (hasRole(UserRole.ADMIN)) return 'Admin'
  if (hasRole(UserRole.MEMBER)) return 'Membre'
  return 'Utilisateur'
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#16a34a" />
      <path d="M16 6L8 10v6c0 5.25 3.4 10.15 8 11.35C20.6 26.15 24 21.25 24 16v-6l-8-4z" fill="white" fillOpacity="0.9" />
      <path d="M13 16l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Sidebar({ links }: SidebarProps) {
  const location = useLocation()
  const { hasRole } = useAuth()
  const roleLabel = getRoleLabel(hasRole)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-[#111827] text-white flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <ShieldIcon />
        <div>
          <h1 className="text-base font-bold leading-none">Dinthialma</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Gestion de tontines</p>
        </div>
      </div>

      {/* Role */}
      <div className="px-5 pb-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(link.path)
                ? 'bg-[#1f2937] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-[#1f2937]'
            )}
          >
            <span className="flex-shrink-0 opacity-80">{link.icon}</span>
            <span className="truncate">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Profil */}
      <div className="px-3 pb-5 pt-2 border-t border-[#1f2937]">
        <Link
          to="/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            location.pathname === '/profile'
              ? 'bg-[#1f2937] text-white'
              : 'text-neutral-400 hover:text-white hover:bg-[#1f2937]'
          )}
        >
          <UserCircle size={20} className="opacity-80 flex-shrink-0" />
          <span>Mon profil</span>
        </Link>
      </div>
    </aside>
  )
}
