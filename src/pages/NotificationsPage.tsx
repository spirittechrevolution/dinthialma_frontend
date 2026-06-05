import { AppLayout } from '@/components/layout/AppLayout'
import { Trophy, CheckCircle, AlertTriangle, Calendar, CreditCard, Bell } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────
type NotifType = 'jackpot' | 'paiement' | 'retard' | 'rappel' | 'validation'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
}

// ─── Données mockées (à remplacer par un vrai endpoint) ───────────────────────
const MOCK_NOTIFS: Notification[] = [
  { id: '1', type: 'jackpot',     title: 'Jackpot distribué 🎉',           body: 'Fatou Sow a reçu 500 000 FCFA · Tontine Famille',   time: "À l'instant",   read: false },
  { id: '2', type: 'paiement',    title: 'Paiement reçu',                  body: 'Moussa Diallo a payé 10 000 FCFA via Wave',          time: 'Il y a 5 min',  read: false },
  { id: '3', type: 'rappel',      title: 'Votre tour arrive dans 3 jours', body: 'Vous recevrez le jackpot de la Tontine Bureau',      time: 'Il y a 1h',     read: false },
  { id: '4', type: 'validation',  title: 'Cotisation validée',             body: 'Votre paiement de 5 000 FCFA a été validé',          time: 'Hier, 14h30',   read: true  },
  { id: '5', type: 'retard',      title: 'Paiement en retard',             body: 'Awa Ba n\'a pas encore cotisé · Tontine Famille',    time: 'Hier, 09h00',   read: true  },
  { id: '6', type: 'paiement',    title: 'Paiement reçu',                  body: 'Khadija Camara a payé 25 000 FCFA via Orange Money', time: 'Lun. 02/06',    read: true  },
  { id: '7', type: 'jackpot',     title: 'Jackpot distribué 🎉',           body: 'Moussa Diallo a reçu 490 000 FCFA · Tontine Amis',  time: 'Dim. 01/06',    read: true  },
  { id: '8', type: 'rappel',      title: 'Cycle bientôt clôturé',          body: 'Le cycle #3 de Tontine Famille se termine dans 2 jours', time: 'Sam. 31/05', read: true },
]

// ─── Config visuelle par type ─────────────────────────────────────────────────
const NOTIF_CONFIG: Record<NotifType, { icon: React.ReactNode; bg: string; dot: string }> = {
  jackpot:    { icon: <Trophy size={18} />,        bg: 'bg-amber-50 text-amber-600',    dot: 'bg-amber-400'   },
  paiement:   { icon: <CreditCard size={18} />,    bg: 'bg-primary-50 text-primary-600', dot: 'bg-primary-500' },
  validation: { icon: <CheckCircle size={18} />,   bg: 'bg-green-50 text-green-600',    dot: 'bg-green-500'   },
  retard:     { icon: <AlertTriangle size={18} />, bg: 'bg-red-50 text-red-500',        dot: 'bg-red-500'     },
  rappel:     { icon: <Calendar size={18} />,      bg: 'bg-orange-50 text-orange-500',  dot: 'bg-orange-400'  },
}

export function NotificationsPage() {
  const unread = MOCK_NOTIFS.filter((n) => !n.read)
  const read   = MOCK_NOTIFS.filter((n) =>  n.read)

  const NotifCard = ({ notif }: { notif: Notification }) => {
    const cfg = NOTIF_CONFIG[notif.type]
    return (
      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-colors ${notif.read ? 'bg-white' : 'bg-primary-50/60'}`}>
        {/* Icône */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
          {cfg.icon}
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-neutral-900 ${notif.read ? '' : 'font-bold'}`}>
            {notif.title}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{notif.body}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{notif.time}</p>
        </div>

        {/* Indicateur non lu */}
        {!notif.read && (
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
        )}
      </div>
    )
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
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 relative">
          <Bell size={20} />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread.length}
            </span>
          )}
        </div>
      </div>

      {/* Non lues */}
      {unread.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 px-1">
            Nouvelles
          </p>
          <div className="space-y-2">
            {unread.map((n) => <NotifCard key={n.id} notif={n} />)}
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
            {read.map((n) => <NotifCard key={n.id} notif={n} />)}
          </div>
        </div>
      )}

      {MOCK_NOTIFS.length === 0 && (
        <div className="flex flex-col items-center py-20 text-neutral-400 gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
            <Bell size={24} className="text-neutral-300" />
          </div>
          <p className="font-medium text-neutral-500">Aucune notification</p>
        </div>
      )}
    </AppLayout>
  )
}
