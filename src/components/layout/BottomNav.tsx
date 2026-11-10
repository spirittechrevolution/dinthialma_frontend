import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle } from 'lucide-react'
import type { NavLink } from './AppLayout'

interface BottomNavProps {
  links: NavLink[]
}

/** Barre de navigation mobile : 4 onglets max + Profil, gros boutons tactiles. */
export function BottomNav({ links }: BottomNavProps) {
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const items = [
    ...links,
    { label: 'Profil', path: '/profile', icon: <UserCircle size={22} /> } as NavLink,
  ]

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-100 safe-bottom">
      <div className="flex items-stretch h-16 max-w-md mx-auto">
        {items.map((link) => {
          const active = isActive(link.path)
          return (
            <Link
              key={link.path}
              to={link.path}
              aria-current={active ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-w-0"
            >
              <span
                className={clsx(
                  'flex items-center justify-center h-8 w-14 rounded-full transition-colors',
                  active ? 'bg-primary-100 text-primary-700' : 'text-neutral-400'
                )}
              >
                {link.icon}
              </span>
              <span
                className={clsx(
                  'text-[11px] truncate w-full text-center px-1',
                  active ? 'font-semibold text-primary-700' : 'font-medium text-neutral-500'
                )}
              >
                {link.shortLabel || link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
