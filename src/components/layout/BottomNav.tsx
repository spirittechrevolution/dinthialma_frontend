import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { UserCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import type { NavLink } from './AppLayout'

interface BottomNavProps {
  links: NavLink[]
}

export function BottomNav({ links }: BottomNavProps) {
  const location = useLocation()
  const { hasRole } = useAuth()

  const hasFab = hasRole(UserRole.ADMIN) || hasRole(UserRole.MEMBER)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const NavItem = ({ link }: { link: NavLink }) => {
    const active = isActive(link.path)
    return (
      <Link
        to={link.path}
        className={clsx(
          'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-w-0 pt-1',
          active ? 'text-primary-600' : 'text-neutral-400'
        )}
      >
        <span className={clsx('transition-transform', active && 'scale-110')}>
          {link.icon}
        </span>
        <span className="truncate w-full text-center px-1">{link.label}</span>
      </Link>
    )
  }

  const profileLink: NavLink = { label: 'Profil', path: '/profile', icon: <UserCircle size={20} /> }

  if (hasFab) {
    /**
     * Layout avec FAB central :  [L1] [L2] [FAB] [R1] [R2]
     *
     * On choisit les 4 liens les plus utiles selon le rôle :
     * ADMIN  → Dashboard | Mes tontines  ||  Cotisations | Profil
     * MEMBER → Dashboard | Mes tontines  ||  Cotisations | Profil
     *
     * On prend toujours links[0], links[1] à gauche
     * et links[2], Profil à droite — quelle que soit la longueur de links.
     */
    const left: NavLink[]  = [links[0], links[1]].filter(Boolean)
    const right: NavLink[] = [links[2] ?? profileLink, profileLink].filter(Boolean)

    // Si moins de 3 liens (ex: USER), on évite le doublon Profil
    const rightUnique = right.filter(
      (r, i, arr) => arr.findIndex((x) => x.path === r.path) === i
    )

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 safe-bottom">
        <div className="flex items-stretch h-16">
          {left.map((link) => <NavItem key={link.path} link={link} />)}

          {/* Slot central — espace pour le FAB (rendu dans MobileQuickActions) */}
          <div className="w-16 flex-shrink-0" aria-hidden="true" />

          {rightUnique.map((link) => <NavItem key={link.path} link={link} />)}
        </div>
      </nav>
    )
  }

  // Layout classique sans FAB (SuperAdmin, User) : jusqu'à 4 liens + Profil
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-200 safe-bottom">
      <div className="flex items-stretch h-16">
        {links.slice(0, 4).map((link) => <NavItem key={link.path} link={link} />)}
        <NavItem link={profileLink} />
      </div>
    </nav>
  )
}
