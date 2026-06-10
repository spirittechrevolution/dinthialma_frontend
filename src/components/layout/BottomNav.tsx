import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle } from 'lucide-react'
import type { NavLink } from './AppLayout'

interface BottomNavProps {
  links: NavLink[]
}

export function BottomNav({ links }: BottomNavProps) {
  const location = useLocation()

  // On affiche au max 4 items + profil dans la bottom nav
  const visibleLinks = links.slice(0, 4)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 safe-bottom">
      <div className="flex items-stretch h-16">
        {visibleLinks.map((link) => {
          const active = isActive(link.path)
          return (
            <Link
              key={link.path}
              to={link.path}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0',
                active ? 'text-primary-600' : 'text-neutral-400'
              )}
            >
              <span className={clsx('transition-transform', active && 'scale-110')}>
                {link.icon}
              </span>
              <span className="truncate w-full text-center px-1">{link.label}</span>
            </Link>
          )
        })}

        {/* Profil toujours présent */}
        <Link
          to="/profile"
          className={clsx(
            'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0',
            location.pathname === '/profile' ? 'text-primary-600' : 'text-neutral-400'
          )}
        >
          <UserCircle size={20} />
          <span>Profil</span>
        </Link>
      </div>
    </nav>
  )
}
