import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { useAdminTontines, useTontineStatistics } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatus } from '@/types/common'
import { Users, TrendingUp, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function AdminDashboard() {
  const { data: stats } = useTontineStatistics()
  const { data: tontinesData, isLoading: tontinesLoading } = useAdminTontines(0, 5)

  const tontines = tontinesData?.content || []

  const columns: Column<Tontine>[] = [
    {
      key: 'nom',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.nom}</span>,
    },
    {
      key: 'nombreMembres',
      header: 'Membres',
      render: (row) => <span className="text-primary-600 font-semibold">{row.nombreMembres}</span>,
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

  const chartData = [
    { cycle: 'Cycle 1', cotisations: 450000 },
    { cycle: 'Cycle 2', cotisations: 520000 },
    { cycle: 'Cycle 3', cotisations: 480000 },
    { cycle: 'Cycle 4', cotisations: 600000 },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de vos tontines"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          label="Tontines Actives"
          value={stats?.tontinesByStatus?.ACTIVE || 0}
          icon={<TrendingUp size={32} />}
        />
        <Stat
          label="Membres"
          value={stats?.totalMembers || 0}
          icon={<Users size={32} />}
        />
        <Stat
          label="Collectés ce mois"
          value={`${(stats?.totalContributionsCollected || 0).toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
        <Stat
          label="En attente"
          value="5"
          icon={<TrendingUp size={32} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Cotisations par cycle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cycle" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cotisations" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Mes Tontines */}
        <Card className="lg:col-span-2 noPadding">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">Mes Tontines</h3>
          </div>
          <CardBody>
            <Table
              columns={columns}
              data={tontines}
              isLoading={tontinesLoading}
              emptyMessage="Aucune tontine créée"
            />
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  )
}
