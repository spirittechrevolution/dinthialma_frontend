import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FilterBar } from '@/components/shared/FilterBar'
import { useMyContributions, useCreateContribution } from '@/hooks/useCotisations'
import { useMemberTontines } from '@/hooks/useTontines'
import { useAuth } from '@/hooks/useAuth'
import { CotisationWithDetails } from '@/types/cotisation'
import { ContributionStatus } from '@/types/common'
import { Plus } from 'lucide-react'

const schema = z.object({
  tontineId: z.string().min(1, 'Sélectionnez une tontine'),
  cycleId: z.string().min(1, 'L\'identifiant du cycle est requis'),
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.enum(['MOBILE_MONEY', 'ESPECES', 'VIREMENT', 'AUTRE']),
  referenceTransaction: z.string().optional().default(''),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function MesCotisationsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: cotisationsData, isLoading } = useMyContributions(page, 20)
  const { data: tontines = [] } = useMemberTontines()
  const { mutate: createContribution, isPending } = useCreateContribution()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { methodePaiement: 'MOBILE_MONEY', referenceTransaction: '' },
  })

  const cotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1
  const filtered = statusFilter
    ? cotisations.filter((c) => c.statut === statusFilter)
    : cotisations

  const onSubmit = (data: FormData) => {
    createContribution(
      {
        ...data,
        membreId: user?.sub ?? '',
        referenceTransaction: data.referenceTransaction ?? '',
      },
      {
        onSuccess: () => {
          toast.success('Paiement déclaré avec succès — en attente de validation')
          reset()
          setIsOpen(false)
        },
        onError: () => toast.error('Erreur lors de la déclaration du paiement'),
      }
    )
  }

  const handleClose = () => {
    reset()
    setIsOpen(false)
  }

  const columns: Column<CotisationWithDetails>[] = [
    {
      key: 'tontineNom',
      header: 'Tontine',
      render: (row) => <span className="font-semibold">{row.tontineNom}</span>,
    },
    {
      key: 'numeroCycle',
      header: 'Cycle',
      render: (row) => <span>Cycle {row.numeroCycle || '—'}</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => (
        <span className="text-primary-600 font-semibold">{row.montant.toLocaleString()} FCFA</span>
      ),
    },
    { key: 'methodePaiement', header: 'Méthode' },
    { key: 'referenceTransaction', header: 'Référence' },
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
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Mes Cotisations"
        description="Historique de toutes vos contributions"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus size={20} />
            Déclarer un paiement
          </Button>
        }
      />

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
            data={filtered}
            isLoading={isLoading}
            emptyMessage="Aucune cotisation trouvée"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Déclarer un paiement"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>
              Annuler
            </Button>
            <Button form="declare-paiement-form" type="submit" loading={isPending}>
              Déclarer
            </Button>
          </div>
        }
      >
        <form id="declare-paiement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Tontine"
            placeholder="Sélectionnez une tontine"
            error={errors.tontineId?.message}
            options={tontines.map((t) => ({ value: t.id, label: t.nom }))}
            {...register('tontineId')}
          />
          <Input
            label="ID du cycle"
            placeholder="Identifiant du cycle actif"
            error={errors.cycleId?.message}
            {...register('cycleId')}
          />
          <Input
            label="Montant (FCFA)"
            type="number"
            placeholder="50000"
            error={errors.montant?.message}
            {...register('montant')}
          />
          <Select
            label="Méthode de paiement"
            error={errors.methodePaiement?.message}
            options={[
              { value: 'MOBILE_MONEY', label: 'Mobile Money' },
              { value: 'ESPECES', label: 'Espèces' },
              { value: 'VIREMENT', label: 'Virement bancaire' },
              { value: 'AUTRE', label: 'Autre' },
            ]}
            {...register('methodePaiement')}
          />
          <Input
            label="Référence de transaction"
            placeholder="ex. OM-123456789"
            {...register('referenceTransaction')}
          />
          <Input
            label="Note (optionnel)"
            placeholder="Informations supplémentaires..."
            {...register('note')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
