/**
 * T4 — Fiche membre (gestionnaire) : situation, total versé, historique, actions.
 * Actions sensibles (suspendre / réactiver / retirer) en bas, toujours confirmées.
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { Phone, MessageCircle, Trophy, RotateCw, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useMembres, useUpdateMembreStatut, useRemoveMembre } from '@/hooks/useMembres'
import { useCycles } from '@/hooks/useCycles'
import { useCotisationsParStatut } from '@/hooks/useMe'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte, formatDateHeure } from '@/lib/format'
import { formatPhoneLocal, toLocalPhone } from '@/lib/phone'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import { AccountStatus, CotisationStatut, CycleStatut, MembreStatut } from '@/types/common'

const PILL: Record<CotisationStatut, { label: string; cls: string; icon: JSX.Element }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-800', icon: <Clock size={13} /> },
  VALIDE: { label: 'Validé', cls: 'bg-primary-50 text-primary-800', icon: <CheckCircle2 size={13} /> },
  EN_RETARD: { label: 'En retard', cls: 'bg-red-50 text-red-700', icon: <AlertTriangle size={13} /> },
  REFUSE: { label: 'Refusé', cls: 'bg-red-50 text-red-700', icon: <XCircle size={13} /> },
}

type Action = 'suspendre' | 'reactiver' | 'retirer'

export function MembreFichePage() {
  const { id = '', membreId = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const v = useTontineVue(id)
  const { data: membresData, isLoading, isError, refetch } = useMembres(id, 0, 200)
  const membre = membresData?.content.find((m) => m.id === membreId)
  const { data: cyclesData } = useCycles(id, 0, 200)
  const cycles = cyclesData?.content ?? []
  const cycleEnCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)
  const cot = useCotisationsParStatut(id, [], { membreId })
  const { mutate: updateStatut, isPending: updating } = useUpdateMembreStatut()
  const { mutate: retirer, isPending: removing } = useRemoveMembre()
  const [action, setAction] = useState<Action | null>(null)

  if (isLoading || v.isLoading) {
    return <Shell title="Membre"><div className="space-y-4" aria-busy="true"><div className="h-40 rounded-3xl bg-white animate-pulse" /><div className="h-40 rounded-3xl bg-white animate-pulse" /></div></Shell>
  }
  if (isError || !membre) {
    return (
      <Shell title="Membre">
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Membre introuvable</p>
          <button onClick={() => refetch()} className="mt-4 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
        </section>
      </Shell>
    )
  }
  if (v.vue !== 'GERE') {
    return <Shell title="Membre"><p className="text-center text-sm text-neutral-500 pt-8">Réservé au gestionnaire de la tontine.</p></Shell>
  }

  const nom = `${membre.user.firstName} ${membre.user.lastName}`.trim()
  const paiements = cot.data ?? []
  const valides = paiements.filter((c) => c.statut === CotisationStatut.VALIDE)
  const total = valides.reduce((s, c) => s + c.montant, 0)
  const nbAttente = paiements.filter((c) => c.statut === CotisationStatut.EN_ATTENTE).length
  const nbRetard = paiements.filter((c) => c.statut === CotisationStatut.EN_RETARD).length
  const payeCeTour = !!cycleEnCours && paiements.some((c) => c.cycleId === cycleEnCours.id)
  const peutEncaisser = !!cycleEnCours && !payeCeTour && membre.statut === MembreStatut.ACTIF
  const tel = toLocalPhone(membre.user.phone)

  const confirmer = () => {
    if (!action) return
    if (action === 'retirer') {
      retirer({ tontineId: id, membreId }, {
        onSuccess: () => { toast.success(`${membre.user.firstName} a été retiré de la tontine`); navigate(`/tontine/${id}/membres`, { replace: true }) },
        onError: () => toast.error('Le retrait a échoué. Réessayez.'),
      })
      return
    }
    updateStatut(
      { tontineId: id, membreId, request: { statut: action === 'suspendre' ? MembreStatut.SUSPENDU : MembreStatut.ACTIF } },
      {
        onSuccess: () => { toast.success(action === 'suspendre' ? 'Membre suspendu' : 'Membre réactivé'); setAction(null) },
        onError: () => toast.error('La modification a échoué. Réessayez.'),
      },
    )
  }

  const confirmTextes: Record<Action, { titre: string; texte: string; bouton: string }> = {
    suspendre: { titre: `Suspendre ${membre.user.firstName} ?`, texte: 'Il ne pourra plus cotiser tant qu\'il est suspendu.', bouton: 'Suspendre' },
    reactiver: { titre: `Réactiver ${membre.user.firstName} ?`, texte: 'Il pourra de nouveau cotiser.', bouton: 'Réactiver' },
    retirer: { titre: `Retirer ${membre.user.firstName} ?`, texte: `${membre.user.firstName} ne fera plus partie de la tontine.`, bouton: 'Retirer' },
  }

  return (
    <Shell title={nom}>
      <div className={clsx('space-y-4', peutEncaisser && 'pb-28')}>
        <section className="bg-white rounded-3xl shadow-sm p-5 text-center">
          <div className="flex justify-center"><InitialsAvatar name={nom} size={64} /></div>
          <p className="mt-3 text-lg font-bold text-neutral-900">{nom}</p>
          <p className="text-sm text-neutral-500">{formatPhoneLocal(membre.user.phone)}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">Position {membre.ordreJackpot || '—'}</span>
            {membre.statut !== MembreStatut.ACTIF && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{membre.statut === MembreStatut.SUSPENDU ? 'Suspendu' : 'Sorti'}</span>
            )}
            {membre.user.accountStatus === AccountStatus.PRE_ENROLLED && (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">Sans compte</span>
            )}
          </div>
          {membre.aRecuJackpot && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-sm font-semibold text-yellow-800">
              <Trophy size={15} /> A reçu le jackpot{membre.dateJackpot ? ` le ${formatDateCourte(membre.dateJackpot)}` : ''}
            </p>
          )}
          {tel && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <a href={`tel:+221${tel}`} className="h-12 rounded-full bg-neutral-100 font-semibold text-neutral-800 inline-flex items-center justify-center gap-2"><Phone size={18} /> Appeler</a>
              <a href={`https://wa.me/221${tel}`} target="_blank" rel="noreferrer" className="h-12 rounded-full bg-neutral-100 font-semibold text-neutral-800 inline-flex items-center justify-center gap-2"><MessageCircle size={18} /> WhatsApp</a>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">Total versé</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-neutral-900">{formatF(total)}</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[['Validés', valides.length, 'text-primary-700'], ['En attente', nbAttente, 'text-amber-700'], ['En retard', nbRetard, 'text-red-700']].map(([k, n, cls]) => (
              <div key={k as string} className="rounded-2xl bg-neutral-50 py-3">
                <dt className="text-xs text-neutral-500">{k as string}</dt>
                <dd className={clsx('text-xl font-bold tabular-nums', cls as string)}>{n as number}</dd>
              </div>
            ))}
          </dl>
          {cycleEnCours && (
            <p className="mt-3 text-sm text-neutral-600">Tour {cycleEnCours.numeroCycle} : {payeCeTour ? 'payé ✓' : 'pas encore payé'}</p>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm">
          <h2 className="px-4 pt-4 text-[17px] font-semibold text-neutral-900">Paiements</h2>
          {cot.isLoading ? (
            <div className="p-4"><div className="h-14 rounded-2xl bg-neutral-100 animate-pulse" /></div>
          ) : paiements.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">Aucun paiement pour l'instant</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {paiements.map((c) => {
                const p = PILL[c.statut]
                const cy = cycles.find((x) => x.id === c.cycleId)
                return (
                  <li key={c.id}>
                    <Link to={`/recu/${id}/${c.id}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-neutral-900">{cy ? `Tour ${cy.numeroCycle}` : 'Cotisation'}</span>
                        <span className="block text-sm text-neutral-500 truncate">{paymentMethodLabel(c.methodePaiement)} · {formatDateHeure(c.createdAt)}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="font-bold tabular-nums">{formatF(c.montant)}</span>
                        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', p.cls)}>{p.icon} {p.label}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {membre.statut !== MembreStatut.SORTI && (
          <section className="bg-white rounded-3xl shadow-sm">
            <h2 className="px-4 pt-4 text-sm font-semibold text-neutral-500">Actions sensibles</h2>
            <div className="divide-y divide-neutral-100">
              {membre.statut === MembreStatut.ACTIF ? (
                <button onClick={() => setAction('suspendre')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-amber-800 disabled:opacity-50">Suspendre</button>
              ) : (
                <button onClick={() => setAction('reactiver')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-primary-800 disabled:opacity-50">Réactiver</button>
              )}
              <button onClick={() => setAction('retirer')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-red-700 disabled:opacity-50">Retirer de la tontine</button>
            </div>
          </section>
        )}
      </div>

      {peutEncaisser && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto">
            <Link to={`/encaisser/${id}?membre=${membreId}`} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold flex items-center justify-center">
              Encaisser
            </Link>
          </div>
        </div>
      )}

      <Modal isOpen={!!action} onClose={() => setAction(null)} title={action ? confirmTextes[action].titre : ''} size="sm">
        {action && (
          <>
            <p className="text-neutral-600">{confirmTextes[action].texte}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setAction(null)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
              <button
                onClick={confirmer}
                disabled={updating || removing}
                className={clsx('h-12 rounded-full text-white font-bold disabled:opacity-50', action === 'reactiver' ? 'bg-primary-700' : 'bg-red-600')}
              >
                {updating || removing ? '…' : confirmTextes[action].bouton}
              </button>
            </div>
          </>
        )}
      </Modal>
    </Shell>
  )
}

function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title={title} />
      <main className="px-4 pb-6 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
