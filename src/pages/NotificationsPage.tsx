import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { Trophy, CheckCircle, AlertTriangle, Calendar, CreditCard, Bell, BellRing, ChevronRight } from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { NotificationItem, NotificationType } from '@/types/notification'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'

// ─── Mapping type → catégorie visuelle ───────────────────────────────────────
type VisualCategory = 'jackpot' | 'paiement' | 'validation' | 'retard' | 'rappel'

function getCategory(type: NotificationType): VisualCategory {
  if (type === NotificationType.JACKPOT_DISTRIBUE || type === NotificationType.DISTRIBUTION_FINALE)
    return 'jackpot'
  if (type === NotificationType.PAIEMENT_RECU || type === NotificationType.COTISATION_SOUMISE)
    return 'paiement'
  if (type === NotificationType.COTISATION_VALIDEE)
    return 'validation'
  if (type === NotificationType.PAIEMENT_EN_RETARD)
    return 'retard'
  return 'rappel'
}

const NOTIF_CONFIG: Record<VisualCategory, { icon: React.ReactNode; bg: string; dot: string }> = {
  jackpot:    { icon: <Trophy size={18} />,        bg: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-400'   },
  paiement:   { icon: <CreditCard size={18} />,    bg: 'bg-primary-50 text-primary-600', dot: 'bg-primary-500' },
  validation: { icon: <CheckCircle size={18} />,   bg: 'bg-green-50 text-green-600',     dot: 'bg-green-500'   },
  retard:     { icon: <AlertTriangle size={18} />, bg: 'bg-red-50 text-red-500',         dot: 'bg-red-500'     },
  rappel:     { icon: <Calendar size={18} />,      bg: 'bg-orange-50 text-orange-500',   dot: 'bg-orange-400'  },
}

// ─── Formatage de date lisible ────────────────────────────────────────────────
function formatDate(iso: string): string {
  const date = new Date(iso)
  const now  = new Date()
  const diffMs  = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1)  return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `Aujourd'hui, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hier, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }

  return `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}, ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

// ─── Résolution du lien contextuel selon le type + rôle ──────────────────────
function getNotifLink(notif: NotificationItem, isAdmin: boolean): string | null {
  if (!notif.tontineId) return null

  const tontineBase = isAdmin
    ? `/admin/tontines/${notif.tontineId}`
    : `/member/tontines/${notif.tontineId}`

  switch (notif.type) {
    case NotificationType.PAIEMENT_RECU:
    case NotificationType.COTISATION_SOUMISE:
      // Admin → onglet cotisations de la tontine, Membre → ses cotisations
      return isAdmin ? `${tontineBase}` : '/member/cotisations'
    case NotificationType.COTISATION_VALIDEE:
      return '/member/cotisations'
    case NotificationType.JACKPOT_DISTRIBUE:
    case NotificationType.DISTRIBUTION_FINALE:
      return tontineBase
    case NotificationType.PAIEMENT_EN_RETARD:
    case NotificationType.RAPPEL_COTISATION:
      return isAdmin ? `${tontineBase}` : '/member/cotisations'
    case NotificationType.TOUR_PROCHE:
    case NotificationType.CYCLE_BIENTOT_CLOTURE:
    case NotificationType.CYCLE_OUVERT:
      return tontineBase
    case NotificationType.INVITATION_TONTINE:
    case NotificationType.STATUT_MEMBRE:
      return isAdmin ? '/admin/membres' : '/member/tontines'
    default:
      return tontineBase
  }
}

// ─── Carte notification ───────────────────────────────────────────────────────
function NotifCard({
  notif,
  onRead,
  isAdmin,
}: {
  notif: NotificationItem
  onRead: (id: string) => void
  isAdmin: boolean
}) {
  const navigate = useNavigate()
  const cfg  = NOTIF_CONFIG[getCategory(notif.type)]
  const link = getNotifLink(notif, isAdmin)
  const hasAction = !!link

  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    if (link) navigate(link)
  }

  return (
    <button
      className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${
        notif.read ? 'bg-white' : 'bg-primary-50/60'
      } ${hasAction ? 'active:scale-[0.99]' : ''}`}
      onClick={handleClick}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm text-neutral-900 ${notif.read ? 'font-semibold' : 'font-bold'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.body}</p>
        <p className="text-[10px] text-neutral-400 mt-1">{formatDate(notif.createdAt)}</p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
        {!notif.read && (
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        )}
        {hasAction && (
          <ChevronRight size={14} className="text-neutral-300" />
        )}
      </div>
    </button>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [allItems, setAllItems] = useState<NotificationItem[]>([])

  const { hasRole } = useAuth()
  const isAdmin = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPER_ADMIN)

  const { data, isLoading } = useNotifications(page)
  const { mutate: markAsRead }    = useMarkAsRead()
  const { mutate: markAllAsRead, isPending: markingAll } = useMarkAllAsRead()

  useEffect(() => {
    if (!data) return
    if (page === 0) {
      setAllItems(data.content)
    } else {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const newOnes = data.content.filter((n) => !existingIds.has(n.id))
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev
      })
    }
  }, [data, page])

  const unread  = allItems.filter((n) => !n.read)
  const read    = allItems.filter((n) =>  n.read)
  const hasMore = data ? !data.last : false

  const handleRead = (id: string) => {
    markAsRead(id, {
      onSuccess: () => {
        setAllItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
      },
    })
  }

  const handleMarkAll = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        setAllItems((prev) => prev.map((n) => ({ ...n, read: true })))
      },
    })
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          {unread.length > 0 && (
            <p className="text-sm text-neutral-500 mt-1">
              <span className="font-semibold text-primary-600">{unread.length}</span> non lue{unread.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="px-3 py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors rounded-xl hover:bg-primary-50"
            >
              Tout lire
            </button>
          )}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${unread.length > 0 ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400'}`}>
            {unread.length > 0 ? <BellRing size={20} /> : <Bell size={20} />}
            {unread.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread.length > 9 ? '9+' : unread.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chargement initial */}
      {isLoading && allItems.length === 0 ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : allItems.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400 gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
            <Bell size={24} className="text-neutral-300" />
          </div>
          <p className="font-medium text-neutral-500">Aucune notification</p>
        </div>
      ) : (
        <>
          {/* Non lues */}
          {unread.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">
                Nouvelles
              </p>
              <div className="space-y-2">
                {unread.map((n) => (
                  <NotifCard key={n.id} notif={n} onRead={handleRead} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          )}

          {/* Lues */}
          {read.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">
                Précédentes
              </p>
              <div className="space-y-1">
                {read.map((n) => (
                  <NotifCard key={n.id} notif={n} onRead={handleRead} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
              className="w-full mt-4 py-3 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Spinner /> : 'Charger plus'}
            </button>
          )}
        </>
      )}
    </AppLayout>
  )
}
