import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { Cotisation, EnregistreParInfo } from '@/types/cotisation'
import { CotisationStatut } from '@/types/common'
import { Search, CheckCircle, Clock } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { formatMontant, formatFCFA } from '@/lib/format'
import { ChipRow } from '@/components/ui/ChipRow'

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
  const [cotisationToValidate, setCotisationToValidate] = useState<string | null>(null)

  const { data: tontinesData } = useTontines(0, 50)
  const tontines = tontinesData?.content || []
  const activeTontineId = selectedTontineId || tontines[0]?.id || ''
  const activeTontine = tontines.find((t) => t.id === activeTontineId)

  const { data: cotisationsData, isLoading } = useCotisations(activeTontineId, undefined, page, 50)
  const { mutate: valider, isPending: isValidating } = useValiderCotisation()

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

  // Rappel limité à la page affichée (aucun total global calculé côté front)
  const enAttenteSurPage = allCotisations.filter((c: Cotisation) => c.statut === CotisationStatut.EN_ATTENTE).length

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
      <PageHeader
        title="Cotisations"
        description={activeTontine ? `${activeTontine.nom} · ${cotisationsData?.totalElements ?? 0} paiement${(cotisationsData?.totalElements ?? 0) > 1 ? 's' : ''}` : 'Validez les paiements reçus.'}
      />

      {/* Choix de la tontine */}
      {tontines.length > 1 && (
        <ChipRow className="mb-3">
          {tontines.map((t) => (
            <button
              aria-pressed={activeTontineId === t.id}
              key={t.id}
              onClick={() => { setSelectedTontineId(t.id); setPage(0); setSearch('') }}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTontineId === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      {/* Rappel à valider */}
      {enAttenteSurPage > 0 && statutTab !== CotisationStatut.EN_ATTENTE && (
        <button
          onClick={() => setStatutTab(CotisationStatut.EN_ATTENTE)}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-3 text-left active:scale-[0.99] transition"
        >
          <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0"><Clock size={17} /></span>
          <span className="flex-1 text-sm font-semibold text-amber-800">
            {enAttenteSurPage} paiement{enAttenteSurPage > 1 ? 's' : ''} à valider sur cette page
          </span>
          <span className="text-sm font-semibold text-amber-700">Voir</span>
        </button>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {/* Recherche + statut */}
        <div className="px-4 sm:px-5 pt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Membre ou référence…"
              className="w-full h-11 pl-11 pr-4 text-[15px] border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
          </div>
          <ChipRow bleed={false}>
            {STATUT_TABS.map((tab) => (
              <button
                aria-pressed={statutTab === tab.value}
                key={tab.value}
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

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-neutral-50 mt-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
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
                      <td className="px-5 py-4 font-semibold text-neutral-900 tabular whitespace-nowrap">{formatFCFA(c.montant)}</td>
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
                        {c.statut === CotisationStatut.EN_ATTENTE && (
                          <div className="flex gap-2">
                            <button onClick={() => setCotisationToValidate(c.id)} className="h-8 px-3 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-primary-700"><CheckCircle size={14} /> Valider</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-neutral-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={cotisationsData?.totalElements}
              pageSize={50}
              onPageChange={setPage}
            />
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
    </AppLayout>
  )
}
