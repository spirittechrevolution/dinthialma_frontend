import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Table, Column } from '@/components/ui/Table'
import { QueryError } from '@/components/shared/QueryError'
import { useAllTontinesAdmin } from '@/hooks/useDashboard'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { formatFCFA, formatDateCourte } from '@/lib/format'
import { ChevronRight } from 'lucide-react'
import { ChipRow, FilterChip } from '@/components/ui/ChipRow'

const PAGE_SIZE = 20

const STATUT_TABS: { label: string; value: TontineStatut | '' }[] = [
  { label: 'Toutes', value: '' },
  { label: 'Actives', value: TontineStatut.ACTIVE },
  { label: 'Brouillons', value: TontineStatut.BROUILLON },
  { label: 'Suspendues', value: TontineStatut.SUSPENDUE },
  { label: 'Terminées', value: TontineStatut.TERMINEE },
]

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'default',
  SUSPENDUE: 'warning',
  TERMINEE: 'default',
}

const FREQ_LABELS: Record<string, string> = {
  JOURNALIERE: 'Journalière',
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUEL: 'Bimensuelle',
  MENSUEL: 'Mensuelle',
  TRIMESTRIEL: 'Trimestrielle',
}

/** SUPER_ADMIN — GET /v1/admin/dashboard/tontines (paginé, filtre statut côté serveur) */
export function AllTontinesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statut, setStatut] = useState<TontineStatut | ''>('')

  const { data, isLoading, isError, error, refetch, isFetching } = useAllTontinesAdmin(page, PAGE_SIZE, statut)
  const tontines = data?.content || []

  const changeStatut = (value: TontineStatut | '') => {
    setStatut(value)
    setPage(0) // un changement de filtre ramène à la première page
  }

  const columns: Column<Tontine>[] = [
    {
      key: 'nom',
      header: 'Tontine',
      render: (t) => (
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{t.nom}</p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {t.tontineType === 'EVENEMENTIELLE' ? 'Événementielle' : 'Rotative'}
          </p>
        </div>
      ),
    },
    { key: 'creePar', header: 'Créateur', render: (t) => `${t.creePar.firstName} ${t.creePar.lastName}` },
    { key: 'montant', header: 'Montant', render: (t) => <span className="tabular font-medium">{formatFCFA(t.montant)}</span> },
    { key: 'frequence', header: 'Fréquence', render: (t) => FREQ_LABELS[t.frequence] || t.frequence, hideOnMobile: true },
    {
      key: 'nombreMembresActuels',
      header: 'Membres',
      render: (t) => (t.nombreMembres ? `${t.nombreMembresActuels}/${t.nombreMembres}` : t.nombreMembresActuels),
    },
    { key: 'dateDebut', header: 'Début', render: (t) => formatDateCourte(t.dateDebut), hideOnMobile: true },
    {
      key: 'statut',
      header: 'Statut',
      render: (t) => (
        <Badge variant={statutVariants[t.statut]}>{t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      hideOnMobile: true,
      className: 'w-10',
      render: () => <ChevronRight size={18} className="text-neutral-300" />,
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Toutes les tontines"
        description={data ? `${data.totalElements} tontine${data.totalElements > 1 ? 's' : ''} sur la plateforme` : 'Vue globale de la plateforme'}
      />

      {/* Filtre statut (côté serveur) */}
      <ChipRow className="mb-4">
        {STATUT_TABS.map((tab) => (
          <FilterChip key={tab.value || 'all'} label={tab.label} actif={statut === tab.value} onClick={() => changeStatut(tab.value)} />
        ))}
      </ChipRow>

      {isError ? (
        <div className="bg-white rounded-2xl border border-neutral-100">
          <QueryError error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className={isFetching && !isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <Table
            columns={columns}
            data={tontines}
            isLoading={isLoading}
            emptyMessage={statut ? 'Aucune tontine avec ce statut' : 'Aucune tontine sur la plateforme'}
            onRowClick={(t) => navigate(`/tontine/${t.id}`)}
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
