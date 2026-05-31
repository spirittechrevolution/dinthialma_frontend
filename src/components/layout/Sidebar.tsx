import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X, UserCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'

interface NavLink {
  label: string
  path: string
  icon?: React.ReactNode
}

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
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { hasRole } = useAuth()

  const mainLinks = links.filter((l) => l.path !== '/profile')
  const roleLabel = getRoleLabel(hasRole)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary-600 text-white shadow"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:static top-0 left-0 z-30 h-screen w-64 flex flex-col bg-[#111827] text-white transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <ShieldIcon />
          <div>
            <h1 className="text-lg font-bold leading-none">Dinthialma</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Gestion de tontines</p>
          </div>
        </div>

        {/* Role label */}
        <div className="px-5 pb-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
            {roleLabel}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {mainLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(link.path)
                  ? 'bg-[#1f2937] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1f2937]'
              )}
            >
              {link.icon && <span className="flex-shrink-0 opacity-80">{link.icon}</span>}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Mon profil */}
        <div className="px-3 pb-5 pt-2 border-t border-[#1f2937]">
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === '/profile'
                ? 'bg-[#1f2937] text-white'
                : 'text-neutral-400 hover:text-white hover:bg-[#1f2937]'
            )}
          >
            <UserCircle size={20} className="opacity-80" />
            <span>Mon profil</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
