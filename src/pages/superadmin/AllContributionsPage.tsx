import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, Column } from '@/components/ui/Table'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { QueryError } from '@/components/shared/QueryError'
import { useAllContributionsAdmin, useAllTontinesAdmin } from '@/hooks/useDashboard'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut } from '@/types/common'
import { formatFCFA, formatDateHeure } from '@/lib/format'
import { ChipRow } from '@/components/ui/ChipRow'

const PAGE_SIZE = 20

const STATUT_TABS: { label: string; value: CotisationStatut | '' }[] = [
  { label: 'Toutes', value: '' },
  { label: 'En attente', value: CotisationStatut.EN_ATTENTE },
  { label: 'Validées', value: CotisationStatut.VALIDE },
  { label: 'En retard', value: CotisationStatut.EN_RETARD },
]

const METHODE_LABELS: Record<string, string> = {
  ORANGE_MONEY: 'Orange Money',
  WAVE: 'Wave',
  PI_SPI: 'PI-SPI',
  FREE_MONEY: 'Free Money',
  MTN_MOMO: 'MTN MoMo',
  CASH: 'Espèces',
}

/**
 * SUPER_ADMIN — GET /v1/admin/dashboard/contributions
 * Filtres cumulables côté serveur : statut + tontine.
 */
export function AllContributionsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statut, setStatut] = useState<CotisationStatut | ''>('')
  const [tontineId, setTontineId] = useState('')

  const { data, isLoading, isError, error, refetch, isFetching } = useAllContributionsAdmin(page, PAGE_SIZE, { statut, tontineId })
  // Sélecteur de tontine alimenté par GET /v1/admin/dashboard/tontines (200 = max backend)
  const { data: tontinesData } = useAllTontinesAdmin(0, 200)
  const tontines = tontinesData?.content || []
  const tontineNom = (id: string) => tontines.find((t) => t.id === id)?.nom

  const cotisations = data?.content || []

  // Tout changement de filtre ramène à la première page
  const changeStatut = (v: CotisationStatut | '') => { setStatut(v); setPage(0) }
  const changeTontine = (v: string) => { setTontineId(v); setPage(0) }

  const columns: Column<Cotisation>[] = [
    {
      key: 'membre',
      header: 'Membre',
      render: (c) => (
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{c.membre.firstName} {c.membre.lastName}</p>
          <p className="text-xs text-neutral-500 truncate">{c.membre.phone}</p>
        </div>
      ),
    },
    {
      key: 'tontineId',
      header: 'Tontine',
      render: (c) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/tontine/${c.tontineId}`) }}
          className="text-primary-700 font-medium hover:underline truncate max-w-[12rem] text-left"
        >
          {tontineNom(c.tontineId) || 'Voir la tontine'}
        </button>
      ),
    },
    { key: 'montant', header: 'Montant', render: (c) => <span className="tabular font-semibold">{formatFCFA(c.montant)}</span> },
    { key: 'methodePaiement', header: 'Méthode', render: (c) => METHODE_LABELS[c.methodePaiement] || c.methodePaiement || '—' },
    { key: 'createdAt', header: 'Date', render: (c) => formatDateHeure(c.createdAt), hideOnMobile: true },
    { key: 'statut', header: 'Statut', render: (c) => <StatusBadge status={c.statut} /> },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Cotisations"
        description={data ? `${data.totalElements} cotisation${data.totalElements > 1 ? 's' : ''}` : 'Toutes les cotisations de la plateforme'}
      />

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <ChipRow>
          {STATUT_TABS.map((tab) => (
            <button
              aria-pressed={statut === tab.value}
              key={tab.value || 'all'}
              onClick={() => changeStatut(tab.value)}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statut === tab.value ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </ChipRow>
        <div className="sm:ml-auto sm:w-64">
          <Select
            aria-label="Filtrer par tontine"
            value={tontineId}
            onChange={(e) => changeTontine(e.target.value)}
            options={[{ value: '', label: 'Toutes les tontines' }, ...tontines.map((t) => ({ value: t.id, label: t.nom }))]}
          />
        </div>
      </div>

      {isError ? (
        <div className="bg-white rounded-2xl border border-neutral-100">
          <QueryError error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <Table
            columns={columns}
            data={cotisations}
            isLoading={isLoading}
            emptyMessage={statut || tontineId ? 'Aucune cotisation pour ces filtres' : 'Aucune cotisation sur la plateforme'}
            page={page}
            totalPages={data?.totalPages}
            totalElements={data?.totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </AppLayout>
  )
}
