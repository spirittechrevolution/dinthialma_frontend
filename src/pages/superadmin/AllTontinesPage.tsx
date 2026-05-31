import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatus } from '@/types/common'

export function AllTontinesPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const { data: tontinesData, isLoading } = useTontines(page, 20)

  const tontines = tontinesData?.content || []
  const totalPages = tontinesData?.totalPages || 1

  const filteredTontines = statusFilter
    ? tontines.filter((t) => t.statut === statusFilter)
    : tontines

  const columns: Column<Tontine>[] = [
    {
      key: 'nom',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.nom}</span>,
    },
    {
      key: 'creePar',
      header: 'Créé par',
    },
    {
      key: 'nombreMembres',
      header: 'Membres',
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => <span>{row.montant.toLocaleString()} FCFA</span>,
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const variants: Record<TontineStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
          ACTIVE: 'success',
          EN_ATTENTE: 'warning',
          EN_PAUSE: 'warning',
          TERMINEE: 'default',
          ANNULEE: 'error',
        }
        return <Badge variant={variants[row.statut]}>{row.statut}</Badge>
      },
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Toutes les Tontines"
        description="Vue complète de toutes les tontines du système"
      />

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select
                label="Filtrer par statut"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'Tous' },
                  { value: 'EN_ATTENTE', label: 'En attente' },
                  { value: 'ACTIVE', label: 'Actif' },
                  { value: 'EN_PAUSE', label: 'En pause' },
                  { value: 'TERMINEE', label: 'Terminé' },
                  { value: 'ANNULEE', label: 'Annulé' },
                ]}
              />
            </div>
          </div>
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={filteredTontines}
            isLoading={isLoading}
            emptyMessage="Aucune tontine trouvée"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>
    </AppLayout>
  )
}
