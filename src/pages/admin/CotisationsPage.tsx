import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ChipRow } from '@/components/ui/ChipRow'
import { InitialsAvatar } from '@/components/ui/Section'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AdminEditCotisationModal, EditCotisationInitialValues } from '@/components/shared/AdminEditCotisationModal'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
import { CotisationsRecapTotal } from '@/components/shared/CotisationsRecapTotal'
import { useTontines } from '@/hooks/useTontines'
import { useMyDashboard } from '@/hooks/useDashboard'
import { useCycles } from '@/hooks/useCycles'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { useMembres } from '@/hooks/useMembres'
import { Cotisation, EnregistreParInfo } from '@/types/cotisation'
import { Cycle } from '@/types/cycle'
import { CotisationStatut, CycleStatut } from '@/types/common'
import { formatMontant, formatFCFA, formatDateCourte } from '@/lib/format'
import { Search, CheckCircle, Edit2, PlusCircle, LayoutList, Users2, X } from 'lucide-react'

interface EditCotisationState {
  isOpen: boolean
  cotisationId: string
  membreNom: string
  initialValues: EditCotisationInitialValues
}

const PAGE_SIZE = 20

const STATUT_TABS = [
  { label: 'Toutes', value: '' },
  { label: 'En attente', value: CotisationStatut.EN_ATTENTE },
  { label: 'Validées', value: CotisationStatut.VALIDE },
  { label: 'En retard', value: CotisationStatut.EN_RETARD },
]

const STATUT_BADGE: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  VALIDE: 'success',
  EN_ATTENTE: 'warning',
  EN_RETARD: 'error',
}

const STATUT_LABEL: Record<string, string> = {
  VALIDE: 'Validée',
  EN_ATTENTE: 'En attente',
  EN_RETARD: 'En retard',
}

const METHODE_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  MTN_MOMO: 'MTN MoMo',
}

const chip = (active: boolean) =>
  `h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
    active ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
  }`

export function CotisationsPage() {
  const location = useLocation()
  // Arrivée depuis « Voir les cotisations » (page Cycles) : tontine + cycle présélectionnés
  const navState = location.state as { tontineId?: string; cycleId?: string } | null

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statutTab, setStatutTab] = useState('')
  const [selectedTontineId, setSelectedTontineId] = useState(navState?.tontineId || '')
  /** undefined = cycle en cours par défaut ; '' = tous les cycles ; sinon id du cycle */
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(navState?.cycleId)
  const [selectedMembreId, setSelectedMembreId] = useState<string | undefined>(undefined)
  const [cotisationToValidate, setCotisationToValidate] = useState<string | null>(null)
  const [editCotisationState, setEditCotisationState] = useState<EditCotisationState>({
    isOpen: false,
    cotisationId: '',
    membreNom: '',
    initialValues: { montant: 0, methodePaiement: 'CASH' },
  })
  const [cotisationView, setCotisationView] = useState<'par-cycle' | 'vue-ensemble'>('par-cycle')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [paiementModal, setPaiementModal] = useState<{ isOpen: boolean; membreId: string; membreNom: string }>({
    isOpen: false, membreId: '', membreNom: '',
  })

  const { data: tontinesData } = useTontines(0, 50)
  const tontines = tontinesData?.content || []
  const activeTontineId = selectedTontineId || tontines[0]?.id || ''
  const activeTontine = tontines.find((t) => t.id === activeTontineId)

  const { data: cyclesData } = useCycles(activeTontineId, 0, 100)
  const { data: membresData } = useMembres(activeTontineId, 0, 100)
  const cycles = cyclesData?.content || []
  const membres = membresData?.content || []
  const cycleEnCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)
  // Cycle sur lequel enregistrer un paiement admin : en cours, sinon le prochain ouvert
  const paiementCycleId = cycleEnCours?.id || cycles.find((c) => c.statut === CycleStatut.EN_ATTENTE)?.id || ''

  const baseCycleFilter = selectedCycleId !== undefined ? (selectedCycleId || undefined) : cycleEnCours?.id
  // Fiche membre : toutes ses cotisations, tous cycles confondus
  const effectiveCycleFilter = selectedMembreId ? undefined : baseCycleFilter
  const activeCycleId = selectedCycleId !== undefined ? selectedCycleId : cycleEnCours?.id ?? ''

  const { data: cotisationsData, isLoading } = useCotisations(
    activeTontineId,
    effectiveCycleFilter,
    selectedMembreId ? 0 : page,
    // Un seul membre : on charge tout (quelques lignes) pour calculer sa fiche
    selectedMembreId ? 200 : PAGE_SIZE,
    selectedMembreId
  )
  const { mutate: valider, isPending: isValidating } = useValiderCotisation()

  // Statistiques par tontine calculées côté backend (fiables quel que soit le volume)
  const { data: dashboard } = useMyDashboard(0, 50)
  const activeTontineStats = dashboard?.tontines.content.find((t) => t.tontineId === activeTontineId)

  const allCotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1

  const filtered = allCotisations.filter((c: Cotisation) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${c.membre.firstName} ${c.membre.lastName}`.toLowerCase().includes(q) ||
      (c.referenceTransaction || '').toLowerCase().includes(q)
    const matchStatut = !statutTab || c.statut === statutTab
    return matchSearch && matchStatut
  })

  // ─── Changements de filtre : toujours revenir à la page 1 ─────────────────
  const changeTontine = (id: string) => {
    setSelectedTontineId(id); setSelectedCycleId(undefined); setSelectedMembreId(undefined); setPage(0); setSearch('')
  }
  const changeCycle = (id: string) => { setSelectedCycleId(id); setPage(0) }
  const changeMembre = (id: string | undefined) => { setSelectedMembreId(id); setPage(0) }

  const canEdit = (c: Cotisation) => {
    const cycleOfCotisation = cycles.find((cy) => cy.id === c.cycleId)
    return c.statut === CotisationStatut.EN_ATTENTE ||
      (c.statut === CotisationStatut.VALIDE && cycleOfCotisation?.statut === CycleStatut.EN_COURS)
  }

  const openEdit = (c: Cotisation) => setEditCotisationState({
    isOpen: true,
    cotisationId: c.id,
    membreNom: `${c.membre.firstName} ${c.membre.lastName}`,
    initialValues: {
      montant: c.montant,
      methodePaiement: c.methodePaiement,
      referenceTransaction: c.referenceTransaction,
      note: c.note,
    },
  })

  const handleValider = () => {
    if (!cotisationToValidate || !activeTontineId) return
    valider(
      { tontineId: activeTontineId, cotisationId: cotisationToValidate },
      {
        onSuccess: () => { toast.success('Cotisation validée'); setCotisationToValidate(null) },
        onError: () => toast.error('Erreur lors de la validation'),
      }
    )
  }

  const cyclesTries = [...cycles].sort((a: Cycle, b: Cycle) => b.numeroCycle - a.numeroCycle)
  const membreInfo = membres.find((m) => m.id === selectedMembreId)

  return (
    <AppLayout>
      <PageHeader
        title="Cotisations"
        description={activeTontine ? activeTontine.nom : 'Validez les paiements reçus.'}
        action={
          <Button onClick={() => setPickerOpen(true)} disabled={!paiementCycleId || membres.length === 0}>
            <PlusCircle size={18} /> <span className="hidden sm:inline">Enregistrer un paiement</span><span className="sm:hidden">Paiement</span>
          </Button>
        }
      />

      {/* Choix de la tontine */}
      {tontines.length > 1 && (
        <ChipRow className="mb-3">
          {tontines.map((t) => (
            <button key={t.id} aria-pressed={activeTontineId === t.id} onClick={() => changeTontine(t.id)} className={chip(activeTontineId === t.id)}>
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      {/* Statistiques de la tontine (backend) */}
      {activeTontineStats && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-neutral-100 p-3 sm:p-4">
            <p className="text-[11px] sm:text-xs text-neutral-500 mb-1">Total validé</p>
            <p className="text-base sm:text-xl font-bold text-primary-700 tabular truncate">{formatMontant(activeTontineStats.montantTotalValide)} F</p>
          </div>
          <button
            onClick={() => setStatutTab(CotisationStatut.EN_ATTENTE)}
            className="bg-white rounded-2xl border border-neutral-100 p-3 sm:p-4 text-left hover:border-amber-200 transition-colors"
          >
            <p className="text-[11px] sm:text-xs text-neutral-500 mb-1">À valider</p>
            <p className="text-base sm:text-xl font-bold text-amber-600 tabular">{activeTontineStats.cotisationsEnAttente}</p>
          </button>
          <button
            onClick={() => setStatutTab(CotisationStatut.EN_RETARD)}
            className="bg-white rounded-2xl border border-neutral-100 p-3 sm:p-4 text-left hover:border-red-200 transition-colors"
          >
            <p className="text-[11px] sm:text-xs text-neutral-500 mb-1">En retard</p>
            <p className="text-base sm:text-xl font-bold text-red-600 tabular">{activeTontineStats.cotisationsEnRetard}</p>
          </button>
        </div>
      )}

      {/* Bascule Par cycle / Vue d'ensemble */}
      <div className="inline-flex p-1 bg-neutral-100 rounded-full mb-3">
        {([
          ['par-cycle', 'Par cycle', <LayoutList key="l" size={15} />],
          ['vue-ensemble', "Vue d'ensemble", <Users2 key="u" size={15} />],
        ] as const).map(([v, label, icon]) => (
          <button
            key={v}
            onClick={() => setCotisationView(v)}
            className={`h-9 px-4 rounded-full text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
              cotisationView === v ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {cotisationView === 'vue-ensemble' ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-5">
          <CotisationsRecapTotal tontineId={activeTontineId} />
        </div>
      ) : (
        <>
          {/* Choix du cycle (cycle en cours par défaut) */}
          {cycles.length > 0 && !selectedMembreId && (
            <ChipRow className="mb-3">
              <button aria-pressed={activeCycleId === ''} onClick={() => changeCycle('')} className={chip(activeCycleId === '')}>
                Tous les cycles
              </button>
              {cyclesTries.map((c) => (
                <button key={c.id} aria-pressed={activeCycleId === c.id} onClick={() => changeCycle(c.id)} className={chip(activeCycleId === c.id)}>
                  Cycle {c.numeroCycle}
                  {c.statut === CycleStatut.EN_COURS && (
                    <span className={`ml-1.5 inline-block w-2 h-2 rounded-full ${activeCycleId === c.id ? 'bg-lime-300' : 'bg-primary-500'}`} title="En cours" />
                  )}
                </button>
              ))}
            </ChipRow>
          )}

          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            {/* Membre + recherche + statut */}
            <div className="px-4 sm:px-5 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {membres.length > 0 && (
                  <div className="sm:w-72">
                    <Select
                      aria-label="Filtrer par membre"
                      value={selectedMembreId || ''}
                      onChange={(e) => changeMembre(e.target.value || undefined)}
                      options={[{ value: '', label: 'Tous les membres' }, ...membres.map((m) => ({ value: m.id, label: `${m.user.firstName} ${m.user.lastName}` }))]}
                    />
                  </div>
                )}
                <div className="relative flex-1 sm:max-w-sm">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Membre ou référence…"
                    className="w-full h-12 pl-11 pr-4 text-[15px] border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>
              <ChipRow bleed={false}>
                {STATUT_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    aria-pressed={statutTab === tab.value}
                    onClick={() => setStatutTab(tab.value)}
                    className={`h-9 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      statutTab === tab.value ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </ChipRow>
            </div>

            {/* Fiche du membre sélectionné */}
            {selectedMembreId && (() => {
              const cots = allCotisations
              const valides = cots.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE)
              const totalValide = valides.reduce((s: number, c: Cotisation) => s + c.montant, 0)
              const nbEnAttente = cots.filter((c: Cotisation) => c.statut === CotisationStatut.EN_ATTENTE).length
              const nbEnRetard = cots.filter((c: Cotisation) => c.statut === CotisationStatut.EN_RETARD).length
              const nom = membreInfo ? `${membreInfo.user.firstName} ${membreInfo.user.lastName}` : '—'
              return (
                <div className="mx-4 sm:mx-5 mt-4 bg-primary-50 border border-primary-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <InitialsAvatar name={nom} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-primary-900 truncate">{nom}</p>
                        <p className="text-xs text-primary-700/80">Toutes ses cotisations sur cette tontine</p>
                      </div>
                    </div>
                    <button onClick={() => changeMembre(undefined)} className="w-9 h-9 rounded-full flex items-center justify-center text-primary-700 hover:bg-primary-100" aria-label="Voir tous les membres">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Validées', value: valides.length, cls: 'text-primary-700' },
                      { label: 'En attente', value: nbEnAttente, cls: 'text-amber-600' },
                      { label: 'En retard', value: nbEnRetard, cls: 'text-red-600' },
                    ].map((x) => (
                      <div key={x.label} className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-[11px] text-neutral-500 mb-0.5">{x.label}</p>
                        <p className={`font-bold tabular ${x.cls}`}>{x.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-primary-100">
                    <p className="text-xs text-primary-700">Total versé (validé)</p>
                    <p className="text-sm font-extrabold text-primary-800 tabular">{formatFCFA(totalValide)}</p>
                  </div>
                  <Button
                    className="w-full mt-3"
                    disabled={!paiementCycleId || !membreInfo}
                    onClick={() => membreInfo && setPaiementModal({ isOpen: true, membreId: membreInfo.id, membreNom: nom })}
                  >
                    <PlusCircle size={18} /> Enregistrer son paiement
                  </Button>
                </div>
              )
            })()}

            {/* Cartes — mobile */}
            <div className="md:hidden divide-y divide-neutral-100 mt-3">
              {isLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-10 text-neutral-500 text-sm">Aucune cotisation</p>
              ) : (
                filtered.map((c: Cotisation) => {
                  const nom = `${c.membre.firstName} ${c.membre.lastName}`
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                      <InitialsAvatar name={nom} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-neutral-900 truncate">{nom}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}
                          {c.referenceTransaction ? ` · ${c.referenceTransaction}` : ''}
                        </p>
                        <div className="mt-1"><Badge variant={STATUT_BADGE[c.statut] || 'default'}>{STATUT_LABEL[c.statut] || c.statut}</Badge></div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p className="font-bold text-sm text-neutral-900 tabular">{formatMontant(c.montant)} F</p>
                        <div className="flex gap-1.5">
                          {canEdit(c) && (
                            <button
                              onClick={() => openEdit(c)}
                              className="h-8 w-8 rounded-full bg-neutral-100 text-neutral-700 inline-flex items-center justify-center active:scale-95 transition"
                              aria-label={`Modifier la cotisation de ${nom}`}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {c.statut === CotisationStatut.EN_ATTENTE && (
                            <button
                              onClick={() => setCotisationToValidate(c.id)}
                              className="h-8 px-3 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center gap-1 active:scale-95 transition"
                            >
                              <CheckCircle size={14} /> Valider
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Tableau — desktop */}
            <div className="hidden md:block overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/70">
                    {['Membre', 'Montant', 'Méthode', 'Référence', 'Validée le', 'Statut', 'Saisie par', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center py-10"><Spinner /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-neutral-500">Aucune cotisation trouvée</td></tr>
                  ) : (
                    filtered.map((c: Cotisation) => {
                      const ep: EnregistreParInfo | undefined = c.enregistrePar
                      const isAutoDeclare = ep && ep.id === c.membre.userId
                      return (
                        <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-neutral-900">{c.membre.firstName} {c.membre.lastName}</td>
                          <td className="px-5 py-3.5 font-semibold text-neutral-900 tabular whitespace-nowrap">{formatFCFA(c.montant)}</td>
                          <td className="px-5 py-3.5 text-neutral-600">{METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}</td>
                          <td className="px-5 py-3.5 text-neutral-500 text-xs font-mono">{c.referenceTransaction || '—'}</td>
                          <td className="px-5 py-3.5 text-neutral-500 text-xs">{c.dateValidation ? formatDateCourte(c.dateValidation) : '—'}</td>
                          <td className="px-5 py-3.5"><Badge variant={STATUT_BADGE[c.statut] || 'default'}>{STATUT_LABEL[c.statut] || c.statut}</Badge></td>
                          <td className="px-5 py-3.5">
                            {!ep ? <span className="text-neutral-300 text-xs">—</span>
                              : isAutoDeclare
                                ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">Auto-déclaré</span>
                                : <span title={`${ep.firstName} ${ep.lastName}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 cursor-help">Saisie admin</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2 justify-end">
                              {canEdit(c) && (
                                <button onClick={() => openEdit(c)} className="h-8 px-3 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold inline-flex items-center gap-1 hover:bg-neutral-200">
                                  <Edit2 size={14} /> Modifier
                                </button>
                              )}
                              {c.statut === CotisationStatut.EN_ATTENTE && (
                                <button onClick={() => setCotisationToValidate(c.id)} className="h-8 px-3 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-primary-700">
                                  <CheckCircle size={14} /> Valider
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!selectedMembreId && totalPages > 1 && (
              <div className="border-t border-neutral-100">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalElements={cotisationsData?.totalElements}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal : choix du membre pour enregistrer un paiement */}
      <Modal
        isOpen={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerSearch('') }}
        title="Choisir un membre"
        size="sm"
      >
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Rechercher un membre…"
            autoFocus
            className="w-full h-12 pl-11 pr-4 text-[15px] border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>
        <div className="max-h-72 overflow-y-auto -mx-1">
          {(() => {
            const list = membres.filter((m) =>
              `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(pickerSearch.toLowerCase())
            )
            if (list.length === 0) return <p className="py-6 text-center text-sm text-neutral-500">Aucun membre trouvé</p>
            return list.map((m) => {
              const nom = `${m.user.firstName} ${m.user.lastName}`
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setPaiementModal({ isOpen: true, membreId: m.id, membreNom: nom })
                    setPickerOpen(false)
                    setPickerSearch('')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-primary-50 active:bg-primary-100 text-left transition-colors"
                >
                  <InitialsAvatar name={nom} size={36} />
                  <span className="text-sm font-semibold text-neutral-900">{nom}</span>
                </button>
              )
            })
          })()}
        </div>
      </Modal>

      {/* Modal : enregistrer un paiement (admin) */}
      <AdminEnregistrerPaiementModal
        isOpen={paiementModal.isOpen}
        onClose={() => setPaiementModal((s) => ({ ...s, isOpen: false }))}
        tontineId={activeTontineId}
        cycleId={paiementCycleId}
        membreId={paiementModal.membreId}
        membreNom={paiementModal.membreNom}
        montantDefaut={activeTontine?.montant}
      />

      <ConfirmDialog
        isOpen={!!cotisationToValidate}
        onClose={() => setCotisationToValidate(null)}
        onConfirm={handleValider}
        title="Valider ce paiement ?"
        message="Cette cotisation sera marquée comme VALIDÉE et prise en compte dans le jackpot à la clôture du cycle."
        confirmText="Valider"
        isLoading={isValidating}
      />

      <AdminEditCotisationModal
        isOpen={editCotisationState.isOpen}
        onClose={() => setEditCotisationState((s) => ({ ...s, isOpen: false }))}
        tontineId={activeTontineId}
        cotisationId={editCotisationState.cotisationId}
        membreNom={editCotisationState.membreNom}
        initialValues={editCotisationState.initialValues}
      />
    </AppLayout>
  )
}
