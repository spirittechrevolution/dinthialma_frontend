/**
 * A2 — Alertes : ce qui me concerne, avec l'écran où agir en 1 tap.
 * La destination dépend de mon rôle dans la tontine concernée (gestionnaire ou membre).
 * Les rappels de cotisation portent un bouton « Payer » directement dans l'alerte.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Trophy, CreditCard, CheckCircle2, AlertTriangle, CalendarClock, Users, Bell, ChevronRight, RotateCw } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications'
import { useMesTontines } from '@/hooks/useMe'
import { NotificationType, type NotificationItem } from '@/types/notification'
import { jeCotise, jeGere, type MaTontine } from '@/types/me'

type Categorie = 'jackpot' | 'paiement' | 'validation' | 'retard' | 'tour' | 'membre'

function categorie(type: NotificationType): Categorie {
  switch (type) {
    case NotificationType.JACKPOT_DISTRIBUE:
    case NotificationType.DISTRIBUTION_FINALE: return 'jackpot'
    case NotificationType.PAIEMENT_RECU:
    case NotificationType.COTISATION_SOUMISE: return 'paiement'
    case NotificationType.COTISATION_VALIDEE: return 'validation'
    case NotificationType.PAIEMENT_EN_RETARD:
    case NotificationType.RAPPEL_COTISATION:
    case NotificationType.COTISATION_REFUSEE: return 'retard'
    case NotificationType.INVITATION_TONTINE:
    case NotificationType.STATUT_MEMBRE:
    case NotificationType.DEMANDE_ADHESION:
    case NotificationType.ADHESION_REFUSEE: return 'membre'
    default: return 'tour'
  }
}

const ICONES: Record<Categorie, { icon: JSX.Element; cls: string }> = {
  jackpot: { icon: <Trophy size={20} />, cls: 'bg-yellow-50 text-yellow-700' },
  paiement: { icon: <CreditCard size={20} />, cls: 'bg-primary-50 text-primary-700' },
  validation: { icon: <CheckCircle2 size={20} />, cls: 'bg-primary-50 text-primary-700' },
  retard: { icon: <AlertTriangle size={20} />, cls: 'bg-red-50 text-red-600' },
  tour: { icon: <CalendarClock size={20} />, cls: 'bg-sky-50 text-sky-700' },
  membre: { icon: <Users size={20} />, cls: 'bg-violet-50 text-violet-700' },
}

function dateRelative(iso: string): string {
  const d = new Date(iso)
  const maintenant = new Date()
  const min = Math.floor((maintenant.getTime() - d.getTime()) / 60_000)
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (min < 1) return "À l'instant"
  if (min < 60) return `Il y a ${min} min`
  if (d.toDateString() === maintenant.toDateString()) return `Aujourd'hui ${heure}`
  const hier = new Date(maintenant)
  hier.setDate(maintenant.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return `Hier ${heure}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${heure}`
}

/**
 * Écran le plus précis disponible (§7 de PROMPT_ALIGNEMENT_FRONT) : la notification peut porter
 * tontineId, cycleId, cotisationId, membreId (absents si non pertinents).
 */
function destination(n: NotificationItem, t: MaTontine | undefined): string | null {
  const tid = n.tontineId
  const recu = tid && n.cotisationId ? `/recu/${tid}/${n.cotisationId}` : null
  const tour = tid && n.cycleId ? `/tontine/${tid}/tours/${n.cycleId}` : tid ? `/tontine/${tid}/tours` : null
  const gere = !!t && jeGere(t)
  switch (n.type) {
    case NotificationType.COTISATION_SOUMISE:
    case NotificationType.PAIEMENT_RECU:
      return recu ?? (tid ? (gere ? `/a-valider?tontine=${tid}` : `/historique?mode=COTISE&tontine=${tid}`) : null)
    case NotificationType.COTISATION_VALIDEE:
    case NotificationType.COTISATION_REFUSEE:
    case NotificationType.PAIEMENT_EN_RETARD:
      return recu ?? (tid ? `/historique?mode=COTISE&tontine=${tid}` : null)
    case NotificationType.RAPPEL_COTISATION:
      return recu ?? (tid ? `/payer/${tid}` : null)
    case NotificationType.CYCLE_OUVERT:
    case NotificationType.CYCLE_BIENTOT_CLOTURE:
    case NotificationType.TOUR_PROCHE:
    case NotificationType.JACKPOT_DISTRIBUE:
    case NotificationType.DISTRIBUTION_FINALE:
      return tour
    case NotificationType.INVITATION_TONTINE:
    case NotificationType.STATUT_MEMBRE:
      return tid ? (gere && n.membreId ? `/tontine/${tid}/membres/${n.membreId}` : `/tontine/${tid}`) : null
    case NotificationType.DEMANDE_ADHESION:
      return tid ? `/a-valider?tontine=${tid}${n.demandeId ? `&demande=${n.demandeId}` : ''}` : '/a-valider'
    case NotificationType.ADHESION_REFUSEE:
      return n.demandeId ? `/tontines?demande=${n.demandeId}` : '/tontines'
    default:
      return tid ? `/tontine/${tid}` : null
  }
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const { data, isLoading, isError, refetch, isFetching } = useNotifications(page)
  const { data: mesTontines } = useMesTontines()
  const { mutate: marquerLu } = useMarkAsRead()
  const { mutate: toutMarquer, isPending: marquageTout } = useMarkAllAsRead()

  // Accumulation des pages (« Voir plus »)
  useEffect(() => {
    if (!data) return
    setItems((prev) => {
      if (page === 0) return data.content
      const ids = new Set(prev.map((n) => n.id))
      return [...prev, ...data.content.filter((n) => !ids.has(n.id))]
    })
  }, [data, page])

  const nouvelles = items.filter((n) => !n.read)
  const anciennes = items.filter((n) => n.read)
  const tontine = (id: string | null | undefined) => (id ? mesTontines?.find((t) => t.id === id) : undefined)

  const ouvrir = (n: NotificationItem, cible: string | null) => {
    if (!n.read) {
      marquerLu(n.id)
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
    }
    if (cible) navigate(cible)
  }

  const carte = (n: NotificationItem) => {
    const cat = ICONES[categorie(n.type)]
    const t = tontine(n.tontineId)
    const cible = destination(n, t)
    const rappel = n.type === NotificationType.RAPPEL_COTISATION && !n.cotisationId && !!t && jeCotise(t)
    return (
      <li key={n.id} className={clsx('flex items-start gap-3 px-4 py-3', !n.read && 'bg-primary-50/50')}>
        <button onClick={() => ouvrir(n, cible)} className="flex flex-1 min-w-0 items-start gap-3 text-left">
          <span className={clsx('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', cat.cls)}>{cat.icon}</span>
          <span className="min-w-0 flex-1">
            <span className={clsx('block text-[15px] text-neutral-900', !n.read ? 'font-bold' : 'font-semibold')}>{n.title}</span>
            <span className="block text-sm text-neutral-600 line-clamp-2">{n.body}</span>
            <span className="block mt-0.5 text-xs text-neutral-400">{dateRelative(n.createdAt)}{t ? ` · ${t.nom}` : ''}</span>
          </span>
        </button>
        <span className="flex flex-col items-end gap-2 flex-shrink-0">
          {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-primary-600" aria-label="Non lue" />}
          {rappel ? (
            <button onClick={() => ouvrir(n, `/payer/${n.tontineId}`)} className="h-9 px-3 rounded-full bg-primary-700 text-white text-xs font-bold">Payer</button>
          ) : cible ? (
            <ChevronRight size={18} className="text-neutral-300" />
          ) : null}
        </span>
      </li>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader
        title="Alertes"
        right={nouvelles.length > 0 ? (
          <button
            onClick={() => toutMarquer(undefined, { onSuccess: () => setItems((prev) => prev.map((n) => ({ ...n, read: true }))) })}
            disabled={marquageTout}
            className="h-11 px-3 mr-1 rounded-full text-sm font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        ) : undefined}
      />
      <main className="px-4 pb-10 max-w-lg mx-auto space-y-5">
        {isLoading && items.length === 0 ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : isError && items.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger les alertes.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          </section>
        ) : items.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><Bell size={26} /></span>
            <p className="mt-3 text-lg font-bold text-neutral-900">Aucune alerte</p>
            <p className="mt-1 text-sm text-neutral-500">Vous serez prévenu ici des paiements, des tours et des jackpots.</p>
          </section>
        ) : (
          <>
            {nouvelles.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">Nouvelles ({nouvelles.length})</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">{nouvelles.map(carte)}</ul>
              </section>
            )}
            {anciennes.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">Plus anciennes</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">{anciennes.map(carte)}</ul>
              </section>
            )}
            {data && !data.last && (
              <button onClick={() => setPage((p) => p + 1)} disabled={isFetching} className="w-full h-12 rounded-full bg-white shadow-sm text-sm font-semibold text-primary-800 disabled:opacity-50">
                {isFetching ? 'Chargement…' : 'Voir plus'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
