import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { ChevronRight, LogOut } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

export function Topbar() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()

  const breadcrumbs = location.pathname.split('/').filter(Boolean)

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 shadow-sm">
      <div className="md:ml-64 px-6 py-4 flex items-center justify-between">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-neutral-600 hover:text-neutral-900">
            Accueil
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-neutral-400" />
              <span className={clsx(index === breadcrumbs.length - 1 ? 'text-neutral-900 font-medium' : 'text-neutral-600')}>
                {crumb.charAt(0).toUpperCase() + crumb.slice(1).replace(/-/g, ' ')}
              </span>
            </div>
          ))}
        </nav>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 hover:bg-neutral-100 rounded-lg p-2 transition-colors"
          >
            <Avatar name={displayName} size="sm" />
            <span className="text-sm font-medium text-neutral-900">{displayName}</span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-20">
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-medium text-neutral-900">{displayName}</p>
                  <p className="text-xs text-neutral-600">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-neutral-100 transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
