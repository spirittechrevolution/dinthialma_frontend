/**
 * B3 — Encaisser un paiement (gestionnaire) : paiement reçu en main propre ou par transfert,
 * enregistré et validé immédiatement.
 *
 * /encaisser                       → « Pour quelle tontine ? » (sauté s'il n'y en a qu'une avec un tour en cours)
 * /encaisser/:tontineId            → « De qui ? » (membres pas encore payés en tête)
 * /encaisser/:tontineId?membre=id  → « Combien ? » directement (fiche membre, scan d'un QR membre)
 */
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Search, PartyPopper, CalendarX, RotateCw, Pencil } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { PaymentMethodTiles } from '@/components/pay/PaymentMethodTiles'
import { METHODE_PAR_DEFAUT } from '@/lib/paymentMethods'
import { AmountPad, BigAmount } from '@/components/pay/AmountPad'
import { useGestionSummary } from '@/hooks/useMe'
import { useTontine } from '@/hooks/useTontines'
import { useRecapCycle, useAdminRecordCotisation } from '@/hooks/useCotisations'
import { useOnline } from '@/hooks/useOnline'
import { formatF } from '@/lib/format'
import { messageErreur } from '@/lib/apiError'
import { AccountStatus, CotisationStatut, MembreStatut } from '@/types/common'
import type { CycleRecapLigne } from '@/types/cotisation'

export function EncaisserPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  return tontineId ? <EncaisserTontine tontineId={tontineId} /> : <ChoisirTontine />
}

// ─── « Pour quelle tontine ? » ───────────────────────────────────────────────

function ChoisirTontine() {
  const { data, isLoading, isError, refetch } = useGestionSummary()
  const avecTour = (data?.tontines ?? []).filter((t) => t.cycleEnCours)
    .sort((a, b) => {
      const ma = a.cycleEnCours!.membresActifs - a.cycleEnCours!.membresAyantPaye - a.cycleEnCours!.membresEnAttente
      const mb = b.cycleEnCours!.membresActifs - b.cycleEnCours!.membresAyantPaye - b.cycleEnCours!.membresEnAttente
      return mb - ma
    })

  if (isLoading) return <Shell><Skeleton /></Shell>
  if (isError) return <Shell><Erreur onRetry={() => refetch()} /></Shell>
  if (avecTour.length === 1) return <Navigate to={`/encaisser/${avecTour[0].tontineId}`} replace />

  return (
    <Shell>
      {avecTour.length === 0 ? (
        <Message icon={<CalendarX size={28} />} title="Aucun tour en cours" text="Démarrez un tour dans une de vos tontines pour encaisser." />
      ) : (
        <>
          <p className="px-1 text-sm font-semibold text-neutral-500">Pour quelle tontine ?</p>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {avecTour.map((t) => {
              const c = t.cycleEnCours!
              const manquants = c.membresActifs - c.membresAyantPaye - c.membresEnAttente
              return (
                <li key={t.tontineId}>
                  <Link to={`/encaisser/${t.tontineId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    <InitialsAvatar name={t.nom} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-neutral-900 truncate">{t.nom}</span>
                      <span className="block text-sm text-neutral-500">
                        Tour {c.numeroCycle} · {manquants > 0 ? `${manquants} n'ont pas payé` : 'tout le monde a payé'}
                      </span>
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

// ─── Tontine choisie ─────────────────────────────────────────────────────────

function EncaisserTontine({ tontineId }: { tontineId: string }) {
  const [params, setParams] = useSearchParams()
  const membreId = params.get('membre')
  const gestion = useGestionSummary()
  const { data: tontine } = useTontine(tontineId)
  const stats = gestion.data?.tontines.find((t) => t.tontineId === tontineId)
  const cycleId = stats?.cycleEnCours?.cycleId ?? ''
  const recap = useRecapCycle(tontineId, cycleId, 0, 200, !!cycleId)

  if (gestion.isLoading || (cycleId && recap.isLoading)) return <Shell title={tontine?.nom}><Skeleton /></Shell>
  if (gestion.isError || recap.isError) return <Shell><Erreur onRetry={() => { gestion.refetch(); recap.refetch() }} /></Shell>
  if (!stats) {
    return <Shell><Message icon={<CalendarX size={28} />} title="Tontine introuvable" text="Vous ne gérez pas cette tontine." /></Shell>
  }
  if (!stats.cycleEnCours) {
    return (
      <Shell title={stats.nom}>
        <Message icon={<CalendarX size={28} />} title="Aucun tour en cours" text="Démarrez un tour pour pouvoir encaisser.">
          <Link to={`/tontine/${tontineId}/tours`} className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold inline-flex items-center">Voir les tours</Link>
        </Message>
      </Shell>
    )
  }

  const lignes = (recap.data?.content ?? []).filter((l) => l.statutMembre === MembreStatut.ACTIF)
  const membre = membreId ? lignes.find((l) => l.membreId === membreId) : undefined

  const actif = (l: CycleRecapLigne) => (l.statutCotisation === CotisationStatut.EN_ATTENTE || l.statutCotisation === CotisationStatut.VALIDE)
  if (membreId && membre && !actif(membre)) {
    return (
      <Montant
        tontineId={tontineId}
        tontineNom={stats.nom}
        cycleId={cycleId}
        numeroCycle={stats.cycleEnCours.numeroCycle}
        montantDefaut={stats.montantLibre ? 0 : stats.montant ?? tontine?.montant ?? 0}
        membre={membre}
        onChangeMembre={() => setParams({}, { replace: true })}
      />
    )
  }
  return (
    <DeQui
      tontineId={tontineId}
      titre={stats.nom}
      numeroCycle={stats.cycleEnCours.numeroCycle}
      lignes={lignes}
      onChoisir={(id) => setParams({ membre: id })}
    />
  )
}

// ─── « De qui ? » ────────────────────────────────────────────────────────────

function DeQui({ tontineId, titre, numeroCycle, lignes, onChoisir }: {
  tontineId: string
  titre: string
  numeroCycle: number
  lignes: CycleRecapLigne[]
  onChoisir: (membreId: string) => void
}) {
  const [q, setQ] = useState('')
  const filtre = (l: CycleRecapLigne) => {
    const s = q.trim().toLowerCase()
    return !s || `${l.firstName} ${l.lastName}`.toLowerCase().includes(s) || (l.phone ?? '').includes(s.replace(/\s/g, ''))
  }
  const actif = (l: CycleRecapLigne) => (l.statutCotisation === CotisationStatut.EN_ATTENTE || l.statutCotisation === CotisationStatut.VALIDE)
  const nonPayes = lignes.filter((l) => !actif(l) && filtre(l))
  const payes = lignes.filter((l) => actif(l) && filtre(l))
  const toutPaye = lignes.length > 0 && lignes.every(actif)

  return (
    <Shell title={`Encaisser · ${titre}`}>
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="De qui ? Nom ou numéro"
          className="w-full h-14 pl-11 pr-4 rounded-2xl bg-white shadow-sm text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
          aria-label="Chercher un membre"
        />
      </div>
      <p className="mt-2 px-1 text-xs text-neutral-500">Tour {numeroCycle}</p>

      {toutPaye && !q && (
        <div className="mt-3">
          <Message icon={<PartyPopper size={28} />} title="Tout le monde a payé ce tour ✓" text="Il n'y a rien à encaisser." />
        </div>
      )}

      {nonPayes.length > 0 && (
        <section className="mt-3">
          <h2 className="px-1 text-sm font-semibold text-neutral-600">Pas encore payé ({nonPayes.length})</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {nonPayes.map((l) => (
              <li key={l.membreId}>
                <button onClick={() => onChoisir(l.membreId)} className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-neutral-50">
                  <InitialsAvatar name={`${l.firstName} ${l.lastName}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 truncate">{l.firstName} {l.lastName}</span>
                    <span className="block text-sm text-neutral-500">
                      {l.ordreJackpot ? `N° ${l.ordreJackpot}` : ''}
                      {l.accountStatus === AccountStatus.PRE_ENROLLED ? `${l.ordreJackpot ? ' · ' : ''}Sans compte` : ''}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payes.length > 0 && (
        <section className="mt-4">
          <h2 className="px-1 text-sm font-semibold text-neutral-600">Déjà payé ({payes.length})</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {payes.map((l) => {
              const enAttente = l.statutCotisation === CotisationStatut.EN_ATTENTE
              return (
                <li key={l.membreId}>
                  <Link to={`/recu/${tontineId}/${l.cotisationId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    <InitialsAvatar name={`${l.firstName} ${l.lastName}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-neutral-900 truncate">{l.firstName} {l.lastName}</span>
                      <span className="block text-sm text-neutral-500">{l.montant != null ? formatF(l.montant) : ''}</span>
                    </span>
                    <span className={enAttente ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800' : 'rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800'}>
                      {enAttente ? 'À valider' : 'Payé ✓'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {q && nonPayes.length === 0 && payes.length === 0 && (
        <p className="mt-6 text-center text-sm text-neutral-500">Aucun membre ne correspond.</p>
      )}
    </Shell>
  )
}

// ─── « Combien ? » ───────────────────────────────────────────────────────────

function Montant({ tontineId, tontineNom, cycleId, numeroCycle, montantDefaut, membre, onChangeMembre }: {
  tontineId: string
  tontineNom: string
  cycleId: string
  numeroCycle: number
  montantDefaut: number
  membre: CycleRecapLigne
  onChangeMembre: () => void
}) {
  const navigate = useNavigate()
  const online = useOnline()
  const { mutate: encaisser, isPending } = useAdminRecordCotisation()
  const [montant, setMontant] = useState(montantDefaut)
  const [editMontant, setEditMontant] = useState(montantDefaut === 0)
  const [methode, setMethode] = useState(METHODE_PAR_DEFAUT)
  const [plusOpen, setPlusOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nom = useMemo(() => `${membre.firstName} ${membre.lastName}`.trim(), [membre])

  const confirmer = () => {
    setError(null)
    if (montant <= 0) { setError('Saisissez un montant.'); return }
    encaisser(
      {
        tontineId,
        request: {
          membreId: membre.membreId,
          cycleId,
          montant,
          methodePaiement: methode,
          referenceTransaction: reference.trim() || undefined,
          note: note.trim() || undefined,
        },
      },
      {
        onSuccess: (cot) => navigate(`/recu/${tontineId}/${cot.id}`, { replace: true, state: { justCreated: true } }),
        onError: (err) => {
          setError(messageErreur(err, "L'encaissement n'a pas pu être enregistré. Réessayez."))
        },
      },
    )
  }

  return (
    <Shell title={`Encaisser · ${tontineNom}`}>
      <div className="space-y-4 pb-32">
        <section className="bg-white rounded-3xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={nom} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-neutral-900 truncate">{nom}</p>
              <p className="text-sm text-neutral-500">Tour {numeroCycle}{membre.accountStatus === AccountStatus.PRE_ENROLLED ? ' · Sans compte' : ''}</p>
            </div>
            <button onClick={onChangeMembre} className="h-11 px-3 rounded-full bg-neutral-100 text-sm font-semibold">Changer</button>
          </div>

          <div className="mt-5">
            <BigAmount value={montant} />
            {!editMontant ? (
              <div className="mt-2 flex justify-center">
                <button onClick={() => setEditMontant(true)} className="h-11 px-3 rounded-full text-sm font-semibold text-primary-800 inline-flex items-center gap-1.5">
                  <Pencil size={15} /> Modifier le montant
                </button>
              </div>
            ) : (
              <div className="mt-4"><AmountPad value={montant} onChange={setMontant} /></div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm p-4">
          <PaymentMethodTiles value={methode} onChange={setMethode} />
        </section>

        <section className="bg-white rounded-3xl shadow-sm">
          <button
            type="button"
            onClick={() => setPlusOpen((v) => !v)}
            aria-expanded={plusOpen}
            className="w-full h-14 px-4 flex items-center justify-between text-left text-[15px] font-medium text-neutral-800"
          >
            Référence et note
            <ChevronDown size={18} className={plusOpen ? 'rotate-180 transition' : 'transition'} />
          </button>
          {plusOpen && (
            <div className="px-4 pb-4 space-y-3">
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value.slice(0, 30))}
                placeholder="Référence (facultatif)"
                className="w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
                aria-label="Référence (facultatif)"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="Note (facultatif)"
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                aria-label="Note (facultatif)"
              />
            </div>
          )}
        </section>

        <p className="px-1 text-sm text-neutral-500">Le paiement sera validé et {membre.firstName} sera prévenu.</p>
        {error && <p role="alert" className="px-1 text-sm font-medium text-red-700">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={confirmer}
            disabled={!online || isPending || montant <= 0}
            className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold active:scale-[0.98] transition disabled:opacity-50"
          >
            {isPending ? 'Enregistrement…' : !online ? 'Connexion requise' : `Encaisser ${montant ? formatF(montant) : ''}`}
          </button>
        </div>
      </div>
    </Shell>
  )
}

// ─── Mise en page ────────────────────────────────────────────────────────────

function Shell({ children, title = 'Encaisser' }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title={title} />
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

function Erreur({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
      <p className="text-sm text-neutral-600">Impossible de charger les membres.</p>
      <button onClick={onRetry} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
        <RotateCw size={16} /> Réessayer
      </button>
    </section>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-14 rounded-2xl bg-white animate-pulse" />
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}
    </div>
  )
}
