import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { useTontineStatistics, useAdminTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { Users, TrendingUp, DollarSign, PieChart } from 'lucide-react'
import { PieChart as RechartPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { TontineStatus } from '@/types/common'

export function SuperAdminDashboard() {
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
      key: 'creePar',
      header: 'Créé par',
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

  const pieData = stats
    ? Object.entries(stats.tontinesByStatus).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : []

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#3b82f6']

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de toutes les tontines"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          label="Total Tontines"
          value={stats?.totalTontines || 0}
          icon={<TrendingUp size={32} />}
        />
        <Stat
          label="Membres Actifs"
          value={stats?.totalMembers || 0}
          icon={<Users size={32} />}
        />
        <Stat
          label="Cotisations Collectées"
          value={`${(stats?.totalContributionsCollected || 0).toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
        <Stat
          label="Total Commissions"
          value={`${(stats?.totalCommissions || 0).toLocaleString()} FCFA`}
          icon={<PieChart size={32} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Répartition par statut</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-neutral-500">
              Aucune donnée
            </div>
          )}
        </Card>

        {/* Recent Tontines */}
        <Card className="lg:col-span-2 noPadding">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">5 Dernières Tontines</h3>
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
