/**
 * B5 — Reçu / détail d'un paiement : quoi, qui, quand, quel statut.
 * Affiché après une déclaration (state.justCreated), depuis le fil d'activité ou une alerte.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { Clock, CheckCircle2, AlertTriangle, Share2, Pencil, RotateCw } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { AdminEditCotisationModal } from '@/components/shared/AdminEditCotisationModal'
import { useCotisation, useValiderCotisation } from '@/hooks/useCotisations'
import { useTontine } from '@/hooks/useTontines'
import { useCycle } from '@/hooks/useCycles'
import { useMesTontines } from '@/hooks/useMe'
import { useOnline } from '@/hooks/useOnline'
import { formatFcfaRecu, formatDateHeure } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import { shareLink } from '@/lib/share'
import { CotisationStatut, CycleStatut } from '@/types/common'
import { jeGere } from '@/types/me'

const ETATS: Record<CotisationStatut, { label: string; icon: JSX.Element; cls: string }> = {
  EN_ATTENTE: { label: 'En attente de validation', icon: <Clock size={40} />, cls: 'bg-amber-100 text-amber-800' },
  VALIDE: { label: 'Validé', icon: <CheckCircle2 size={40} />, cls: 'bg-primary-100 text-primary-700' },
  EN_RETARD: { label: 'En retard', icon: <AlertTriangle size={40} />, cls: 'bg-red-100 text-red-700' },
}

export function RecuPage() {
  const { tontineId = '', cotisationId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const online = useOnline()
  const justCreated = !!(location.state as { justCreated?: boolean } | null)?.justCreated

  const { data: cot, isLoading, isError, refetch } = useCotisation(tontineId, cotisationId)
  const { data: tontine } = useTontine(tontineId)
  const { data: cycle } = useCycle(tontineId, cot?.cycleId ?? '')
  const { data: mesTontines } = useMesTontines()
  const gere = !!mesTontines?.find((t) => t.id === tontineId && jeGere(t))
  const { mutate: valider, isPending: validating } = useValiderCotisation()
  const [editOpen, setEditOpen] = useState(false)

  const terminer = () => (justCreated ? navigate('/accueil', { replace: true }) : navigate(-1))

  if (isLoading) {
    return (
      <Shell>
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4" aria-busy="true">
          <span className="mx-auto block w-20 h-20 rounded-full bg-neutral-100 animate-pulse" />
          <span className="mx-auto block h-10 w-40 rounded-xl bg-neutral-100 animate-pulse" />
          <span className="block h-24 rounded-2xl bg-neutral-100 animate-pulse" />
        </div>
      </Shell>
    )
  }

  if (isError || !cot) {
    return (
      <Shell>
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Paiement introuvable</p>
          <p className="mt-1 text-sm text-neutral-500">Il a peut-être été supprimé, ou la connexion est coupée.</p>
          <button onClick={() => refetch()} className="mt-4 h-12 px-5 rounded-full bg-neutral-100 font-semibold inline-flex items-center gap-2">
            <RotateCw size={16} /> Réessayer
          </button>
        </section>
      </Shell>
    )
  }

  const etat = ETATS[cot.statut] ?? ETATS.EN_ATTENTE
  const membreNom = [cot.membre?.firstName, cot.membre?.lastName].filter(Boolean).join(' ')
  const encaissePar = cot.enregistrePar && cot.enregistrePar.id !== cot.membre?.userId
    ? [cot.enregistrePar.firstName, cot.enregistrePar.lastName].filter(Boolean).join(' ')
    : null
  const peutModifier = gere && (
    cot.statut === CotisationStatut.EN_ATTENTE ||
    (cot.statut === CotisationStatut.VALIDE && cycle?.statut === CycleStatut.EN_COURS)
  )
  const peutValider = gere && cot.statut === CotisationStatut.EN_ATTENTE
  const tontineNom = tontine?.nom ?? 'Tontine'

  const lignes: [string, string][] = [
    ['Tontine', `${tontineNom}${cycle ? ` · Tour ${cycle.numeroCycle}` : ''}`],
    ['Membre', membreNom || '—'],
    ['Moyen', paymentMethodLabel(cot.methodePaiement)],
    ...(cot.referenceTransaction ? [['Référence', cot.referenceTransaction] as [string, string]] : []),
    ['Date', formatDateHeure(cot.createdAt)],
    ['Origine', encaissePar ? `Encaissé par ${encaissePar}` : 'Déclaré par le membre'],
    ...(cot.dateValidation ? [['Validé le', formatDateHeure(cot.dateValidation)] as [string, string]] : []),
  ]

  const partager = () => shareLink({
    title: 'Reçu Dinthialma',
    text: `Reçu Dinthialma — ${formatFcfaRecu(cot.montant)} · ${tontineNom}${cycle ? ` · Tour ${cycle.numeroCycle}` : ''} · ${membreNom} · ${etat.label} · ${formatDateHeure(cot.createdAt)}`,
    url: window.location.href,
  })

  const onValider = () => valider(
    { tontineId, cotisationId },
    {
      onSuccess: () => toast.success(`Paiement de ${cot.membre?.firstName ?? 'ce membre'} validé`),
      onError: () => toast.error('La validation a échoué. Réessayez.'),
    },
  )

  return (
    <Shell onBack={terminer}>
      <div className="space-y-4 pb-32">
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <span className={clsx('mx-auto w-20 h-20 rounded-full flex items-center justify-center animate-pop', etat.cls)} aria-hidden="true">
            {etat.icon}
          </span>
          <p className="mt-3 font-semibold text-neutral-700" role="status">{etat.label}</p>
          <p className="mt-2 text-[40px] leading-none font-extrabold tabular-nums text-neutral-900">{formatFcfaRecu(cot.montant)}</p>
          {justCreated && cot.statut === CotisationStatut.EN_ATTENTE && (
            <p className="mt-3 text-sm text-neutral-500">Le gestionnaire va vérifier et valider votre paiement.</p>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm">
          <dl className="divide-y divide-neutral-100">
            {lignes.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-neutral-500">{k}</dt>
                <dd className="text-sm font-semibold text-neutral-900 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={partager} className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
            <Share2 size={18} /> Partager
          </button>
          {peutModifier ? (
            <button onClick={() => setEditOpen(true)} disabled={!online} className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Pencil size={18} /> Modifier
            </button>
          ) : (
            <Link
              to={gere ? `/admin/tontines/${tontineId}` : `/member/tontines/${tontineId}`}
              className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center"
            >
              Voir la tontine
            </Link>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          {peutValider ? (
            <button
              onClick={onValider}
              disabled={!online || validating}
              className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold active:scale-[0.98] transition disabled:opacity-50"
            >
              {validating ? 'Validation…' : !online ? 'Connexion requise' : 'Valider ce paiement'}
            </button>
          ) : (
            <button onClick={terminer} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold active:scale-[0.98] transition">
              Terminé
            </button>
          )}
        </div>
      </div>

      {peutModifier && (
        <AdminEditCotisationModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          tontineId={tontineId}
          cotisationId={cotisationId}
          membreNom={membreNom}
          initialValues={{
            montant: cot.montant,
            methodePaiement: cot.methodePaiement,
            referenceTransaction: cot.referenceTransaction,
            note: cot.note,
          }}
        />
      )}
    </Shell>
  )
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Reçu" onBack={onBack} />
      <main className="px-4 pb-6 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
