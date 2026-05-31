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
import { useTontines, useCreateTontine } from '@/hooks/useTontines'
import { useCodeList } from '@/hooks/useCodeList'
import { Tontine } from '@/types/tontine'
import { TontineStatut, ModeCycle } from '@/types/common'
import { Plus, Eye } from 'lucide-react'

const schema = z.object({
  nom: z.string().min(2, 'Au moins 2 caractères'),
  description: z.string().optional(),
  montant: z.coerce.number().positive('Montant invalide'),
  frequence: z.string().min(1, 'Requis'),
  ordreBeneficiaire: z.string().min(1, 'Requis'),
  modeCycle: z.nativeEnum(ModeCycle),
  dateDebut: z.string().min(1, 'Requis'),
  nombreMembres: z.coerce.number().int().min(2).max(100),
})

type FormData = z.infer<typeof schema>

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function TontinesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [statutFilter, setStatutFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: tontinesData, isLoading } = useTontines(page, 20)
  const { mutate: createTontine, isPending } = useCreateTontine()
  const { data: frequences = [] } = useCodeList('FREQUENCE_TONTINE')
  const { data: ordresBeneficiaire = [] } = useCodeList('ORDRE_BENEFICIAIRE')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { modeCycle: ModeCycle.AUTOMATIQUE, nombreMembres: 12 },
  })

  const tontines = tontinesData?.content || []
  const totalPages = tontinesData?.totalPages || 1
  const filtered = statutFilter ? tontines.filter((t) => t.statut === statutFilter) : tontines

  const onSubmit = (data: FormData) => {
    createTontine(data, {
      onSuccess: () => {
        toast.success('Tontine créée avec succès')
        reset()
        setIsOpen(false)
      },
      onError: () => toast.error('Erreur lors de la création de la tontine'),
    })
  }

  const handleClose = () => { reset(); setIsOpen(false) }

  const columns: Column<Tontine>[] = [
    {
      key: 'nom',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.nom}</span>,
    },
    {
      key: 'nombreMembres',
      header: 'Membres',
      render: (row) => (
        <span className="text-primary-600 font-semibold">
          {row.nombreMembresActuels}/{row.nombreMembres}
        </span>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => <span>{row.montant.toLocaleString()} FCFA</span>,
    },
    { key: 'frequence', header: 'Fréquence' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
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
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous' },
              { value: TontineStatut.BROUILLON, label: 'Brouillon' },
              { value: TontineStatut.ACTIVE, label: 'Active' },
              { value: TontineStatut.SUSPENDUE, label: 'Suspendue' },
              { value: TontineStatut.TERMINEE, label: 'Terminée' },
            ]}
          />
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            emptyMessage="Aucune tontine créée. Commencez par en créer une !"
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
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>Annuler</Button>
            <Button form="create-tontine-form" type="submit" loading={isPending}>Créer</Button>
          </div>
        }
      >
        <form id="create-tontine-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom"
            placeholder="Tontine Famille Diallo"
            error={errors.nom?.message}
            {...register('nom')}
          />
          <Input
            label="Description (optionnel)"
            placeholder="Description du groupe..."
            {...register('description')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Montant (FCFA)"
              type="number"
              placeholder="5000"
              error={errors.montant?.message}
              {...register('montant')}
            />
            <Input
              label="Nombre de membres"
              type="number"
              placeholder="12"
              error={errors.nombreMembres?.message}
              {...register('nombreMembres')}
            />
          </div>
          <Select
            label="Fréquence"
            error={errors.frequence?.message}
            options={frequences.map((f) => ({ value: f.value, label: f.description }))}
            {...register('frequence')}
          />
          <Select
            label="Ordre des bénéficiaires"
            error={errors.ordreBeneficiaire?.message}
            options={ordresBeneficiaire.map((o) => ({ value: o.value, label: o.description }))}
            {...register('ordreBeneficiaire')}
          />
          <Select
            label="Mode de cycle"
            error={errors.modeCycle?.message}
            options={[
              { value: ModeCycle.AUTOMATIQUE, label: 'Automatique' },
              { value: ModeCycle.MANUEL, label: 'Manuel' },
            ]}
            {...register('modeCycle')}
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
