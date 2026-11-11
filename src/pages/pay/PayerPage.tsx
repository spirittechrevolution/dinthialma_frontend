/**
 * B2 — Payer ma cotisation.
 *
 * Le membre paie hors de l'app (Wave, Orange Money, Free Money, espèces) puis le déclare ici.
 * Tontine et tour sont déduits ; montant prérempli (pavé numérique si montant libre) ;
 * moyen mémorisé. Parcours type : carte d'action « Payer » → « Confirmer » → reçu.
 *
 * /payer            → choix de la tontine (sauté s'il n'y a qu'une cotisation à payer)
 * /payer/:tontineId → déclaration
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, ChevronDown, ChevronRight, Clock, CheckCircle2, CalendarX, WifiOff } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { PaymentMethodTiles } from '@/components/pay/PaymentMethodTiles'
import { AmountPad, BigAmount } from '@/components/pay/AmountPad'
import { useCotisantSummary, useMesRoles } from '@/hooks/useMe'
import { useRecordCotisation } from '@/hooks/useCotisations'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte, safeGet, safeSet } from '@/lib/format'
import { formatPhoneLocal } from '@/lib/phone'
import { isMobileMoney, LAST_METHOD_KEY } from '@/lib/paymentMethods'
import { messageErreur } from '@/lib/apiError'
import type { CotisantTontineSummary } from '@/types/me'

export function PayerPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const roles = useMesRoles()
  const summary = useCotisantSummary(roles.cotise || roles.isLoading)
  const loading = roles.isLoading || summary.isLoading

  if (loading) return <PayerSkeleton />
  if (summary.isError) {
    return (
      <Shell>
        <Message icon={<WifiOff size={28} />} title="Impossible de charger vos cotisations" text="Vérifiez votre connexion puis réessayez.">
          <button onClick={() => summary.refetch()} className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold">Réessayer</button>
        </Message>
      </Shell>
    )
  }

  const lignes = summary.data?.tontines ?? []
  if (!tontineId) return <ChoisirTontine lignes={lignes} />

  const ligne = lignes.find((l) => l.tontineId === tontineId)
  if (!ligne) {
    return (
      <Shell>
        <Message icon={<CalendarX size={28} />} title="Vous ne cotisez pas dans cette tontine" text="Seuls les membres peuvent déclarer un paiement." />
      </Shell>
    )
  }
  return <DeclarerPaiement key={ligne.tontineId} ligne={ligne} />
}

// ─── Choix de la tontine (« Pour quelle tontine ? ») ─────────────────────────

function ChoisirTontine({ lignes }: { lignes: CotisantTontineSummary[] }) {
  const aPayer = lignes
    .filter((l) => l.cotisationDue?.statut === 'A_PAYER')
    .sort((a, b) => +new Date(a.cotisationDue!.dateLimite) - +new Date(b.cotisationDue!.dateLimite))
  const autres = lignes.filter((l) => l.cotisationDue && l.cotisationDue.statut !== 'A_PAYER')

  if (aPayer.length === 1 && autres.length === 0) return <Navigate to={`/payer/${aPayer[0].tontineId}`} replace />

  return (
    <Shell>
      {aPayer.length === 0 && autres.length === 0 ? (
        <Message icon={<CheckCircle2 size={28} />} title="Rien à payer pour l'instant" text="Vous serez prévenu à l'ouverture du prochain tour." />
      ) : (
        <>
          <p className="px-1 text-sm font-semibold text-neutral-500">Pour quelle tontine ?</p>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {[...aPayer, ...autres].map((l) => {
              const due = l.cotisationDue!
              const statut = due.statut === 'A_PAYER'
                ? `${due.montant != null ? formatF(due.montant) : 'Montant libre'} · avant le ${formatDateCourte(due.dateLimite)}`
                : due.statut === 'EN_ATTENTE' ? 'Déclarée · en attente de validation' : 'Payée ✓'
              return (
                <li key={l.tontineId}>
                  <Link to={`/payer/${l.tontineId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    <InitialsAvatar name={l.nom} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-neutral-900 truncate">{l.nom}</span>
                      <span className="block text-sm text-neutral-500 truncate">{statut}</span>
                    </span>
                    <ChevronRight size={18} className="text-neutral-300" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Shell>
  )
}

// ─── Déclaration ─────────────────────────────────────────────────────────────

function DeclarerPaiement({ ligne }: { ligne: CotisantTontineSummary }) {
  const navigate = useNavigate()
  const online = useOnline()
  const due = ligne.cotisationDue
  const { mutate: record, isPending } = useRecordCotisation()

  const [methode, setMethode] = useState(() => safeGet(LAST_METHOD_KEY) ?? '')
  const [montantLibre, setMontantLibre] = useState(0)
  const [refOpen, setRefOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!due) {
    return (
      <Shell>
        <Message
          icon={<CalendarX size={28} />}
          title="Aucun tour ouvert"
          text={`Il n'y a pas de tour en cours pour ${ligne.nom}. Vous serez prévenu à son ouverture.`}
        />
      </Shell>
    )
  }

  if (due.statut !== 'A_PAYER') {
    const valide = due.statut === 'VALIDE'
    return (
      <Shell>
        <Message
          icon={valide ? <CheckCircle2 size={28} /> : <Clock size={28} />}
          title={valide ? 'Cotisation déjà payée' : 'Cotisation déjà déclarée'}
          text={`${ligne.nom} · Tour ${due.numeroCycle}${valide ? '' : ' · en attente de validation par le gestionnaire'}`}
        >
          {due.cotisationId && (
            <Link to={`/recu/${ligne.tontineId}/${due.cotisationId}`} className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold inline-flex items-center">
              Voir le reçu
            </Link>
          )}
        </Message>
      </Shell>
    )
  }

  const montant = due.montantLibre ? montantLibre : due.montant ?? 0
  const minimum = due.montantMinimum ?? 0
  const montantValide = montant > 0 && (!due.montantLibre || montant >= minimum)
  const peutConfirmer = online && !!methode && montantValide && !isPending

  const copierNumero = async () => {
    try {
      await navigator.clipboard.writeText(formatPhoneLocal(ligne.gestionnaire.phone).replace(/\s/g, ''))
      toast.success('Numéro copié')
    } catch {
      toast.error('Copie impossible')
    }
  }

  const confirmer = () => {
    setError(null)
    if (!methode) { setError('Choisissez un moyen de paiement.'); return }
    if (!montantValide) { setError(minimum ? `Montant minimum : ${formatF(minimum)}.` : 'Saisissez un montant.'); return }
    record(
      {
        tontineId: ligne.tontineId,
        request: {
          cycleId: due.cycleId,
          montant,
          methodePaiement: methode,
          referenceTransaction: reference.trim() || undefined,
        },
      },
      {
        onSuccess: (cotisation) => {
          safeSet(LAST_METHOD_KEY, methode)
          navigate(`/recu/${ligne.tontineId}/${cotisation.id}`, { replace: true, state: { justCreated: true } })
        },
        onError: (err) => {
          setError(messageErreur(err, "Le paiement n'a pas pu être enregistré. Réessayez."))
        },
      },
    )
  }

  const gestionnaire = [ligne.gestionnaire.firstName, ligne.gestionnaire.lastName].filter(Boolean).join(' ')

  return (
    <Shell>
      <div className="space-y-4 pb-28">
        {due.motifDernierRefus && (
          <p role="status" className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-800">
            <b>Votre paiement a été refusé :</b> {due.motifDernierRefus}. Vous pouvez le déclarer à nouveau.
          </p>
        )}
        <section className="bg-white rounded-3xl shadow-sm p-5 text-center">
          <p className="text-sm font-medium text-neutral-500">{ligne.nom} · Tour {due.numeroCycle}</p>
          <div className="mt-3">
            <BigAmount value={montant} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {due.montantLibre
              ? minimum ? `Montant libre · minimum ${formatF(minimum)}` : 'Montant libre'
              : `À payer avant le ${formatDateCourte(due.dateLimite)}`}
          </p>
          {due.montantLibre && (
            <div className="mt-4">
              <AmountPad value={montantLibre} onChange={setMontantLibre} />
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-sm p-4">
          <PaymentMethodTiles value={methode} onChange={(v) => { setMethode(v); setError(null) }} />
        </section>

        {isMobileMoney(methode) && ligne.gestionnaire.phone && (
          <section className="rounded-3xl bg-primary-50 p-4">
            <p className="text-sm text-primary-900">
              Envoyez <b>{montant ? formatF(montant) : 'le montant'}</b> à <b>{gestionnaire || 'votre gestionnaire'}</b>
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xl font-bold tabular-nums text-neutral-900">{formatPhoneLocal(ligne.gestionnaire.phone)}</span>
              <button onClick={copierNumero} className="h-11 px-4 rounded-full bg-white text-sm font-semibold text-primary-800 inline-flex items-center gap-1.5">
                <Copy size={16} /> Copier
              </button>
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl shadow-sm">
          <button
            type="button"
            onClick={() => setRefOpen((v) => !v)}
            aria-expanded={refOpen}
            className="w-full h-14 px-4 flex items-center justify-between text-left text-[15px] font-medium text-neutral-800"
          >
            Ajouter la référence du transfert
            <ChevronDown size={18} className={refOpen ? 'rotate-180 transition' : 'transition'} />
          </button>
          {refOpen && (
            <div className="px-4 pb-4">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value.slice(0, 30))}
                placeholder="Ex : 123456789"
                autoComplete="off"
                className="w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
                aria-label="Référence du transfert (facultatif)"
              />
            </div>
          )}
        </section>

        {error && <p role="alert" className="px-1 text-sm font-medium text-red-700">{error}</p>}
      </div>

      {/* Bouton principal collé en bas (zone du pouce) */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={confirmer}
            disabled={!peutConfirmer}
            className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold active:scale-[0.98] transition disabled:opacity-50"
          >
            {isPending ? 'Envoi…' : !online ? 'Connexion requise' : `Confirmer mon paiement${montant ? ` de ${formatF(montant)}` : ''}`}
          </button>
          <p className="mt-2 text-center text-xs text-neutral-500">Le gestionnaire validera votre paiement.</p>
        </div>
      </div>
    </Shell>
  )
}

// ─── Mise en page ────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Payer ma cotisation" />
      <main className="px-4 pb-6 max-w-lg mx-auto">{children}</main>
    </div>
  )
}

function Message({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
      <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center">{icon}</span>
      <p className="mt-3 text-lg font-bold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{text}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </section>
  )
}

function PayerSkeleton() {
  return (
    <Shell>
      <div className="space-y-4" aria-busy="true">
        <div className="h-36 rounded-3xl bg-white animate-pulse" />
        <div className="h-48 rounded-3xl bg-white animate-pulse" />
      </div>
    </Shell>
  )
}
