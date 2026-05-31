import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMemberTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Building2 } from 'lucide-react'

export function MesTontinesPage() {
  const { data: tontines, isLoading } = useMemberTontines()

  if (isLoading) return <Spinner />

  return (
    <AppLayout>
      <PageHeader title="Mes Tontines" description="Toutes les tontines auxquelles vous participez" />

      {!tontines || tontines.length === 0 ? (
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
            <Card key={tontine.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-neutral-900">{tontine.nom}</h3>
                <StatusBadge status={tontine.statut} />
              </div>

              <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{tontine.description}</p>

              <div className="space-y-2 mb-4 pb-4 border-b border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Montant</span>
                  <span className="font-semibold text-primary-600">{tontine.montant.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Membres</span>
                  <span className="font-semibold">{tontine.nombreMembres}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Fréquence</span>
                  <Badge variant="default">{tontine.frequence}</Badge>
                </div>
              </div>

              <div className="text-xs text-neutral-600">
                Créée le {new Date(tontine.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
