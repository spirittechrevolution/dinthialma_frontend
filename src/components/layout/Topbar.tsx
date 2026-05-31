import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { Bell, LogOut, User, PanelLeftClose } from 'lucide-react'
import { useState } from 'react'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleLabel(hasRole: (r: UserRole) => boolean) {
  if (hasRole(UserRole.SUPER_ADMIN)) return 'Super Admin'
  if (hasRole(UserRole.ADMIN)) return 'Admin'
  if (hasRole(UserRole.MEMBER)) return 'Membre'
  return 'Utilisateur'
}

export function Topbar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
  const initials = getInitials(displayName)
  const roleLabel = getRoleLabel(hasRole)

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 h-14 flex items-center">
      <div className="flex-1 flex items-center justify-between px-6">
        {/* Toggle sidebar (decoratif sur desktop) */}
        <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <PanelLeftClose size={20} />
        </button>

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Cloche */}
          <button className="relative text-neutral-500 hover:text-neutral-700 transition-colors">
            <Bell size={20} />
          </button>

          {/* User */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2.5 hover:bg-neutral-50 rounded-lg px-2 py-1.5 transition-colors"
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
                    <p className="text-sm font-semibold text-neutral-900">{displayName}</p>
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
