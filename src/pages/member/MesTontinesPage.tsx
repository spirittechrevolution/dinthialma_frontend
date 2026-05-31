import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Building2 } from 'lucide-react'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function MesTontinesPage() {
  const { data: tontinesData, isLoading } = useTontines(0, 50)
  const tontines = tontinesData?.content || []

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <PageHeader title="Mes Tontines" description="Toutes les tontines auxquelles vous participez" />

      {tontines.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 size={64} />}
            title="Aucune tontine"
            description="Vous ne participez à aucune tontine pour le moment"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tontines.map((tontine: Tontine) => (
            <Card key={tontine.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-neutral-900">{tontine.nom}</h3>
                <Badge variant={statutVariants[tontine.statut]}>{tontine.statut}</Badge>
              </div>

              {tontine.description && (
                <p className="text-sm text-neutral-500 mb-4 line-clamp-2">{tontine.description}</p>
              )}

              <div className="space-y-2 mb-4 pb-4 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Montant</span>
                  <span className="font-semibold text-primary-600">{tontine.montant.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Membres</span>
                  <span className="font-semibold">{tontine.nombreMembresActuels}/{tontine.nombreMembres}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Fréquence</span>
                  <Badge variant="default">{tontine.frequence}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Mode</span>
                  <span className="text-sm font-medium">{tontine.modeCycle}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-neutral-400">
                <span>Créé par {tontine.creePar.firstName} {tontine.creePar.lastName}</span>
                <span>{new Date(tontine.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
