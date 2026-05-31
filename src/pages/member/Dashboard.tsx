import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useTontines } from '@/hooks/useTontines'
import { useCotisations } from '@/hooks/useCotisations'
import { useAuth } from '@/hooks/useAuth'
import { TontineStatut, CotisationStatut } from '@/types/common'
import { Building2, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function MemberDashboard() {
  const { user } = useAuth()
  // GET /v1/tontines retourne uniquement les tontines de l'utilisateur connecté (hors SUPER_ADMIN)
  const { data: tontinesData, isLoading: tontinesLoading } = useTontines(0, 10)

  const tontines = tontinesData?.content || []

  // On prend la première tontine active pour afficher les cotisations récentes
  const activeTontine = tontines.find((t) => t.statut === TontineStatut.ACTIVE)
  const { data: cotisationsData } = useCotisations(activeTontine?.id || '', undefined, 0, 10)

  const cotisations = cotisationsData?.content || []
  const enAttente = cotisations.filter((c) => c.statut === CotisationStatut.EN_ATTENTE).length
  const totalValide = cotisations
    .filter((c) => c.statut === CotisationStatut.VALIDE)
    .reduce((s, c) => s + c.montant, 0)

  return (
    <AppLayout>
      <PageHeader
        title={`Bonjour, ${user?.firstName || 'Membre'}`}
        description="Vue d'ensemble de votre participation aux tontines"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat
          label="Mes Tontines"
          value={tontines.length}
          icon={<Building2 size={32} />}
        />
        <Stat
          label="Tontines actives"
          value={tontines.filter((t) => t.statut === TontineStatut.ACTIVE).length}
          icon={<TrendingUp size={32} />}
        />
        <Stat
          label="Total contribué (validé)"
          value={`${totalValide.toLocaleString()} FCFA`}
          icon={<DollarSign size={32} />}
        />
        <Stat
          label="Cotisations en attente"
          value={enAttente}
          icon={<AlertCircle size={32} />}
        />
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Mes Tontines</h3>
        {tontinesLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : tontines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tontines.slice(0, 6).map((tontine) => (
              <div
                key={tontine.id}
                className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-neutral-900">{tontine.nom}</h4>
                  <Badge variant={statutVariants[tontine.statut]}>{tontine.statut}</Badge>
                </div>
                {tontine.description && (
                  <p className="text-sm text-neutral-500 mb-3 line-clamp-1">{tontine.description}</p>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{tontine.nombreMembresActuels}/{tontine.nombreMembres} membres</span>
                  <span className="text-primary-600 font-semibold">{tontine.montant.toLocaleString()} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-center py-8">Vous ne participez à aucune tontine</p>
        )}
      </Card>
    </AppLayout>
  )
}
