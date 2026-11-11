/**
 * T2 — Fiche Tontine (gabarit « fiche d'objet » de Wave) :
 * montant énorme, 2 boutons pilule, carte de rubriques, historique des paiements.
 *
 * Vue gestionnaire : Encaisser · Valider (n) ; vue membre : Payer · Mon tour ; brouillon : Lancer.
 * Rubrique Réglages et bouton Infos : ancienne page détail (?onglet=) en attendant T8.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import {
  ArrowLeft, Eye, EyeOff, UserPlus, Info, Users, RefreshCw, Settings, Trophy, ChevronRight,
  CreditCard, ListChecks, Send, CalendarClock, Play, Lock, RotateCw, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useCycles } from '@/hooks/useCycles'
import { useMembres } from '@/hooks/useMembres'
import { useRecapCycle, useValiderCotisation } from '@/hooks/useCotisations'
import { useActiverTontine } from '@/hooks/useTontines'
import { useCotisantSummary, useCotisationsParStatut } from '@/hooks/useMe'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte, formatDateHeure } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import { rythmeCourt, compteARebours } from '@/lib/tontineLabels'
import { CotisationStatut, CycleStatut, MembreStatut, TontineStatut } from '@/types/common'
import { TontineType } from '@/types/tontine'
import type { Cotisation } from '@/types/cotisation'

const FILTRES: { id: string; label: string; statuts: CotisationStatut[] }[] = [
  { id: 'tous', label: 'Tous', statuts: [] },
  { id: 'attente', label: 'En attente', statuts: [CotisationStatut.EN_ATTENTE] },
  { id: 'valides', label: 'Validés', statuts: [CotisationStatut.VALIDE] },
  { id: 'retard', label: 'En retard', statuts: [CotisationStatut.EN_RETARD] },
]

const STATUT_PILL: Record<CotisationStatut, { label: string; cls: string; icon: JSX.Element }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-800', icon: <Clock size={13} /> },
  VALIDE: { label: 'Validé', cls: 'bg-primary-50 text-primary-800', icon: <CheckCircle2 size={13} /> },
  EN_RETARD: { label: 'En retard', cls: 'bg-red-50 text-red-700', icon: <AlertTriangle size={13} /> },
}

const PAGE = 30

export function FicheTontinePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const v = useTontineVue(id)
  const t = v.tontine
  const gerant = v.vue === 'GERE'

  const [hiddenPref, setHiddenPref] = useLocalPreference<'0' | '1'>('dinthialma_hide_amount', '0', ['0', '1'] as const)
  const hidden = hiddenPref === '1'
  const [filtre, setFiltre] = useState('tous')
  const [limite, setLimite] = useState(PAGE)
  const [addOpen, setAddOpen] = useState(false)
  const [confirmLancer, setConfirmLancer] = useState(false)

  const { data: cyclesData } = useCycles(id, 0, 200)
  const cycles = cyclesData?.content ?? []
  const cycleEnCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)
  const { data: membresData } = useMembres(id, 0, 200)
  const membres = membresData?.content ?? []
  const actifs = membres.filter((m) => m.statut === MembreStatut.ACTIF)
  const recap = useRecapCycle(id, cycleEnCours?.id ?? '', 0, 200, gerant && !!cycleEnCours)
  const cotisant = useCotisantSummary(v.vue === 'COTISE')
  const maLigne = cotisant.data?.tontines.find((l) => l.tontineId === id)

  const statuts = FILTRES.find((f) => f.id === filtre)?.statuts ?? []
  const historique = useCotisationsParStatut(id, statuts, {
    membreId: v.vue === 'COTISE' ? v.ma?.monMembreId ?? undefined : undefined,
  })
  const { mutate: valider, isPending: validating } = useValiderCotisation()
  const { mutate: activer, isPending: activating } = useActiverTontine()

  const lignesRecap = recap.data?.content ?? []
  const collecte = lignesRecap.filter((l) => l.statutCotisation === CotisationStatut.VALIDE).reduce((s, l) => s + (l.montant ?? 0), 0)
  const ontPaye = lignesRecap.filter((l) => l.statutCotisation === CotisationStatut.VALIDE).length
  const enAttente = lignesRecap.filter((l) => l.statutCotisation === CotisationStatut.EN_ATTENTE).length
  const actifsRecap = lignesRecap.filter((l) => l.statutMembre === MembreStatut.ACTIF).length

  const prochainsGagnants = useMemo(() => {
    if (!t || t.tontineType !== TontineType.ROTATIVE || t.ordreBeneficiaire !== 'ROTATION') return []
    return actifs
      .filter((m) => !m.aRecuJackpot)
      .sort((a, b) => (a.ordreJackpot ?? 0) - (b.ordreJackpot ?? 0))
      .slice(0, Math.max(1, t.nombreGagnants || 1))
      .map((m) => m.user.firstName)
  }, [t, actifs])

  if (v.isLoading) return <FicheSkeleton />
  if (v.isError || !t) {
    return (
      <div className="min-h-[100dvh] bg-[#f2f3f5] p-4">
        <BackButton />
        <section className="mt-4 bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Tontine introuvable</p>
          <button onClick={() => v.refetch()} className="mt-4 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
            <RotateCw size={16} /> Réessayer
          </button>
        </section>
      </div>
    )
  }

  const isEvent = t.tontineType === TontineType.EVENEMENTIELLE
  const brouillon = t.statut === TontineStatut.BROUILLON
  const jackpotEstime = t.montant && !t.montantLibre
    ? Math.round((t.montant * (actifs.length || t.nombreMembres)) / Math.max(1, t.nombreGagnants || 1))
    : null

  // Montant énorme + ligne d'état
  let libelleMontant: string
  let montant: number | null
  if (gerant) {
    libelleMontant = cycleEnCours ? `Collecté · Tour ${cycleEnCours.numeroCycle}` : 'Aucun tour en cours'
    montant = cycleEnCours ? collecte : null
  } else if (isEvent) {
    libelleMontant = 'Cotisé par moi'
    montant = maLigne?.totalCotiseValide ?? 0
  } else {
    libelleMontant = 'Jackpot du tour'
    montant = jackpotEstime
  }
  const etat = [
    cycleEnCours ? `Tour ${cycleEnCours.numeroCycle}` : null,
    gerant && cycleEnCours ? `${ontPaye}/${actifsRecap || actifs.length} ont payé` : null,
    cycleEnCours ? `fin le ${formatDateCourte(cycleEnCours.dateFin)}` : null,
    isEvent ? compteARebours(t.dateEcheance) : null,
  ].filter(Boolean).join(' · ')
  const pct = gerant && t.montant && actifsRecap ? Math.min(100, Math.round((collecte / (t.montant * actifsRecap)) * 100)) : null

  // Boutons pilule
  const due = maLigne?.cotisationDue
  const nbAValider = gerant ? enAttente : 0
  const pills: { label: string; icon: JSX.Element; onClick: () => void; disabled?: boolean }[] = brouillon && gerant
    ? [{ label: 'Lancer la tontine', icon: <Play size={20} />, onClick: () => setConfirmLancer(true), disabled: !online }]
    : gerant
      ? [
          { label: 'Encaisser', icon: <CreditCard size={20} />, onClick: () => navigate(`/encaisser/${id}`), disabled: !cycleEnCours },
          { label: nbAValider ? `Valider (${nbAValider})` : 'Valider', icon: <ListChecks size={20} />, onClick: () => navigate(`/a-valider?tontine=${id}`) },
        ]
      : v.vue === 'COTISE'
        ? [
            {
              label: due?.statut === 'VALIDE' ? 'Payé ✓' : due?.statut === 'EN_ATTENTE' ? 'Déclaré' : 'Payer',
              icon: <Send size={20} />,
              onClick: () => navigate(`/payer/${id}`),
              disabled: !due,
            },
            { label: 'Mon tour', icon: <CalendarClock size={20} />, onClick: () => navigate('/jackpots') },
          ]
        : []

  const cotisations = historique.data ?? []
  const visibles = cotisations.slice(0, limite)

  const onValider = (c: Cotisation) => valider(
    { tontineId: id, cotisationId: c.id },
    {
      onSuccess: () => toast.success(`Paiement de ${c.membre.firstName} validé`),
      onError: () => toast.error('La validation a échoué. Réessayez.'),
    },
  )

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* En-tête */}
      <header className="px-2 pt-[max(0.5rem,env(safe-area-inset-top))] flex items-center justify-between">
        <BackButton />
        {gerant && !brouillon ? (
          <button onClick={() => setAddOpen(true)} className="h-11 px-4 mr-2 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
            <UserPlus size={16} /> Membre
          </button>
        ) : (
          <Link to={`/member/tontines/${id}?onglet=infos`} className="h-11 px-4 mr-2 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
            <Info size={16} /> Infos
          </Link>
        )}
      </header>

      <main className="px-4 max-w-lg mx-auto md:max-w-5xl md:grid md:grid-cols-2 md:gap-6 md:items-start">
        <div className="space-y-4">
          {/* Identité + montant */}
          <section className="text-center pt-2">
            <div className="flex items-center justify-center gap-2">
              <InitialsAvatar name={t.nom} size={40} />
              <h1 className="text-lg font-bold text-neutral-900 truncate max-w-[70%]">{t.nom}</h1>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {v.vue !== 'LECTURE' && (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-sm">
                  {gerant ? 'Gestionnaire' : 'Membre'}
                </span>
              )}
              {t.statut !== TontineStatut.ACTIVE && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {t.statut === TontineStatut.BROUILLON ? 'Brouillon' : t.statut === TontineStatut.SUSPENDUE ? 'Suspendue' : 'Terminée'}
                </span>
              )}
              {v.vue === 'LECTURE' && (
                <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 inline-flex items-center gap-1">
                  <Lock size={11} /> Lecture seule
                </span>
              )}
            </div>
            {v.deuxVues && (
              <div role="tablist" aria-label="Vue" className="mt-3 mx-auto flex max-w-[15rem] rounded-full bg-white p-1 shadow-sm">
                {(['GERE', 'COTISE'] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={v.vue === m}
                    onClick={() => v.setVue(m)}
                    className={clsx('flex-1 h-9 rounded-full text-sm font-semibold', v.vue === m ? 'bg-primary-700 text-white' : 'text-neutral-600')}
                  >
                    {m === 'GERE' ? 'Je gère' : 'Je cotise'}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">{libelleMontant}</p>
            <div className="mt-1 flex items-center justify-center gap-1">
              <span className="text-[40px] leading-none font-extrabold tabular-nums text-neutral-900">
                {montant === null ? '—' : hidden ? '••••••' : `${!gerant && !isEvent ? '≈ ' : ''}${formatF(montant)}`}
              </span>
              <button
                onClick={() => setHiddenPref(hidden ? '0' : '1')}
                className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-500 hover:bg-black/5"
                aria-label={hidden ? 'Afficher le montant' : 'Masquer le montant'}
              >
                {hidden ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {t.montantLibre ? 'Montant libre' : `${formatF(t.montant)} / ${rythmeCourt(t.frequence)}`}
              {etat ? ` · ${etat}` : ''}
            </p>
            {pct !== null && (
              <div className="mt-3 mx-auto max-w-xs h-2 rounded-full bg-white overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            )}
          </section>

          {/* Boutons pilule */}
          {pills.length > 0 && (
            <div className={clsx('grid gap-3', pills.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
              {pills.map((p) => (
                <button
                  key={p.label}
                  onClick={p.onClick}
                  disabled={p.disabled}
                  className="h-14 rounded-full bg-primary-700 text-white font-bold text-[16px] inline-flex items-center justify-center gap-2 active:scale-[0.97] transition disabled:opacity-50"
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Rubriques */}
          <section className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            <Rubrique to={`/tontine/${id}/membres`} icon={<Users size={20} />} label="Membres" value={String(t.nombreMembresActuels)} />
            <Rubrique to={`/tontine/${id}/tours`} icon={<RefreshCw size={20} />} label={isEvent ? 'Périodes' : 'Tours'} value={cycleEnCours ? `Tour ${cycleEnCours.numeroCycle} en cours` : undefined} />
            {gerant && <Rubrique to={`/admin/tontines/${id}?onglet=infos`} icon={<Settings size={20} />} label="Réglages" />}
            {prochainsGagnants.length > 0 && (
              <div className="flex items-center gap-3 px-4 min-h-[56px]">
                <Trophy size={20} className="text-yellow-700" />
                <span className="flex-1 text-[15px] text-neutral-800">Prochain gagnant</span>
                <span className="text-sm font-semibold text-neutral-900">{prochainsGagnants.join(', ')}</span>
              </div>
            )}
          </section>
        </div>

        {/* Historique */}
        <section className="mt-4 md:mt-0 bg-white rounded-3xl shadow-sm">
          <h2 className="px-4 pt-4 text-[17px] font-semibold text-neutral-900">{gerant ? 'Paiements' : 'Mes paiements'}</h2>
          <div className="flex gap-2 overflow-x-auto px-4 py-3" role="group" aria-label="Filtrer par statut">
            {FILTRES.map((f) => (
              <button
                key={f.id}
                aria-pressed={filtre === f.id}
                onClick={() => { setFiltre(f.id); setLimite(PAGE) }}
                className={clsx('h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap', filtre === f.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700')}
              >
                {f.label}
              </button>
            ))}
          </div>
          {historique.isLoading ? (
            <div className="px-4 pb-4 space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-neutral-100 animate-pulse" />)}
            </div>
          ) : historique.isError ? (
            <div className="px-4 pb-6 text-center">
              <p className="text-sm text-neutral-600">Impossible de charger les paiements.</p>
              <button onClick={() => historique.refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold">Réessayer</button>
            </div>
          ) : visibles.length === 0 ? (
            <p className="px-4 pb-6 text-sm text-neutral-500 text-center">Aucun paiement</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {visibles.map((c) => {
                const st = STATUT_PILL[c.statut]
                const nom = `${c.membre.firstName} ${c.membre.lastName}`.trim()
                const cycle = cycles.find((cy) => cy.id === c.cycleId)
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                    <Link to={`/recu/${id}/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      {gerant ? <InitialsAvatar name={nom || '?'} /> : null}
                      <span className="min-w-0">
                        <span className="block font-semibold text-neutral-900 truncate">
                          {gerant ? nom : `Cotisation${cycle ? ` · Tour ${cycle.numeroCycle}` : ''}`}
                        </span>
                        <span className="block text-sm text-neutral-500 truncate">
                          {paymentMethodLabel(c.methodePaiement)} · {formatDateHeure(c.createdAt)}
                        </span>
                      </span>
                    </Link>
                    <span className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="font-bold tabular-nums">{formatF(c.montant)}</span>
                      {gerant && c.statut === CotisationStatut.EN_ATTENTE ? (
                        <button
                          onClick={() => onValider(c)}
                          disabled={!online || validating}
                          className="h-9 px-3 rounded-full bg-primary-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          Valider
                        </button>
                      ) : (
                        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', st.cls)}>
                          {st.icon} {st.label}
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {cotisations.length > limite && (
            <button onClick={() => setLimite((l) => l + PAGE)} className="w-full h-12 text-sm font-semibold text-primary-800 border-t border-neutral-100">
              Voir plus
            </button>
          )}
        </section>
      </main>

      {gerant && <AddMembreModal tontineId={id} isOpen={addOpen} onClose={() => setAddOpen(false)} />}

      <Modal isOpen={confirmLancer} onClose={() => setConfirmLancer(false)} title="Lancer la tontine ?" size="sm">
        <p className="text-neutral-600">Les membres pourront commencer à cotiser. Vérifiez que tout le monde est ajouté.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setConfirmLancer(false)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button
            disabled={activating}
            onClick={() => activer(id, {
              onSuccess: () => { toast.success('Tontine lancée'); setConfirmLancer(false) },
              onError: () => toast.error("Le lancement a échoué. Réessayez."),
            })}
            className="h-12 rounded-full bg-primary-700 text-white font-bold disabled:opacity-50"
          >
            {activating ? 'Lancement…' : 'Lancer'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function Rubrique({ to, icon, label, value }: { to: string; icon: JSX.Element; label: string; value?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 min-h-[56px] hover:bg-neutral-50">
      <span className="text-neutral-600">{icon}</span>
      <span className="flex-1 text-[15px] text-neutral-800">{label}</span>
      {value && <span className="text-sm text-neutral-500">{value}</span>}
      <ChevronRight size={18} className="text-neutral-300" />
    </Link>
  )
}

function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/accueil'))}
      className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-900 hover:bg-black/5"
      aria-label="Retour"
    >
      <ArrowLeft size={24} />
    </button>
  )
}

function FicheSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] p-4 space-y-4" aria-busy="true">
      <div className="mx-auto h-8 w-40 rounded-xl bg-white animate-pulse" />
      <div className="mx-auto h-12 w-56 rounded-xl bg-white animate-pulse" />
      <div className="grid grid-cols-2 gap-3"><div className="h-14 rounded-full bg-white animate-pulse" /><div className="h-14 rounded-full bg-white animate-pulse" /></div>
      <div className="h-40 rounded-3xl bg-white animate-pulse" />
    </div>
  )
}
