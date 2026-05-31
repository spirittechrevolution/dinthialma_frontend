import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalDashboard } from '@/hooks/useDashboard'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#6b7280']

export function SuperAdminDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useGlobalDashboard()
  const { data: tontinesData, isLoading: tontinesLoading } = useTontines(0, 5)

  if (dashLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = tontinesData?.content || []
  const t = dashboard?.tontines
  const u = dashboard?.utilisateurs
  const f = dashboard?.finances
  const a = dashboard?.activiteRecente

  const pieData = t ? [
    { name: 'Actives', value: t.actives },
    { name: 'Brouillon', value: t.brouillon },
    { name: 'Suspendues', value: t.suspendues },
    { name: 'Terminées', value: t.terminees },
  ].filter((d) => d.value > 0) : []

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
      render: (row) => <span className="text-primary-600 font-semibold">{row.nombreMembresActuels}/{row.nombreMembres}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => `${row.montant.toLocaleString()} FCFA`,
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Tableau de bord"
        description="Vue globale de la plateforme Dinthialma"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat label="Utilisateurs actifs" value={u?.actifs ?? 0} icon={<Users size={32} />} />
        <Stat label="Tontines actives" value={t?.actives ?? 0} icon={<TrendingUp size={32} />} />
        <Stat
          label="Validé ce mois"
          value={`${(f?.montantValideСeMois ?? 0).toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
        <Stat label="Cotisations en attente" value={f?.cotisationsEnAttente ?? 0} icon={<AlertCircle size={32} />} />
      </div>

      {/* Activité 24h */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Nouveaux inscrits (24h)</h3>
          <p className="text-3xl font-bold text-neutral-900">{a?.nouveauxInscrits ?? 0}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-neutral-500 mb-1">Cotisations enregistrées (24h)</h3>
          <p className="text-3xl font-bold text-neutral-900">{a?.cotisationsEnregistrees ?? 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart statuts */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Répartition par statut</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}`, n]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-neutral-400">Aucune donnée</div>
          )}
          <div className="mt-2 space-y-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-neutral-600">{d.name}</span>
                <span className="ml-auto font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Dernières tontines */}
        <Card className="lg:col-span-2 noPadding">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">5 Dernières Tontines</h3>
          </div>
          <CardBody>
            <Table
              columns={columns}
              data={tontines}
              isLoading={tontinesLoading}
              emptyMessage="Aucune tontine"
            />
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  )
}
