/**
 * A6 — Historique : tous les mouvements, filtrables (remplace « Mes cotisations »).
 * Je cotise : mes paiements et jackpots ; Je gère : paiements reçus dans mes tontines.
 * ?mode=COTISE|GERE  ?tontine=:id
 */
import { Fragment, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronDown, RotateCw, Download, Trophy, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { telechargerCsv } from '@/lib/exportCsv'
import { messageErreur } from '@/lib/apiError'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { ChipRow, FilterChip } from '@/components/ui/ChipRow'
import { ActiviteRow, affichageActivite } from '@/components/home/ActivityFeed'
import { TontinePickerSheet } from '@/components/home/HomeSheets'
import { useActivite, useCotisantSummary, useGestionSummary, useMesRoles } from '@/hooks/useMe'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { formatF, formatDateHeure } from '@/lib/format'
import { CotisationStatut } from '@/types/common'
import { jeCotise, jeGere, type ActiviteItem, type ActiviteType, type ModeAccueil } from '@/types/me'

/**
 * 3 filtres de statut, les mêmes que sur la fiche tontine : tout, ce qui attend une validation,
 * ce qui pose problème (« À régler » membre / « À relancer » gestionnaire = en retard + refusés).
 */
const STATUTS: { id: string; label: string; labelGerant: string; statuts: CotisationStatut[] }[] = [
  { id: 'tous', label: 'Tous', labelGerant: 'Tous', statuts: [] },
  { id: 'attente', label: 'En attente', labelGerant: 'À valider', statuts: [CotisationStatut.EN_ATTENTE] },
  { id: 'probleme', label: 'À régler', labelGerant: 'À relancer', statuts: [CotisationStatut.EN_RETARD, CotisationStatut.REFUSE] },
  // Je cotise uniquement : les jackpots reçus n'ont pas de statut, c'est un filtre de type
  { id: 'jackpots', label: 'Jackpots', labelGerant: 'Jackpots', statuts: [] },
]

/** Types d'activité « jackpot » (filtre Jackpots, et export) */
const TYPES_JACKPOT: ActiviteType[] = ['JACKPOT_RECU', 'DISTRIBUTION_RECUE']

export function HistoriquePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const roles = useMesRoles()
  const [savedMode, setSavedMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', ['COTISE', 'GERE'] as const)
  const demande = params.get('mode') as ModeAccueil | null
  const voulu = demande === 'GERE' || demande === 'COTISE' ? demande : savedMode
  const mode: ModeAccueil = roles.deuxModes ? voulu : roles.gere ? 'GERE' : 'COTISE'
  const tontineId = params.get('tontine') ?? undefined

  const [statut, setStatut] = useState('tous')
  const [limite, setLimite] = useState(60)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exportEnCours, setExportEnCours] = useState(false)

  // Tout est chargé une fois : filtres et compteurs se calculent ici
  const activite = useActivite(mode, { tontineId, limit: 1000 })
  const cotisant = useCotisantSummary(mode === 'COTISE' && roles.cotise)
  const gestion = useGestionSummary(mode === 'GERE' && roles.gere)

  const tontinesDuMode = roles.tontines.filter((t) => (mode === 'GERE' ? jeGere(t) : jeCotise(t)))
  const tontineChoisie = tontinesDuMode.find((t) => t.id === tontineId)

  const chiffres: [string, string][] = useMemo(() => {
    if (mode === 'GERE') {
      const lignes = (gestion.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
      return [
        ['Collecté', formatF(lignes.reduce((s, t) => s + t.montantTotalValide, 0))],
        ['À valider', String(lignes.reduce((s, t) => s + t.cotisationsEnAttente, 0))],
        ['En retard', String(lignes.reduce((s, t) => s + t.cotisationsEnRetard, 0))],
      ]
    }
    const lignes = (cotisant.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
    return [
      ['Cotisé', formatF(lignes.reduce((s, t) => s + t.totalCotiseValide, 0))],
      ['En attente', formatF(lignes.reduce((s, t) => s + t.totalEnAttente, 0))],
      ['Jackpots', formatF(lignes.reduce((s, t) => s + t.totalJackpotsRecus, 0))],
    ]
  }, [mode, tontineId, gestion.data, cotisant.data])

  const filtreStatuts = STATUTS.find((s) => s.id === statut)?.statuts ?? []
  const tout = activite.data ?? []
  const compte = (st: CotisationStatut[]) => tout.filter((it) => !!it.statut && st.includes(it.statut)).length
  const filtresVisibles = STATUTS.filter((s) => s.id !== 'jackpots' || mode === 'COTISE')
  const items = statut === 'jackpots'
    ? tout.filter((it) => TYPES_JACKPOT.includes(it.type))
    : filtreStatuts.length ? tout.filter((it) => !!it.statut && filtreStatuts.includes(it.statut)) : tout
  const visibles = items.slice(0, limite)

  // Regroupement par mois (« novembre 2026 »)
  const groupes: [string, ActiviteItem[]][] = []
  for (const it of visibles) {
    const mois = new Date(it.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier[0] === mois) dernier[1].push(it)
    else groupes.push([mois, [it]])
  }

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const exporter = async () => {
    setExportEnCours(true)
    try {
      await telechargerCsv('/v1/me/activite/export', {
        mode,
        ...(tontineId ? { tontineId } : {}),
        ...(filtreStatuts.length === 1 ? { statut: filtreStatuts[0] } : {}),
        ...(statut === 'jackpots' ? { type: TYPES_JACKPOT } : {}),
      }, 'historique-dinthialma.csv')
    } catch (err) {
      toast.error(messageErreur(err, "L'export a échoué. Réessayez."))
    } finally {
      setExportEnCours(false)
    }
  }
  const ouvrir = (it: ActiviteItem) => navigate(it.cotisationId ? `/recu/${it.tontineId}/${it.cotisationId}` : `/tontine/${it.tontineId}`)


  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader
        title="Historique"
        right={
          <button onClick={exporter} disabled={exportEnCours} className="h-11 px-3 mr-1 rounded-full text-sm font-semibold text-primary-800 hover:bg-primary-50 inline-flex items-center gap-1.5 disabled:opacity-50">
            <Download size={16} /> {exportEnCours ? '…' : 'Exporter'}
          </button>
        }
      />
      <main className="px-4 pb-10 max-w-lg mx-auto md:max-w-3xl lg:max-w-[1200px] lg:px-8 space-y-4">
        {roles.deuxModes && (
          <div role="tablist" aria-label="Mode" className="mx-auto lg:mx-0 flex max-w-[17rem] rounded-full bg-white p-1 shadow-sm">
            {(['COTISE', 'GERE'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m}
                onClick={() => { setSavedMode(m); setParams({ mode: m }, { replace: true }); if (m === 'GERE' && statut === 'jackpots') setStatut('tous') }}
                className={clsx('flex-1 h-9 rounded-full text-sm font-semibold', mode === m ? 'bg-primary-700 text-white' : 'text-neutral-600')}>
                {m === 'GERE' ? 'Gestionnaire' : 'Membre'}
              </button>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2 lg:gap-4">
          {chiffres.map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl shadow-sm px-2 py-3 text-center lg:text-left lg:px-5 lg:py-4">
              <dt className="text-xs text-neutral-500 lg:text-sm">{k}</dt>
              <dd className="mt-1 font-bold tabular-nums text-neutral-900 truncate lg:text-2xl">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2 lg:space-y-0 lg:flex lg:items-center lg:gap-3">
          {tontinesDuMode.length > 1 && (
            <button onClick={() => setPickerOpen(true)} className="h-10 px-4 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
              {tontineChoisie?.nom ?? 'Toutes mes tontines'} <ChevronDown size={16} />
            </button>
          )}
          <ChipRow className="lg:min-w-0">
            {filtresVisibles.map((s) => {
              const n = s.statuts.length ? compte(s.statuts) : 0
              return (
                <FilterChip
                  key={s.id}
                  label={mode === 'GERE' ? s.labelGerant : s.label}
                  actif={statut === s.id}
                  onClick={() => { setStatut(s.id); setLimite(60) }}
                  count={n}
                  alerte={s.id === 'probleme' && n > 0}
                />
              )
            })}
          </ChipRow>
        </div>

        {activite.isLoading || roles.isLoading ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : activite.isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger l'historique.</p>
            <button onClick={() => activite.refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          </section>
        ) : groupes.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            {statut === 'probleme'
              ? (mode === 'GERE' ? 'Aucun paiement à relancer' : 'Rien à régler, tout est en ordre')
              : statut === 'jackpots'
                ? 'Aucun jackpot reçu pour le moment'
                : statut === 'attente'
                ? (mode === 'GERE' ? 'Aucun paiement à valider' : 'Aucun paiement en attente')
                : 'Aucun mouvement'}
          </p>
        ) : (
          <>
            {/* Desktop : tableau, mois en lignes de séparation */}
            <TableauHistorique mode={mode} groupes={groupes} multiTontines={!tontineId && tontinesDuMode.length > 1} onOpen={ouvrir} />

            {/* Mobile : liste groupée par mois */}
            {groupes.map(([mois, liste]) => (
              <section key={mois} className="lg:hidden">
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500 first-letter:uppercase">{mois}</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
                  {liste.map((it) => <ActiviteRow key={it.id} mode={mode} it={it} onOpen={ouvrir} />)}
                </ul>
              </section>
            ))}
            {items.length > limite && (
              <button onClick={() => setLimite((l) => l + 60)} className="w-full h-12 rounded-full bg-white shadow-sm text-sm font-semibold text-primary-800">Voir plus</button>
            )}
          </>
        )}
      </main>

      <TontinePickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir une tontine"
        options={tontinesDuMode.map((t) => ({ id: t.id, nom: t.nom }))}
        allowAll
        selectedId={tontineId ?? null}
        onSelect={(id) => setParam('tontine', id)}
      />
    </div>
  )
}

/** Desktop : historique en tableau ; une ligne de séparation par mois, clic sur une ligne = détail */
function TableauHistorique({ mode, groupes, multiTontines, onOpen }: {
  mode: ModeAccueil
  groupes: [string, ActiviteItem[]][]
  multiTontines: boolean
  onOpen: (it: ActiviteItem) => void
}) {
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'
  const nbCols = 5 + (mode === 'GERE' ? 1 : 0) + (multiTontines ? 1 : 0)
  return (
    <section className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Mouvement</th>
            {mode === 'GERE' && <th className={th}>Membre</th>}
            {multiTontines && <th className={th}>Tontine</th>}
            <th className={th}>Tour</th>
            <th className={`${th} text-right`}>Montant</th>
            <th className={th}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {groupes.map(([mois, liste]) => (
            <Fragment key={mois}>
              <tr className="bg-neutral-50/60 border-t border-neutral-100">
                <th colSpan={nbCols} scope="colgroup" className="px-4 py-2 text-left text-xs font-semibold text-neutral-500 first-letter:uppercase">
                  {mois}
                </th>
              </tr>
              {liste.map((it) => {
                const { st, gain, libelle } = affichageActivite(it)
                return (
                  <tr
                    key={it.id}
                    onClick={() => onOpen(it)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(it) } }}
                    tabIndex={0}
                    role="link"
                    aria-label={`${libelle}, ${it.tontineNom}, ${formatF(it.montant)}`}
                    className="border-t border-neutral-100 cursor-pointer hover:bg-neutral-50 focus-visible:outline-none focus-visible:bg-primary-50"
                  >
                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{formatDateHeure(it.date)}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', gain ? 'bg-yellow-50 text-yellow-700' : 'bg-neutral-100 text-neutral-600')}>
                          {gain ? <Trophy size={15} /> : <ArrowUpRight size={15} />}
                        </span>
                        <span className="font-medium text-neutral-900">{libelle}</span>
                      </span>
                    </td>
                    {mode === 'GERE' && <td className="px-4 py-3 text-neutral-800">{it.membreNom ?? '—'}</td>}
                    {multiTontines && <td className="px-4 py-3 text-neutral-600">{it.tontineNom}</td>}
                    <td className="px-4 py-3 text-neutral-600 tabular-nums">{it.numeroCycle ?? '—'}</td>
                    <td className={clsx('px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap', gain ? 'text-primary-700' : 'text-neutral-900')}>
                      {gain ? '+' : ''}{formatF(it.montant)}
                    </td>
                    <td className="px-4 py-3">
                      {st.label && (
                        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', st.cls)}>
                          {st.icon} {st.label}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  )
}
