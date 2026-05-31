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
import { useCotisations, useRecordCotisation } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { useCodeList } from '@/hooks/useCodeList'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut, TontineStatut } from '@/types/common'
import { Plus } from 'lucide-react'

const schema = z.object({
  tontineId: z.string().min(1, 'Sélectionnez une tontine'),
  cycleId: z.string().min(1, 'Sélectionnez un cycle'),
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.string().min(1, 'Sélectionnez une méthode'),
  referenceTransaction: z.string().optional(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const statutVariants: Record<CotisationStatut, 'success' | 'warning' | 'error'> = {
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  EN_RETARD: 'error',
}

export function MesCotisationsPage() {
  const [page, setPage] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTontineId, setSelectedTontineId] = useState('')

  // On affiche les cotisations de la première tontine active par défaut
  const { data: tontinesData } = useTontines(0, 50)
  const tontines = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)
  const firstTontineId = tontines[0]?.id || ''

  const { data: cotisationsData, isLoading } = useCotisations(firstTontineId, undefined, page, 20)
  const { data: cyclesData } = useCycles(selectedTontineId, 0, 50)
  const { data: methodesPaiement = [] } = useCodeList('METHODE_PAIEMENT')
  const { mutate: recordCotisation, isPending } = useRecordCotisation()

  const cotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1
  const cycles = (cyclesData?.content || []).filter((c) => c.statut === 'EN_COURS')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedTontineId = watch('tontineId')
  if (watchedTontineId && watchedTontineId !== selectedTontineId) {
    setSelectedTontineId(watchedTontineId)
    setValue('cycleId', '')
  }

  const onSubmit = (data: FormData) => {
    recordCotisation(
      {
        tontineId: data.tontineId,
        request: {
          cycleId: data.cycleId,
          montant: data.montant,
          methodePaiement: data.methodePaiement,
          referenceTransaction: data.referenceTransaction,
          note: data.note,
        },
      },
      {
        onSuccess: () => {
          toast.success('Paiement déclaré — en attente de validation par l\'admin')
          reset()
          setIsOpen(false)
        },
        onError: () => toast.error('Erreur lors de la déclaration du paiement'),
      }
    )
  }

  const handleClose = () => { reset(); setIsOpen(false) }

  const columns: Column<Cotisation>[] = [
    {
      key: 'membre',
      header: 'Cycle',
      render: (row) => <span className="font-semibold">Cycle {row.cycleId.slice(0, 8)}…</span>,
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => <span className="text-primary-600 font-semibold">{row.montant.toLocaleString()} FCFA</span>,
    },
    { key: 'methodePaiement', header: 'Méthode', render: (row) => row.methodePaiement || '—' },
    { key: 'referenceTransaction', header: 'Référence', render: (row) => row.referenceTransaction || '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
    {
      key: 'validePar',
      header: 'Validé par',
      render: (row) => row.validePar ? `${row.validePar.firstName} ${row.validePar.lastName}` : '—',
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Mes Cotisations"
        description="Historique de vos contributions"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus size={20} /> Déclarer un paiement
          </Button>
        }
      />

      <Card noPadding>
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

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Déclarer un paiement"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>Annuler</Button>
            <Button form="declare-form" type="submit" loading={isPending}>Déclarer</Button>
          </div>
        }
      >
        <form id="declare-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Tontine"
            error={errors.tontineId?.message}
            options={[
              { value: '', label: 'Sélectionnez une tontine' },
              ...tontines.map((t) => ({ value: t.id, label: t.nom })),
            ]}
            {...register('tontineId')}
          />
          <Select
            label="Cycle en cours"
            error={errors.cycleId?.message}
            options={[
              { value: '', label: cycles.length ? 'Sélectionnez un cycle' : 'Aucun cycle en cours' },
              ...cycles.map((c) => ({ value: c.id, label: `Cycle ${c.numeroCycle} (${new Date(c.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(c.dateFin).toLocaleDateString('fr-FR')})` })),
            ]}
            {...register('cycleId')}
          />
          <Input
            label="Montant (FCFA)"
            type="number"
            placeholder="5000"
            error={errors.montant?.message}
            {...register('montant')}
          />
          <Select
            label="Méthode de paiement"
            error={errors.methodePaiement?.message}
            options={[
              { value: '', label: 'Sélectionnez une méthode' },
              ...methodesPaiement.map((m) => ({ value: m.value, label: m.description })),
            ]}
            {...register('methodePaiement')}
          />
          <Input
            label="Référence de transaction (optionnel)"
            placeholder="WAVE-TXN-20240701-XYZ123"
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
