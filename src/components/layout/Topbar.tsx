import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Bell, LogOut, User } from 'lucide-react'
import { useState } from 'react'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleLabel(hasRole: (r: UserRole) => boolean) {
  if (hasRole(UserRole.SUPER_ADMIN)) return 'Super Admin'
  if (hasRole(UserRole.ADMIN)) return 'Admin'
  if (hasRole(UserRole.MEMBER)) return 'Membre'
  return 'Utilisateur'
}

function ShieldIconSmall() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#16a34a" />
      <path d="M16 6L8 10v6c0 5.25 3.4 10.15 8 11.35C20.6 26.15 24 21.25 24 16v-6l-8-4z" fill="white" fillOpacity="0.9" />
      <path d="M13 16l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Topbar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
  const initials = getInitials(displayName)
  const roleLabel = getRoleLabel(hasRole)

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-14 flex-shrink-0">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">

        {/* Logo visible seulement sur mobile (sidebar cachée) */}
        <div className="flex items-center gap-2 md:hidden">
          <ShieldIconSmall />
          <span className="font-bold text-sm text-neutral-900">Dinthialma</span>
        </div>

        {/* Desktop : espace vide à gauche */}
        <div className="hidden md:block" />

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Cloche */}
          <button className="relative p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors">
            <Bell size={18} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-neutral-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {initials}
              </span>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900 leading-tight">{displayName}</p>
                <p className="text-xs text-neutral-500 leading-tight">{roleLabel}</p>
              </div>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
                    <p className="text-xs text-neutral-500">{roleLabel}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/profile') }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <User size={15} />
                    Mon profil
                  </button>
                  <button
                    onClick={async () => { setShowMenu(false); await logout() }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-neutral-50 transition-colors border-t border-neutral-100"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
