/**
 * T7 — Tour : progression, retardataires, clôture, résultat et gagnant(s).
 *
 * Gestionnaire : « Clôturer le tour » (en cours) ; « Désigner le gagnant » / « Tirage au sort »
 * (terminé, ordre « choisi par le gestionnaire », sans gagnant) ; « Encaisser » par retardataire.
 * Membre : progression du tour, sa propre situation, résultat.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { Trophy, Clock, CheckCircle2, AlertTriangle, XCircle, Shuffle, RotateCw, PartyPopper } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useCycle, useCloturerCycle, useDesignerGagnants } from '@/hooks/useCycles'
import { useRecapCycle, useCotisations } from '@/hooks/useCotisations'
import { useMembres } from '@/hooks/useMembres'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte } from '@/lib/format'
import { TOUR_STATUT } from '@/lib/tontineLabels'
import { messageErreur } from '@/lib/apiError'
import { AccountStatus, CotisationStatut, CycleStatut, MembreStatut } from '@/types/common'
import { TontineType } from '@/types/tontine'
import type { Cycle } from '@/types/cycle'

const STATUT_PILL: Record<CotisationStatut, { label: string; cls: string; icon: JSX.Element }> = {
  EN_ATTENTE: { label: 'À valider', cls: 'bg-amber-50 text-amber-800', icon: <Clock size={13} /> },
  VALIDE: { label: 'Payé', cls: 'bg-primary-50 text-primary-800', icon: <CheckCircle2 size={13} /> },
  EN_RETARD: { label: 'En retard', cls: 'bg-red-50 text-red-700', icon: <AlertTriangle size={13} /> },
  REFUSE: { label: 'Refusé', cls: 'bg-red-50 text-red-700', icon: <XCircle size={13} /> },
}

export function TourPage() {
  const { id = '', cycleId = '' } = useParams()
  const online = useOnline()
  const v = useTontineVue(id)
  const t = v.tontine
  const gerant = v.vue === 'GERE'
  const { data: cycle, isLoading, isError, refetch } = useCycle(id, cycleId)
  const recap = useRecapCycle(id, cycleId, 0, 200, gerant)
  const mesCot = useCotisations(id, cycleId, 0, 20, v.ma?.monMembreId ?? undefined, v.vue === 'COTISE')
  const { data: membresData } = useMembres(id, 0, 200)
  const { mutate: cloturer, isPending: closing } = useCloturerCycle()
  const { mutate: designer, isPending: designating } = useDesignerGagnants()

  const [confirmCloture, setConfirmCloture] = useState(false)
  const [resultat, setResultat] = useState<Cycle | null>(null)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [tirageOpen, setTirageOpen] = useState(false)
  const [choix, setChoix] = useState<string[]>([])

  const isEvent = t?.tontineType === TontineType.EVENEMENTIELLE
  const mot = isEvent ? 'Période' : 'Tour'
  const lignes = (recap.data?.content ?? []).filter((l) => l.statutMembre !== MembreStatut.SORTI)
  const nonPayes = lignes.filter((l) => !l.cotisationId && l.statutMembre === MembreStatut.ACTIF)
  const payes = lignes.filter((l) => l.cotisationId)
  const valides = lignes.filter((l) => l.statutCotisation === CotisationStatut.VALIDE)
  const collecte = valides.reduce((s, l) => s + (l.montant ?? 0), 0)
  const actifs = lignes.filter((l) => l.statutMembre === MembreStatut.ACTIF).length
  const attendu = t?.montant && !t.montantLibre ? t.montant * actifs : null
  const pct = actifs ? Math.round((valides.length / actifs) * 100) : 0

  const nbGagnants = Math.max(1, t?.nombreGagnants || 1)
  const eligibles = useMemo(
    () => (membresData?.content ?? []).filter((m) => m.statut === MembreStatut.ACTIF && !m.aRecuJackpot),
    [membresData],
  )
  const sansGagnant = cycle?.statut === CycleStatut.TERMINE && !(cycle.gagnants?.length)
  const peutDesigner = gerant && !isEvent && sansGagnant && t?.ordreBeneficiaire === 'MANUEL'

  const maCotisation = mesCot.data?.content?.[0]

  if (isLoading || v.isLoading) {
    return (
      <Shell title={mot}>
        <div className="space-y-4" aria-busy="true">
          <div className="h-40 rounded-3xl bg-white animate-pulse" />
          <div className="h-48 rounded-3xl bg-white animate-pulse" />
        </div>
      </Shell>
    )
  }
  if (isError || !cycle) {
    return (
      <Shell title={mot}>
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">{mot} introuvable</p>
          <button onClick={() => refetch()} className="mt-4 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
            <RotateCw size={16} /> Réessayer
          </button>
        </section>
      </Shell>
    )
  }

  const st = TOUR_STATUT[cycle.statut]

  const onCloturer = () => cloturer(
    { tontineId: id, cycleId },
    {
      onSuccess: (c) => { setConfirmCloture(false); setResultat(c) },
      onError: (err) => toast.error(messageErreur(err, 'La clôture a échoué. Réessayez.')),
    },
  )
  const onDesigner = (membreIds: string[]) => designer(
    { tontineId: id, cycleId, request: { membreIds } },
    {
      onSuccess: (c) => { setDesignerOpen(false); setTirageOpen(false); setChoix([]); setResultat(c) },
      onError: (err) => toast.error(messageErreur(err, 'La désignation a échoué.')),
    },
  )

  // Action principale selon l'état
  let action: { label: string; onClick: () => void } | null = null
  if (gerant && cycle.statut === CycleStatut.EN_COURS) action = { label: `Clôturer ${isEvent ? 'la période' : 'le tour'}`, onClick: () => setConfirmCloture(true) }
  else if (peutDesigner) action = { label: nbGagnants > 1 ? 'Désigner les gagnants' : 'Désigner le gagnant', onClick: () => setDesignerOpen(true) }

  return (
    <Shell title={`${mot} ${cycle.numeroCycle}${t ? ` · ${t.nom}` : ''}`}>
      <div className={clsx('space-y-4', action && 'pb-28')}>
        {/* Progression */}
        <section className="bg-white rounded-3xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">{formatDateCourte(cycle.dateDebut)} → {formatDateCourte(cycle.dateFin)}</p>
            <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', st.cls)}>{st.label}</span>
          </div>

          {gerant ? (
            <div className="mt-4 flex items-center gap-5">
              <Anneau pct={pct} label={`${valides.length}/${actifs}`} />
              <div>
                <p className="text-sm text-neutral-500">Ont payé</p>
                <p className="text-2xl font-extrabold tabular-nums text-neutral-900">{formatF(collecte)}</p>
                {attendu ? <p className="text-sm text-neutral-500">sur {formatF(attendu)} prévus</p> : null}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {maCotisation ? (
                <Link to={`/recu/${id}/${maCotisation.id}`} className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3">
                  <span className="font-semibold text-neutral-900">Mon paiement · {formatF(maCotisation.montant)}</span>
                  <Pill statut={maCotisation.statut} />
                </Link>
              ) : cycle.statut === CycleStatut.EN_COURS && v.vue === 'COTISE' ? (
                <Link to={`/payer/${id}`} className="flex h-14 items-center justify-center rounded-full bg-primary-700 text-white font-bold">
                  Payer ma cotisation
                </Link>
              ) : (
                <p className="text-sm text-neutral-500">Aucun paiement de votre part sur ce {mot.toLowerCase()}.</p>
              )}
            </div>
          )}
        </section>

        {/* Résultat */}
        {cycle.statut === CycleStatut.TERMINE && (
          <section className="bg-white rounded-3xl shadow-sm p-5">
            <h2 className="text-[17px] font-semibold text-neutral-900">Résultat</h2>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                [isEvent ? 'Cagnotte' : 'Jackpot', cycle.montantJackpot],
                ['Commission', cycle.montantCommission],
                ['Net', cycle.montantNet],
              ].map(([k, val]) => (
                <div key={k as string} className="rounded-2xl bg-neutral-50 px-2 py-3">
                  <dt className="text-xs text-neutral-500">{k as string}</dt>
                  <dd className="mt-1 font-bold tabular-nums">{val != null ? formatF(val as number) : '—'}</dd>
                </div>
              ))}
            </dl>

            {(cycle.gagnants?.length ?? 0) > 0 ? (
              <ul className="mt-4 space-y-2">
                {cycle.gagnants!.map((g) => (
                  <li key={g.membreId} className="flex items-center gap-3 rounded-2xl bg-yellow-50 px-3 py-3">
                    <Trophy size={20} className="text-yellow-700" />
                    <span className="flex-1 font-semibold text-neutral-900">{g.firstName} {g.lastName}</span>
                    <span className="font-bold text-primary-700 tabular-nums">{g.montantRecu != null ? `+${formatF(g.montantRecu)}` : '—'}</span>
                  </li>
                ))}
              </ul>
            ) : !isEvent ? (
              <p className="mt-4 text-sm text-neutral-500">
                {peutDesigner ? 'Gagnant pas encore désigné.' : 'Gagnant en cours de désignation.'}
              </p>
            ) : null}

            {cycle.distributionParMembre && cycle.distributionParMembre.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-neutral-600">Répartition finale</h3>
                <ul className="mt-2 divide-y divide-neutral-100">
                  {cycle.distributionParMembre.map((d) => (
                    <li key={d.membreId} className="flex items-center justify-between py-2">
                      <span className="text-sm text-neutral-800">{d.firstName} {d.lastName}</span>
                      <span className="text-sm font-bold tabular-nums">{formatF(d.montantNet)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Listes (gestionnaire) */}
        {gerant && recap.isLoading && <div className="h-40 rounded-3xl bg-white animate-pulse" aria-busy="true" />}
        {gerant && recap.isError && (
          <section className="bg-white rounded-3xl shadow-sm p-5 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger les paiements du tour.</p>
            <button onClick={() => recap.refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold">Réessayer</button>
          </section>
        )}
        {gerant && !recap.isLoading && nonPayes.length > 0 && (
          <section className="bg-white rounded-3xl shadow-sm">
            <h2 className="px-4 pt-4 text-[17px] font-semibold text-neutral-900">Pas encore payé ({nonPayes.length})</h2>
            <ul className="divide-y divide-neutral-100">
              {nonPayes.map((l) => (
                <li key={l.membreId} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                  <InitialsAvatar name={`${l.firstName} ${l.lastName}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 truncate">{l.firstName} {l.lastName}</span>
                    {l.accountStatus === AccountStatus.PRE_ENROLLED && <span className="block text-sm text-neutral-500">Sans compte</span>}
                  </span>
                  {cycle.statut === CycleStatut.EN_COURS && (
                    <Link
                      to={`/encaisser/${id}?membre=${l.membreId}`}
                      className="h-10 px-4 rounded-full bg-primary-700 text-white text-sm font-bold inline-flex items-center"
                    >
                      Encaisser
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {gerant && !recap.isLoading && payes.length > 0 && (
          <section className="bg-white rounded-3xl shadow-sm">
            <h2 className="px-4 pt-4 text-[17px] font-semibold text-neutral-900">Payé ({payes.length})</h2>
            <ul className="divide-y divide-neutral-100">
              {payes.map((l) => (
                <li key={l.membreId}>
                  <Link to={`/recu/${id}/${l.cotisationId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    <InitialsAvatar name={`${l.firstName} ${l.lastName}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-neutral-900 truncate">{l.firstName} {l.lastName}</span>
                      <span className="block text-sm text-neutral-500">{l.montant != null ? formatF(l.montant) : ''}</span>
                    </span>
                    {l.statutCotisation && <Pill statut={l.statutCotisation} />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {gerant && !recap.isLoading && lignes.length > 0 && payes.length === 0 && cycle.statut === CycleStatut.EN_COURS && (
          <p className="text-center text-sm text-neutral-500">Personne n'a encore payé.</p>
        )}
      </div>

      {/* Action principale */}
      {action && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto space-y-2">
            <button onClick={action.onClick} disabled={!online} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
              {online ? action.label : 'Connexion requise'}
            </button>
            {peutDesigner && (
              <button onClick={() => setTirageOpen(true)} disabled={!online} className="w-full h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Shuffle size={18} /> Tirage au sort
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation de clôture */}
      <Modal isOpen={confirmCloture} onClose={() => setConfirmCloture(false)} title={`Clôturer ${isEvent ? 'la période' : 'le tour'} ${cycle.numeroCycle} ?`} size="sm">
        <p className="text-neutral-600">Le jackpot sera calculé et les paiements non validés passeront en retard.</p>
        {nonPayes.length > 0 && (
          <p className="mt-2 text-sm font-medium text-amber-800">{nonPayes.length} membre{nonPayes.length > 1 ? 's' : ''} n'{nonPayes.length > 1 ? 'ont' : 'a'} pas encore payé.</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setConfirmCloture(false)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button onClick={onCloturer} disabled={closing} className="h-12 rounded-full bg-primary-700 text-white font-bold disabled:opacity-50">
            {closing ? 'Clôture…' : 'Clôturer'}
          </button>
        </div>
      </Modal>

      {/* Désignation manuelle */}
      <Modal isOpen={designerOpen} onClose={() => { setDesignerOpen(false); setChoix([]) }} title={nbGagnants > 1 ? `Choisir ${nbGagnants} gagnants` : 'Choisir le gagnant'} size="sm">
        {eligibles.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucun membre éligible (tous ont déjà reçu le jackpot).</p>
        ) : (
          <ul className="-mx-2 max-h-[50vh] overflow-y-auto">
            {eligibles.map((m) => {
              const selected = choix.includes(m.id)
              const plein = !selected && choix.length >= nbGagnants
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setChoix((c) => (selected ? c.filter((x) => x !== m.id) : nbGagnants === 1 ? [m.id] : [...c, m.id]))}
                    disabled={plein && nbGagnants > 1}
                    aria-pressed={selected}
                    className={clsx('w-full flex items-center gap-3 px-2 py-3 rounded-2xl text-left', selected ? 'bg-primary-50' : 'hover:bg-neutral-50', plein && nbGagnants > 1 && 'opacity-40')}
                  >
                    <InitialsAvatar name={`${m.user.firstName} ${m.user.lastName}`} />
                    <span className="flex-1 font-semibold text-neutral-900">{m.user.firstName} {m.user.lastName}</span>
                    {m.ordreJackpot ? <span className="text-sm text-neutral-500">N° {m.ordreJackpot}</span> : null}
                    {selected && <CheckCircle2 size={20} className="text-primary-700" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <button
          onClick={() => onDesigner(choix)}
          disabled={choix.length !== Math.min(nbGagnants, eligibles.length) || designating}
          className="mt-4 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50"
        >
          {designating ? 'Enregistrement…' : 'Confirmer'}
        </button>
      </Modal>

      {/* Tirage au sort */}
      <Modal isOpen={tirageOpen} onClose={() => setTirageOpen(false)} title="Tirage au sort ?" size="sm">
        <p className="text-neutral-600">
          {nbGagnants > 1 ? `${nbGagnants} gagnants seront tirés` : 'Le gagnant sera tiré'} au sort parmi les membres qui n'ont pas encore reçu le jackpot.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setTirageOpen(false)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button onClick={() => onDesigner([])} disabled={designating} className="h-12 rounded-full bg-primary-700 text-white font-bold disabled:opacity-50">
            {designating ? 'Tirage…' : 'Tirer au sort'}
          </button>
        </div>
      </Modal>

      {/* Écran de résultat après clôture / désignation */}
      <Modal isOpen={!!resultat} onClose={() => setResultat(null)} title={isEvent ? 'Période clôturée' : 'Tour clôturé'} size="sm">
        {resultat && (
          <div className="text-center py-2">
            <span className="mx-auto w-20 h-20 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center animate-pop">
              {(resultat.gagnants?.length ?? 0) > 0 ? <Trophy size={40} /> : <PartyPopper size={40} />}
            </span>
            {(resultat.gagnants?.length ?? 0) > 0 ? (
              <p className="mt-4 text-lg font-bold text-neutral-900">
                Jackpot de {formatF(resultat.montantNet)} pour {resultat.gagnants!.map((g) => g.firstName).join(', ')}
              </p>
            ) : (
              <p className="mt-4 text-lg font-bold text-neutral-900">
                {resultat.montantNet != null ? `Net à remettre : ${formatF(resultat.montantNet)}` : 'Clôture enregistrée'}
              </p>
            )}
            {resultat.distributionParMembre && resultat.distributionParMembre.length > 0 && (
              <p className="mt-1 text-sm text-neutral-500">La cagnotte est répartie entre tous les membres.</p>
            )}
            <button onClick={() => setResultat(null)} className="mt-6 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold">Terminé</button>
          </div>
        )}
      </Modal>
    </Shell>
  )
}

function Pill({ statut }: { statut: CotisationStatut }) {
  const p = STATUT_PILL[statut]
  return <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold flex-shrink-0', p.cls)}>{p.icon} {p.label}</span>
}

/** Anneau de progression avec la valeur en texte (« 8/12 ») */
function Anneau({ pct, label }: { pct: number; label: string }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${label} ont payé`} className="flex-shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
      <circle
        cx="44" cy="44" r={r} fill="none" stroke="#15803d" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} transform="rotate(-90 44 44)"
      />
      <text x="44" y="49" textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827">{label}</text>
    </svg>
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
