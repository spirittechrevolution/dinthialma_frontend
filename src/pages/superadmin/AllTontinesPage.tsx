import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Eye } from 'lucide-react'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function AllTontinesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statutFilter, setStatutFilter] = useState('')

  const { data: tontinesData, isLoading } = useTontines(page, 20)

  const tontines = tontinesData?.content || []
  const totalPages = tontinesData?.totalPages || 1
  const filtered = statutFilter ? tontines.filter((t) => t.statut === statutFilter) : tontines

  const columns: Column<Tontine>[] = [
    {
      key: 'nom',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.nom}</span>,
    },
    {
      key: 'creePar',
      header: 'Créateur',
      render: (row) => `${row.creePar.firstName} ${row.creePar.lastName}`,
    },
    {
      key: 'nombreMembres',
      header: 'Membres',
      render: (row) => (
        <span className="text-primary-600 font-semibold">
          {row.nombreMembresActuels}/{row.nombreMembres}
        </span>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => `${row.montant.toLocaleString()} FCFA`,
    },
    { key: 'frequence', header: 'Fréquence' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/tontines/${row.id}`)}>
          <Eye size={16} />
        </Button>
      ),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Toutes les Tontines"
        description="Vue complète de toutes les tontines de la plateforme"
      />

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <Select
            label="Filtrer par statut"
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous' },
              { value: TontineStatut.BROUILLON, label: 'Brouillon' },
              { value: TontineStatut.ACTIVE, label: 'Active' },
              { value: TontineStatut.SUSPENDUE, label: 'Suspendue' },
              { value: TontineStatut.TERMINEE, label: 'Terminée' },
            ]}
          />
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={filtered}
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
