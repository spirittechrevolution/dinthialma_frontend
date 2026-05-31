import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useTontineById } from '@/hooks/useTontines'
import { TontineStatus } from '@/types/common'
import { ArrowLeft, Edit2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function TontineDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'infos' | 'membres' | 'cycles' | 'cotisations' | 'commissions'>('infos')
  const { data: tontine, isLoading } = useTontineById(id || '')

  if (isLoading) return <Spinner />

  if (!tontine) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-neutral-600">Tontine non trouvée</p>
        </div>
      </AppLayout>
    )
  }

  const variants: Record<TontineStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    ACTIVE: 'success',
    EN_ATTENTE: 'warning',
    EN_PAUSE: 'warning',
    TERMINEE: 'default',
    ANNULEE: 'error',
  }

  const tabs = [
    { id: 'infos', label: 'Infos générales' },
    { id: 'membres', label: 'Membres' },
    { id: 'cycles', label: 'Cycles' },
    { id: 'cotisations', label: 'Cotisations' },
    { id: 'commissions', label: 'Commissions' },
  ]

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <PageHeader
          title={tontine.nom}
          description={tontine.description}
          action={<Button><Edit2 size={20} />Modifier</Button>}
        />
      </div>

      {/* Status Bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600">Statut</p>
            <Badge variant={variants[tontine.statut]}>{tontine.statut}</Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Montant unitaire</p>
            <p className="text-2xl font-bold text-primary-600">{tontine.montant.toLocaleString()} FCFA</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Membres</p>
            <p className="text-2xl font-bold text-neutral-900">{tontine.nombreMembres}</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card noPadding>
        <div className="border-b border-neutral-200 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CardBody>
          {activeTab === 'infos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Fréquence</p>
                  <p className="text-lg font-semibold">{tontine.frequence}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Ordre bénéficiaire</p>
                  <p className="text-lg font-semibold">{tontine.ordreBeneficiaire}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Mode cycle</p>
                  <p className="text-lg font-semibold">{tontine.modeCycle}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Date de début</p>
                  <p className="text-lg font-semibold">{new Date(tontine.dateDebut).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'membres' && (
            <div>
              <Button className="mb-4"><Plus size={20} />Ajouter un membre</Button>
              <p className="text-neutral-600">Onglet Membres - À compléter</p>
            </div>
          )}
          {activeTab === 'cycles' && (
            <p className="text-neutral-600">Onglet Cycles - À compléter</p>
          )}
          {activeTab === 'cotisations' && (
            <p className="text-neutral-600">Onglet Cotisations - À compléter</p>
          )}
          {activeTab === 'commissions' && (
            <p className="text-neutral-600">Onglet Commissions - À compléter</p>
          )}
        </CardBody>
      </Card>
    </AppLayout>
  )
}
