import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Spinner } from '@/components/ui/Spinner'
import { useMemberTontines } from '@/hooks/useTontines'
import { useMyContributions } from '@/hooks/useCotisations'
import { Building2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export function MemberDashboard() {
  const { data: tontines, isLoading: tontinesLoading } = useMemberTontines()
  const { data: contributionsData } = useMyContributions(0, 10)

  const pendingContributions = (contributionsData?.content || []).filter((c) => c.statut === 'EN_ATTENTE').length
  const totalContributed = (contributionsData?.content || []).reduce((sum, c) => {
    if (c.statut === 'VALIDEE') return sum + c.montant
    return sum
  }, 0)

  return (
    <AppLayout>
      <PageHeader
        title="Mon Tableau de bord"
        description="Vue d'ensemble de votre participation aux tontines"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          label="Mes Tontines"
          value={tontines?.length || 0}
          icon={<Building2 size={32} />}
        />
        <Stat
          label="Total Contribué"
          value={`${totalContributed.toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
        <Stat
          label="Cotisations en attente"
          value={pendingContributions}
          icon={<AlertCircle size={32} />}
        />
        <Stat
          label="Prochain jackpot"
          value="15 jours"
          icon={<TrendingUp size={32} />}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Recent Tontines */}
      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Mes Tontines Actives</h3>
        {tontinesLoading ? (
          <Spinner />
        ) : (tontines && tontines.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tontines.slice(0, 4).map((tontine) => (
              <div key={tontine.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                <h4 className="font-semibold text-neutral-900">{tontine.nom}</h4>
                <p className="text-sm text-neutral-600 mt-1">{tontine.description}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-neutral-600">{tontine.nombreMembres} membres</span>
                  <span className="text-primary-600 font-semibold">{tontine.montant.toLocaleString()} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-600">Vous ne participez à aucune tontine</p>
        )}
      </Card>
    </AppLayout>
  )
}
