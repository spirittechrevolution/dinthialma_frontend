import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { AdminEditCotisationModal, EditCotisationInitialValues } from '@/components/shared/AdminEditCotisationModal'
import { useTontines } from '@/hooks/useTontines'
import { useMyDashboard } from '@/hooks/useDashboard'
import { useCycles } from '@/hooks/useCycles'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { Cotisation, EnregistreParInfo } from '@/types/cotisation'
import { CotisationStatut, CycleStatut } from '@/types/common'
import { Search, Download, CheckCircle, XCircle, Edit2 } from 'lucide-react'

interface EditCotisationState {
  isOpen: boolean
  cotisationId: string
  membreNom: string
  initialValues: EditCotisationInitialValues
}

const STATUT_TABS = [
  { label: 'Toutes', value: '' },
  { label: 'En attente', value: CotisationStatut.EN_ATTENTE },
  { label: 'Validée', value: CotisationStatut.VALIDE },
  { label: 'Retard', value: CotisationStatut.EN_RETARD },
]

const STATUT_BADGE: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  VALIDE: 'success',
  EN_ATTENTE: 'warning',
  EN_RETARD: 'error',
  REFUSE: 'default',
}

const STATUT_LABEL: Record<string, string> = {
  VALIDE: 'Validée',
  EN_ATTENTE: 'En Attente',
  EN_RETARD: 'Retard',
  REFUSE: 'Refusée',
}

const METHODE_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  MTN_MOMO: 'Mtn Momo',
}

export function CotisationsPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statutTab, setStatutTab] = useState('')
  const [selectedTontineId, setSelectedTontineId] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined)
  const [cotisationToValidate, setCotisationToValidate] = useState<string | null>(null)
  const [editCotisationState, setEditCotisationState] = useState<EditCotisationState>({
    isOpen: false,
    cotisationId: '',
    membreNom: '',
    initialValues: { montant: 0, methodePaiement: 'CASH' },
  })

  const { data: tontinesData } = useTontines(0, 50)
  const tontines = tontinesData?.content || []
  const activeTontineId = selectedTontineId || tontines[0]?.id || ''

  const { data: cotisationsData, isLoading } = useCotisations(activeTontineId, selectedCycleId, page, 50)
  const { data: cyclesData } = useCycles(activeTontineId, 0, 50)
  const cycles = cyclesData?.content || []
  const { data: dashboard } = useMyDashboard()
  const { mutate: valider, isPending: isValidating } = useValiderCotisation()

  const allCotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1

  // Stats précalculées côté backend — fiables quel que soit le nombre de cotisations
  const activeTontineStats = dashboard?.tontines.find((t) => t.tontineId === activeTontineId)
  const montantValide  = activeTontineStats?.montantTotalValide  ?? 0
  const enAttenteCount = activeTontineStats?.cotisationsEnAttente ?? 0
  const enRetardCount  = activeTontineStats?.cotisationsEnRetard  ?? 0

  const filtered = allCotisations.filter((c: Cotisation) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${c.membre.firstName} ${c.membre.lastName}`.toLowerCase().includes(q) ||
      (c.referenceTransaction || '').toLowerCase().includes(q)
    const matchStatut = !statutTab || c.statut === statutTab
    return matchSearch && matchStatut
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

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cotisations</h1>
          <p className="text-sm text-neutral-500 mt-1">Validez les paiements reçus.</p>
        </div>
        <button className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm">
          <Download size={15} /> Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <p className="text-xs text-neutral-500 mb-1">Total validé</p>
          <p className="text-xl font-bold text-primary-600">{montantValide.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <p className="text-xs text-neutral-500 mb-1">À valider</p>
          <p className="text-xl font-bold text-neutral-900">{enAttenteCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <p className="text-xs text-neutral-500 mb-1">En retard</p>
          <p className="text-xl font-bold text-neutral-900">{enRetardCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-4">
          <p className="text-xs text-neutral-500 mb-1">Refusées</p>
          <p className="text-xl font-bold text-neutral-900">0</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-5 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre ou une référence..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatutTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  statutTab === tab.value
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter tontine */}
        {tontines.length > 1 && (
          <>
            {/* Mobile — select */}
            <div className="sm:hidden px-5 pt-3 pb-1">
              <select
                value={selectedTontineId}
                onChange={(e) => setSelectedTontineId(e.target.value)}
                className="w-full text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                {tontines.map((t) => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>
            {/* Desktop — buttons */}
            <div className="hidden sm:flex px-5 pt-3 items-center gap-1 overflow-x-auto pb-1">
              {tontines.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTontineId(t.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTontineId === t.id
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {t.nom}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Filtre par cycle */}
        {cycles.length > 0 && (
          <div className="px-5 pt-3 pb-1 flex items-center gap-2 flex-wrap border-t border-neutral-50">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Cycle</span>
            <button
              onClick={() => { setSelectedCycleId(undefined); setPage(0) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${!selectedCycleId ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              Tous
            </button>
            {cycles.map((cy) => (
              <button
                key={cy.id}
                onClick={() => { setSelectedCycleId(cy.id); setPage(0) }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedCycleId === cy.id ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                Cycle {cy.numeroCycle}
              </button>
            ))}
          </div>
        )}

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-neutral-50 mt-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
          ) : (
            filtered.map((c: Cotisation) => {
              const tontine = tontines.find((t) => t.id === activeTontineId)
              return (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-neutral-900">{c.membre.firstName} {c.membre.lastName}</p>
                    <Badge variant={STATUT_BADGE[c.statut] || 'default'}>{STATUT_LABEL[c.statut] || c.statut}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-400">
                      {tontine?.nom} · {METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-neutral-900">{c.montant.toLocaleString('fr-FR')} FCFA</p>
                      {c.statut === CotisationStatut.EN_ATTENTE && (
                        <button onClick={() => setCotisationToValidate(c.id)}
                          className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100"
                          title="Valider">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {(() => {
                        const cycleOfCotisation = cycles.find((cy) => cy.id === c.cycleId)
                        const cycleIsEnCours = cycleOfCotisation?.statut === CycleStatut.EN_COURS
                        const showEdit =
                          c.statut === CotisationStatut.EN_ATTENTE ||
                          (c.statut === CotisationStatut.VALIDE && cycleIsEnCours)
                        return showEdit ? (
                          <button
                            onClick={() => setEditCotisationState({
                              isOpen: true,
                              cotisationId: c.id,
                              membreNom: `${c.membre.firstName} ${c.membre.lastName}`,
                              initialValues: {
                                montant: c.montant,
                                methodePaiement: c.methodePaiement,
                                referenceTransaction: c.referenceTransaction,
                                note: c.note,
                              },
                            })}
                            className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                        ) : null
                      })()}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Membre', 'Tontine', 'Montant', 'Méthode', 'Référence', 'Validé le', 'Statut', 'Saisie par', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-10"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-neutral-400">Aucune cotisation trouvée</td></tr>
              ) : (
                filtered.map((c: Cotisation) => {
                  const tontine = tontines.find((t) => t.id === activeTontineId)
                  const ep: EnregistreParInfo | undefined = c.enregistrePar
                  const isAutoDeclaré = ep && ep.id === c.membre.userId
                  return (
                    <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-neutral-900">{c.membre.firstName} {c.membre.lastName}</td>
                      <td className="px-5 py-4 text-neutral-600">{tontine?.nom || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-neutral-900">{c.montant.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-neutral-600">{METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs font-mono">{c.referenceTransaction || '—'}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs">{c.dateValidation ? new Date(c.dateValidation).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-5 py-4"><Badge variant={STATUT_BADGE[c.statut] || 'default'}>{STATUT_LABEL[c.statut] || c.statut}</Badge></td>
                      <td className="px-5 py-4">
                        {!ep ? <span className="text-neutral-300 text-xs">—</span>
                          : isAutoDeclaré
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">Auto-déclaré</span>
                            : <span title={`${ep.firstName} ${ep.lastName}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 cursor-help">Saisie admin</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const cycleOfCotisation = cycles.find((cy) => cy.id === c.cycleId)
                          const cycleIsEnCours = cycleOfCotisation?.statut === CycleStatut.EN_COURS
                          const showEdit =
                            c.statut === CotisationStatut.EN_ATTENTE ||
                            (c.statut === CotisationStatut.VALIDE && cycleIsEnCours)
                          return (
                            <div className="flex gap-2">
                              {c.statut === CotisationStatut.EN_ATTENTE && (
                                <>
                                  <button onClick={() => setCotisationToValidate(c.id)} className="w-7 h-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100" title="Valider"><CheckCircle size={14} /></button>
                                  <button className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100" title="Refuser"><XCircle size={14} /></button>
                                </>
                              )}
                              {showEdit && (
                                <button
                                  onClick={() => setEditCotisationState({
                                    isOpen: true,
                                    cotisationId: c.id,
                                    membreNom: `${c.membre.firstName} ${c.membre.lastName}`,
                                    initialValues: {
                                      montant: c.montant,
                                      methodePaiement: c.methodePaiement,
                                      referenceTransaction: c.referenceTransaction,
                                      note: c.note,
                                    },
                                  })}
                                  className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center hover:bg-neutral-200"
                                  title="Modifier"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-neutral-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

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
