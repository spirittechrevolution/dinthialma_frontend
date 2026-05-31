import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useAdminTontines, useCreateTontine } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatus, TontineFrequency, BeneficiaryOrder } from '@/types/common'
import { Plus, Eye } from 'lucide-react'

const schema = z.object({
  nom: z.string().min(2, 'Au moins 2 caractères'),
  description: z.string().min(5, 'Au moins 5 caractères'),
  montant: z.coerce.number().positive('Montant invalide'),
  frequence: z.nativeEnum(TontineFrequency),
  ordreBeneficiaire: z.nativeEnum(BeneficiaryOrder),
  dateDebut: z.string().min(1, 'Requis'),
})

type FormData = z.infer<typeof schema>

export function TontinesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: tontinesData, isLoading } = useAdminTontines(page, 20)
  const { mutate: createTontine, isPending } = useCreateTontine()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequence: TontineFrequency.MENSUELLE,
      ordreBeneficiaire: BeneficiaryOrder.SEQUENTIEL,
    },
  })

  const tontines = tontinesData?.content || []
  const totalPages = tontinesData?.totalPages || 1
  const filtered = statusFilter ? tontines.filter((t) => t.statut === statusFilter) : tontines

  const onSubmit = (data: FormData) => {
    createTontine(
      { ...data, modeCycle: 'AUTOMATIQUE' },
      {
        onSuccess: () => {
          toast.success('Tontine créée avec succès')
          reset()
          setIsOpen(false)
        },
        onError: () => toast.error('Erreur lors de la création de la tontine'),
      }
    )
  }

  const handleClose = () => {
    reset()
    setIsOpen(false)
  }

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
      key: 'frequence',
      header: 'Fréquence',
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
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/tontines/${row.id}`)}>
          <Eye size={16} />
        </Button>
      ),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Mes Tontines"
        description="Gérez toutes vos tontines"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus size={20} />
            Nouvelle Tontine
          </Button>
        }
      />

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <Select
            label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous' },
              { value: 'EN_ATTENTE', label: 'En attente' },
              { value: 'ACTIVE', label: 'Actif' },
              { value: 'EN_PAUSE', label: 'En pause' },
              { value: 'TERMINEE', label: 'Terminé' },
              { value: 'ANNULEE', label: 'Annulé' },
            ]}
          />
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyMessage="Aucune tontine créée. Commencez par en créer une!"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Créer une nouvelle tontine"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>
              Annuler
            </Button>
            <Button form="create-tontine-form" type="submit" loading={isPending}>
              Créer
            </Button>
          </div>
        }
      >
        <form id="create-tontine-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ma Tontine"
            error={errors.nom?.message}
            {...register('nom')}
          />
          <Input
            label="Description"
            placeholder="Description de la tontine..."
            error={errors.description?.message}
            {...register('description')}
          />
          <Input
            label="Montant (FCFA)"
            type="number"
            placeholder="100000"
            error={errors.montant?.message}
            {...register('montant')}
          />
          <Select
            label="Fréquence"
            error={errors.frequence?.message}
            options={[
              { value: TontineFrequency.HEBDOMADAIRE, label: 'Hebdomadaire' },
              { value: TontineFrequency.BIMENSUELLE, label: 'Bimensuelle' },
              { value: TontineFrequency.MENSUELLE, label: 'Mensuelle' },
              { value: TontineFrequency.TRIMESTRIELLE, label: 'Trimestrielle' },
            ]}
            {...register('frequence')}
          />
          <Select
            label="Ordre des bénéficiaires"
            error={errors.ordreBeneficiaire?.message}
            options={[
              { value: BeneficiaryOrder.SEQUENTIEL, label: 'Séquentiel' },
              { value: BeneficiaryOrder.ALEATOIRE, label: 'Aléatoire' },
              { value: BeneficiaryOrder.PAR_APPORT, label: 'Par apport' },
            ]}
            {...register('ordreBeneficiaire')}
          />
          <Input
            label="Date de début"
            type="date"
            error={errors.dateDebut?.message}
            {...register('dateDebut')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
