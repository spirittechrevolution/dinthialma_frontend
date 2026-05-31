import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useMyDashboard } from '@/hooks/useDashboard'
import { TontineStats } from '@/types/dashboard'
import { TontineStatut } from '@/types/common'
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function AdminDashboard() {
  const { data: dashboard, isLoading } = useMyDashboard()

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = dashboard?.tontines || []
  const totalEnAttente = tontines.reduce((s, t) => s + t.cotisationsEnAttente, 0)
  const totalEnRetard = tontines.reduce((s, t) => s + t.cotisationsEnRetard, 0)
  const totalValide = tontines.reduce((s, t) => s + t.montantTotalValide, 0)

  const columns: Column<TontineStats>[] = [
    {
      key: 'nom',
      header: 'Tontine',
      render: (row) => <span className="font-semibold">{row.nom}</span>,
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut as TontineStatut]}>{row.statut}</Badge>,
    },
    {
      key: 'nombreMembres',
      header: 'Membres',
      render: (row) => <span className="text-primary-600 font-semibold">{row.nombreMembres}</span>,
    },
    {
      key: 'cotisationsEnAttente',
      header: 'En attente',
      render: (row) => row.cotisationsEnAttente > 0
        ? <Badge variant="warning">{row.cotisationsEnAttente}</Badge>
        : <span className="text-neutral-400">0</span>,
    },
    {
      key: 'cotisationsEnRetard',
      header: 'En retard',
      render: (row) => row.cotisationsEnRetard > 0
        ? <Badge variant="error">{row.cotisationsEnRetard}</Badge>
        : <span className="text-neutral-400">0</span>,
    },
    {
      key: 'montantTotalValide',
      header: 'Total validé',
      render: (row) => <span>{row.montantTotalValide.toLocaleString()} FCFA</span>,
    },
    {
      key: 'cycleEnCours',
      header: 'Cycle en cours',
      render: (row) => row.cycleEnCours
        ? <span>Cycle {row.cycleEnCours.numeroCycle} — {row.cycleEnCours.beneficiaireNom || 'Bénéficiaire non désigné'}</span>
        : <span className="text-neutral-400">Aucun</span>,
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de vos tontines"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          label="Tontines gérées"
          value={dashboard?.nombreTontinesGerees || 0}
          icon={<TrendingUp size={32} />}
        />
        <Stat
          label="Cotisations en attente"
          value={totalEnAttente}
          icon={<AlertCircle size={32} />}
        />
        <Stat
          label="Cotisations en retard"
          value={totalEnRetard}
          icon={<Users size={32} />}
        />
        <Stat
          label="Total validé"
          value={`${totalValide.toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
      </div>

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Mes Tontines</h3>
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={tontines}
            isLoading={isLoading}
            emptyMessage="Aucune tontine gérée"
          />
        </CardBody>
      </Card>
    </AppLayout>
  )
}
