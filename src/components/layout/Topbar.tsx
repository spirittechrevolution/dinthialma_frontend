import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadCount } from '@/hooks/useNotifications'
import { UserRole } from '@/types/common'
import { Bell, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { LogoIcon } from '@/components/ui/LogoIcon'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleLabel(hasRole: (r: UserRole) => boolean) {
  if (hasRole(UserRole.SUPER_ADMIN)) return 'Super Admin'
  if (hasRole(UserRole.ADMIN)) return 'Admin'
  if (hasRole(UserRole.MEMBER)) return 'Membre'
  return 'Utilisateur'
}

/**
 * En-tête unique de l'app (mobile + desktop).
 * Volontairement minimal : logo (mobile), cloche notifications, avatar → menu.
 */
export function Topbar() {
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
  const initials = getInitials(displayName)
  const roleLabel = getRoleLabel(hasRole)

  const iconBtn =
    'relative w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 active:scale-95 transition'

  return (
    <header className="sticky top-0 z-20 bg-[#f5f6f8]/90 md:bg-white backdrop-blur md:border-b md:border-neutral-100 h-14 md:h-16 flex-shrink-0">
      <div className="h-full mx-auto w-full flex items-center justify-between px-4 sm:px-6">
        {/* Logo mobile */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 md:hidden">
          <LogoIcon size={26} />
          <span className="font-bold text-[15px] text-neutral-900">Dinthialma</span>
        </button>

        <div className="hidden md:block" />

        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button onClick={() => navigate('/notifications')} className={iconBtn} aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar → menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-neutral-100 transition-colors"
              aria-label="Menu utilisateur"
            >
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="hidden md:block text-left">
                <span className="block text-sm font-semibold text-neutral-900 leading-tight">{displayName}</span>
                <span className="block text-xs text-neutral-500 leading-tight">{roleLabel}</span>
              </span>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-neutral-100 z-20 overflow-hidden animate-slideDown">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{displayName}</p>
                    <p className="text-xs text-neutral-500">{roleLabel}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/parametres') }}
                    className="w-full flex items-center gap-3 px-4 h-11 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <User size={17} /> Mon profil
                  </button>
                  <button
                    onClick={async () => { setShowMenu(false); await logout() }}
                    className="w-full flex items-center gap-3 px-4 h-11 text-sm text-red-600 hover:bg-red-50 border-t border-neutral-100"
                  >
                    <LogOut size={17} /> Déconnexion
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
