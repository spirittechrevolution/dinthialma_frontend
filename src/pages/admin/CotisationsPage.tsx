import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FilterBar } from '@/components/shared/FilterBar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useTontineContributions, useValidateContribution, useRejectContribution } from '@/hooks/useCotisations'
import { CotisationWithDetails } from '@/types/cotisation'
import { ContributionStatus } from '@/types/common'
import { CheckCircle, XCircle } from 'lucide-react'

type CotisationAction = { type: 'validate' | 'reject'; id: string } | null

export function CotisationsPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [action, setAction] = useState<CotisationAction>(null)

  const { data: cotisationsData, isLoading } = useTontineContributions(
    tontineId || '',
    statusFilter ? { statut: statusFilter as ContributionStatus } : undefined,
    page,
    20
  )
  const { mutate: validateContribution, isPending: isValidating } = useValidateContribution()
  const { mutate: rejectContribution, isPending: isRejecting } = useRejectContribution()

  const cotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1

  const handleConfirm = () => {
    if (!action) return

    if (action.type === 'validate') {
      validateContribution(
        { cotisationId: action.id, isValidated: true },
        {
          onSuccess: () => {
            toast.success('Cotisation validée avec succès')
            setAction(null)
          },
          onError: () => toast.error('Erreur lors de la validation'),
        }
      )
    } else {
      rejectContribution(
        { contributionId: action.id },
        {
          onSuccess: () => {
            toast.success('Cotisation rejetée')
            setAction(null)
          },
          onError: () => toast.error('Erreur lors du rejet'),
        }
      )
    }
  }

  const columns: Column<CotisationWithDetails>[] = [
    {
      key: 'membreNom',
      header: 'Membre',
      render: (row) => <span className="font-semibold">{row.membreNom}</span>,
    },
    { key: 'tontineNom', header: 'Tontine' },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => (
        <span className="text-primary-600 font-semibold">{row.montant.toLocaleString()} FCFA</span>
      ),
    },
    { key: 'methodePaiement', header: 'Méthode' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const variants: Record<ContributionStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
          EN_ATTENTE: 'warning',
          VALIDEE: 'success',
          REJETEE: 'error',
        }
        return <Badge variant={variants[row.statut]}>{row.statut}</Badge>
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => {
        if (row.statut !== ContributionStatus.EN_ATTENTE) return <span className="text-neutral-400">—</span>
        return (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              title="Valider"
              onClick={() => setAction({ type: 'validate', id: row.id })}
            >
              <CheckCircle size={16} />
            </Button>
            <Button
              variant="danger"
              size="sm"
              title="Rejeter"
              onClick={() => setAction({ type: 'reject', id: row.id })}
            >
              <XCircle size={16} />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <AppLayout>
      <PageHeader title="Cotisations" />

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <FilterBar
            filters={[
              {
                key: 'statut',
                label: 'Statut',
                type: 'select',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: '', label: 'Tous' },
                  { value: 'EN_ATTENTE', label: 'En attente' },
                  { value: 'VALIDEE', label: 'Validée' },
                  { value: 'REJETEE', label: 'Rejetée' },
                ],
              },
            ]}
            onClear={() => setStatusFilter('')}
          />
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={cotisations}
            isLoading={isLoading}
            emptyMessage="Aucune cotisation trouvée"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      {action && (
        <ConfirmDialog
          isOpen
          onClose={() => setAction(null)}
          onConfirm={handleConfirm}
          title={action.type === 'validate' ? 'Valider ce paiement ?' : 'Rejeter ce paiement ?'}
          message={
            action.type === 'validate'
              ? 'Cette cotisation sera marquée comme validée.'
              : 'Cette cotisation sera marquée comme rejetée. Le membre en sera notifié.'
          }
          confirmText={action.type === 'validate' ? 'Valider' : 'Rejeter'}
          isDangerous={action.type === 'reject'}
          isLoading={isValidating || isRejecting}
        />
      )}
    </AppLayout>
  )
}
