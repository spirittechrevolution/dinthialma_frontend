import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import type { NavLink } from './AppLayout'

interface BottomNavProps {
  links: NavLink[]
}

/**
 * Barre de navigation mobile : gros boutons tactiles, onglet actif en pastille.
 * - ADMIN / MEMBER : [L1] [L2] [ FAB ] [L3] [Profil] — le FAB central est rendu par MobileQuickActions
 * - Autres rôles   : jusqu'à 4 liens + Profil
 */
export function BottomNav({ links }: BottomNavProps) {
  const location = useLocation()
  const { hasRole } = useAuth()

  const hasFab = hasRole(UserRole.ADMIN) || hasRole(UserRole.MEMBER)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const profileLink: NavLink = { label: 'Profil', path: '/parametres', icon: <UserCircle size={22} /> }

  const renderItem = (link: NavLink) => {
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
  }

  let content: React.ReactNode
  if (hasFab) {
    const left = [links[0], links[1]].filter(Boolean)
    // Évite un doublon « Profil » quand il y a moins de 3 liens
    const right = [links[2] ?? profileLink, profileLink].filter(
      (r, i, arr) => arr.findIndex((x) => x.path === r.path) === i
    )
    content = (
      <>
        {left.map(renderItem)}
        {/* Emplacement du FAB central (rendu dans MobileQuickActions) */}
        <div className="w-16 flex-shrink-0" aria-hidden="true" />
        {right.map(renderItem)}
      </>
    )
  } else {
    content = [...links.slice(0, 4), profileLink].map(renderItem)
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-100 safe-bottom">
      <div className="flex items-stretch h-16 max-w-md mx-auto">{content}</div>
    </nav>
  )
}
