import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppTheme } from '@/App'
import { useUnreadCount } from '@/hooks/useNotifications'
import { UserRole } from '@/types/common'
import { Bell, LogOut, User, Sun, Moon } from 'lucide-react'
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

export function Topbar() {
  const { user, logout, hasRole } = useAuth()
  const { isDark, toggleTheme } = useAppTheme()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'
  const initials = getInitials(displayName)
  const roleLabel = getRoleLabel(hasRole)

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#111827] border-b border-neutral-200 dark:border-[#374151] h-14 flex-shrink-0 transition-colors duration-200">
      <div className="h-full flex items-center justify-between px-4 sm:px-6">

        {/* Logo mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <LogoIcon size={28} />
          <span className="font-bold text-sm text-neutral-900 dark:text-white">Dinthialma</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-2">
          {/* Toggle dark/light mode */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-500 dark:text-[#9ca3af] hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f2937] transition-colors"
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Cloche */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-1.5 text-neutral-500 dark:text-[#9ca3af] hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1f2937] rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-[#1f2937] rounded-lg px-2 py-1.5 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {initials}
              </span>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">{displayName}</p>
                <p className="text-xs text-neutral-500 dark:text-[#9ca3af] leading-tight">{roleLabel}</p>
              </div>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-[#1f2937] rounded-xl shadow-lg dark:shadow-2xl border border-neutral-200 dark:border-[#374151] z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 dark:border-[#374151]">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-neutral-500 dark:text-[#9ca3af]">{roleLabel}</p>
                  </div>
                  <button
                    onClick={() => { setShowMenu(false); navigate('/profile') }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-[#d1d5db] hover:bg-neutral-50 dark:hover:bg-[#111827] transition-colors"
                  >
                    <User size={15} />
                    Mon profil
                  </button>
                  <button
                    onClick={async () => { setShowMenu(false); await logout() }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-50 dark:hover:bg-[#111827] transition-colors border-t border-neutral-100 dark:border-[#374151]"
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
