import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Home, Wallet, History, Trophy, ListChecks, CreditCard, Send, Bell, Settings, LogOut, Plus, Share2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMesRoles, useCotisantSummary, useGestionSummary } from '@/hooks/useMe'
import { useUnreadCount } from '@/hooks/useNotifications'
import { LogoIcon } from '@/components/ui/LogoIcon'

interface ShellLink {
  label: string
  path: string
  icon: ReactNode
  badge?: number
}

/**
 * Coque desktop des écrans membre / gestionnaire (web ≥ 1024 px).
 *
 * - Mobile et PWA : rend l'écran tel quel (plein écran, aucune différence).
 * - Desktop : barre latérale fixe à gauche + zone de contenu qui défile.
 *
 * Mêmes écrans, mêmes API : seule la disposition change. Les menus suivent les rôles
 * portés par les tontines (je cotise / je gère), comme l'accueil-hub.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex lg:h-[100dvh] lg:overflow-hidden bg-[#f2f3f5]">
      <ShellSidebar />
      <div id="desktop-scroll" className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto lg:overscroll-contain">
        {children}
      </div>
    </div>
  )
}

function ShellSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const roles = useMesRoles()
  const cotisant = useCotisantSummary(roles.cotise)
  const gestion = useGestionSummary(roles.gere)
  const { data: unread = 0 } = useUnreadCount()

  const aPayer = cotisant.data?.aPayer.length ?? 0
  const aValider = (gestion.data?.totalCotisationsEnAttente ?? 0) + (gestion.data?.totalDemandesEnAttente ?? 0)

  const principaux: ShellLink[] = [
    { label: 'Accueil', path: '/accueil', icon: <Home size={20} /> },
    { label: 'Mes tontines', path: '/tontines', icon: <Wallet size={20} /> },
  ]
  const cotiser: ShellLink[] = roles.cotise
    ? [
        { label: 'Payer', path: '/payer', icon: <Send size={20} />, badge: aPayer },
        { label: 'Historique', path: '/historique', icon: <History size={20} /> },
        { label: 'Mes jackpots', path: '/jackpots', icon: <Trophy size={20} /> },
      ]
    : [{ label: 'Historique', path: '/historique', icon: <History size={20} /> }]
  const gerer: ShellLink[] = roles.gere
    ? [
        { label: 'À valider', path: '/a-valider', icon: <ListChecks size={20} />, badge: aValider },
        { label: 'Encaisser', path: '/encaisser', icon: <CreditCard size={20} /> },
        { label: 'Inviter', path: '/partager', icon: <Share2 size={20} /> },
      ]
    : []
  const compte: ShellLink[] = [
    { label: 'Alertes', path: '/notifications', icon: <Bell size={20} />, badge: unread },
    { label: 'Paramètres', path: '/parametres', icon: <Settings size={20} /> },
  ]

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/') ||
    // La fiche d'une tontine et ses sous-écrans relèvent de « Mes tontines »
    (path === '/tontines' && location.pathname.startsWith('/tontine/'))

  const renderLink = (l: ShellLink) => {
    const active = isActive(l.path)
    return (
      <Link
        key={l.path}
        to={l.path}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'flex items-center gap-3 px-3 h-11 rounded-full text-[15px] transition-colors',
          active
            ? 'bg-primary-50 text-primary-700 font-semibold'
            : 'text-neutral-600 font-medium hover:bg-neutral-100 hover:text-neutral-900'
        )}
      >
        <span className="flex-shrink-0">{l.icon}</span>
        <span className="flex-1 truncate">{l.label}</span>
        {!!l.badge && l.badge > 0 && (
          <span
            className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${l.badge} en attente`}
          >
            {l.badge > 99 ? '99+' : l.badge}
          </span>
        )}
      </Link>
    )
  }

  const titre = (t: string) => (
    <p className="px-3 pt-5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">{t}</p>
  )

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-[100dvh] bg-white border-r border-neutral-200">
      <Link to="/accueil" className="px-5 pt-6 pb-4 flex items-center gap-3">
        <LogoIcon size={30} />
        <span className="text-lg font-bold text-neutral-900">Dinthialma</span>
      </Link>

      <div className="px-3">
        <button
          onClick={() => navigate('/creer')}
          className="w-full h-11 rounded-full bg-primary-700 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-800 active:scale-[0.97] transition"
        >
          <Plus size={18} /> Créer une tontine
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Navigation principale">
        <div className="pt-4 space-y-1">{principaux.map(renderLink)}</div>
        {titre('Je cotise')}
        <div className="space-y-1">{cotiser.map(renderLink)}</div>
        {gerer.length > 0 && (
          <>
            {titre('Je gère')}
            <div className="space-y-1">{gerer.map(renderLink)}</div>
          </>
        )}
        {titre('Compte')}
        <div className="space-y-1">{compte.map(renderLink)}</div>
      </nav>

      <div className="px-3 py-4 border-t border-neutral-200 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initials || '?'}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-neutral-900 truncate">{displayName || 'Mon compte'}</span>
          <span className="block text-xs text-neutral-500 truncate">{user?.phone ?? ''}</span>
        </span>
        <button
          onClick={() => logout()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:bg-red-50 hover:text-red-600"
          aria-label="Déconnexion"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
