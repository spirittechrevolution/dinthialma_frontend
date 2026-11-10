import { useState } from 'react'
import { clsx } from 'clsx'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { QueryError } from '@/components/shared/QueryError'
import { useRecapCycle, useRecapTotal } from '@/hooks/useCotisations'
import { Cycle } from '@/types/cycle'
import { CycleRecapLigne, MembreTotalCotisation } from '@/types/cotisation'
import { CycleStatut } from '@/types/common'
import { formatFCFA, formatDateCourte } from '@/lib/format'

const PAGE_SIZE = 20

interface RecapCotisationsPanelProps {
  tontineId: string
  cycles: Cycle[]
  /** Libellé « Cycle » ou « Période » (tontine événementielle) */
  cycleLabel?: string
}

const membreCell = (r: { firstName: string; lastName: string; phone: string; ordreJackpot: number | null }) => (
  <div className="flex items-center gap-3 min-w-0">
    {r.ordreJackpot != null && (
      <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
        {r.ordreJackpot}
      </span>
    )}
    <div className="min-w-0">
      <p className="font-semibold text-neutral-900 truncate">{r.firstName} {r.lastName}</p>
      <p className="text-xs text-neutral-500 truncate">{r.phone}</p>
    </div>
  </div>
)

/**
 * Récapitulatif des cotisations (créateur + SUPER_ADMIN) :
 * - « Par cycle »    → GET /v1/tontines/{id}/cotisations/recap/{cycleId}
 * - « Total membre » → GET /v1/tontines/{id}/cotisations/recap-total
 * Les deux sont paginés côté serveur. Aucun total général n'est calculé ici :
 * il ne porterait que sur la page affichée.
 */
export function RecapCotisationsPanel({ tontineId, cycles, cycleLabel = 'Cycle' }: RecapCotisationsPanelProps) {
  const [vue, setVue] = useState<'cycle' | 'total'>('cycle')

  // Cycle par défaut : celui en cours, sinon le plus récent
  const defaultCycle =
    cycles.find((c) => c.statut === CycleStatut.EN_COURS) ??
    [...cycles].sort((a, b) => b.numeroCycle - a.numeroCycle)[0]
  const [cycleId, setCycleId] = useState<string>('')
  const activeCycleId = cycleId || defaultCycle?.id || ''

  const [pageCycle, setPageCycle] = useState(0)
  const [pageTotal, setPageTotal] = useState(0)

  const recapCycle = useRecapCycle(tontineId, activeCycleId, pageCycle, PAGE_SIZE, vue === 'cycle')
  const recapTotal = useRecapTotal(tontineId, pageTotal, PAGE_SIZE, vue === 'total')

  const changeCycle = (id: string) => {
    setCycleId(id)
    setPageCycle(0) // changer de cycle ramène à la première page
  }

  const cycleColumns: Column<CycleRecapLigne & { id: string }>[] = [
    { key: 'membre', header: 'Membre', render: (r) => membreCell(r) },
    {
      key: 'statutCotisation',
      header: 'Statut',
      render: (r) =>
        r.statutCotisation ? (
          <StatusBadge status={r.statutCotisation} />
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">
            Rien soumis
          </span>
        ),
    },
    { key: 'montant', header: 'Montant', render: (r) => (r.montant != null ? <span className="tabular font-medium">{formatFCFA(r.montant)}</span> : '—') },
    { key: 'methodePaiement', header: 'Méthode', render: (r) => r.methodePaiement || '—', hideOnMobile: true },
    { key: 'dateValidation', header: 'Validée le', render: (r) => (r.dateValidation ? formatDateCourte(r.dateValidation) : '—'), hideOnMobile: true },
  ]

  const totalColumns: Column<MembreTotalCotisation & { id: string }>[] = [
    { key: 'membre', header: 'Membre', render: (r) => membreCell(r) },
    { key: 'totalCotise', header: 'Total cotisé', render: (r) => <span className="tabular font-semibold text-neutral-900">{formatFCFA(r.totalCotise)}</span> },
    { key: 'nombreCotisationsValidees', header: 'Cotisations validées', render: (r) => <span className="tabular">{r.nombreCotisationsValidees}</span> },
    { key: 'statutMembre', header: 'Statut membre', render: (r) => <StatusBadge status={r.statutMembre} />, hideOnMobile: true },
  ]

  const active = vue === 'cycle' ? recapCycle : recapTotal

  return (
    <div>
      {/* Bascule de vue */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="inline-flex p-1 bg-neutral-100 rounded-full self-start">
          {([
            ['cycle', `Par ${cycleLabel.toLowerCase()}`],
            ['total', 'Total par membre'],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className={clsx(
                'h-9 px-4 rounded-full text-sm font-medium transition-colors',
                vue === v ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {vue === 'cycle' && cycles.length > 0 && (
          <div className="sm:ml-auto sm:w-60">
            <Select
              aria-label={`Choisir un ${cycleLabel.toLowerCase()}`}
              value={activeCycleId}
              onChange={(e) => changeCycle(e.target.value)}
              options={[...cycles]
                .sort((a, b) => b.numeroCycle - a.numeroCycle)
                .map((c) => ({
                  value: c.id,
                  label: `${cycleLabel} ${c.numeroCycle}${c.statut === CycleStatut.EN_COURS ? ' (en cours)' : ''}`,
                }))}
            />
          </div>
        )}
      </div>

      {vue === 'cycle' && cycles.length === 0 ? (
        <p className="text-center py-10 text-sm text-neutral-500">Aucun {cycleLabel.toLowerCase()} ouvert pour le moment.</p>
      ) : active.isError ? (
        <QueryError error={active.error} onRetry={() => active.refetch()} />
      ) : (
        <div className={active.isFetching && !active.isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {vue === 'cycle' ? (
            <Table
              columns={cycleColumns}
              data={(recapCycle.data?.content || []).map((r) => ({ ...r, id: r.membreId }))}
              isLoading={recapCycle.isLoading}
              emptyMessage="Aucun membre actif pour ce cycle"
              page={pageCycle}
              totalPages={recapCycle.data?.totalPages}
              totalElements={recapCycle.data?.totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={setPageCycle}
            />
          ) : (
            <Table
              columns={totalColumns}
              data={(recapTotal.data?.content || []).map((r) => ({ ...r, id: r.membreId }))}
              isLoading={recapTotal.isLoading}
              emptyMessage="Aucun membre"
              page={pageTotal}
              totalPages={recapTotal.data?.totalPages}
              totalElements={recapTotal.data?.totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={setPageTotal}
            />
          )}
        </div>
      )}
    </div>
  )
}
