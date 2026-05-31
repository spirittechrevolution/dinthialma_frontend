import { useState } from 'react'
import { useParams } from 'react-router-dom'
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCycles, useOpenCycle, useCloturerCycle } from '@/hooks/useCycles'
import { useTontine } from '@/hooks/useTontines'
import { Cycle } from '@/types/cycle'
import { CycleStatut, ModeCycle } from '@/types/common'
import { Plus, Lock } from 'lucide-react'

const openCycleSchema = z.object({
  dateDebut: z.string().min(1, 'Requis'),
  dateFin: z.string().min(1, 'Requis'),
  beneficiaireId: z.string().uuid().optional().or(z.literal('')),
})

type OpenCycleForm = z.infer<typeof openCycleSchema>

const statutVariants: Record<CycleStatut, 'success' | 'warning' | 'info' | 'default'> = {
  EN_ATTENTE: 'warning',
  EN_COURS: 'info',
  TERMINE: 'success',
}

export function CyclesPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [cycleToClose, setCycleToClose] = useState<string | null>(null)

  const { data: tontine } = useTontine(tontineId || '')
  const { data: cyclesData, isLoading } = useCycles(tontineId || '', page, 20)
  const { mutate: openCycle, isPending: isOpening } = useOpenCycle()
  const { mutate: cloturerCycle, isPending: isClosing } = useCloturerCycle()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OpenCycleForm>({
    resolver: zodResolver(openCycleSchema),
  })

  const cycles = cyclesData?.content || []
  const totalPages = cyclesData?.totalPages || 1
  const isManuel = tontine?.modeCycle === ModeCycle.MANUEL

  const onOpenSubmit = (data: OpenCycleForm) => {
    openCycle(
      {
        tontineId: tontineId!,
        request: {
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          beneficiaireId: data.beneficiaireId || undefined,
        },
      },
      {
        onSuccess: () => { toast.success('Cycle ouvert'); reset(); setIsOpenModal(false) },
        onError: () => toast.error('Erreur lors de l\'ouverture du cycle'),
      }
    )
  }

  const handleCloturer = () => {
    if (!cycleToClose || !tontineId) return
    cloturerCycle(
      { tontineId, cycleId: cycleToClose },
      {
        onSuccess: () => { toast.success('Cycle clôturé avec succès'); setCycleToClose(null) },
        onError: () => toast.error('Erreur lors de la clôture'),
      }
    )
  }

  const columns: Column<Cycle>[] = [
    {
      key: 'numeroCycle',
      header: 'Cycle',
      render: (row) => <span className="font-semibold">Cycle {row.numeroCycle}</span>,
    },
    { key: 'dateDebut', header: 'Début', render: (row) => new Date(row.dateDebut).toLocaleDateString('fr-FR') },
    { key: 'dateFin', header: 'Fin', render: (row) => new Date(row.dateFin).toLocaleDateString('fr-FR') },
    {
      key: 'montantJackpot',
      header: 'Jackpot brut',
      render: (row) => row.montantJackpot ? `${row.montantJackpot.toLocaleString()} FCFA` : '—',
    },
    {
      key: 'montantNet',
      header: 'Net bénéficiaire',
      render: (row) => row.montantNet ? (
        <span className="text-primary-600 font-semibold">{row.montantNet.toLocaleString()} FCFA</span>
      ) : '—',
    },
    {
      key: 'beneficiaire',
      header: 'Bénéficiaire',
      render: (row) => row.beneficiaire
        ? `${row.beneficiaire.firstName} ${row.beneficiaire.lastName}`
        : '—',
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => row.statut === CycleStatut.EN_COURS ? (
        <Button variant="secondary" size="sm" onClick={() => setCycleToClose(row.id)}>
          <Lock size={16} /> Clôturer
        </Button>
      ) : null,
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Cycles"
        description={isManuel ? 'Mode manuel — ouvrez chaque cycle manuellement' : 'Mode automatique'}
        action={
          isManuel ? (
            <Button onClick={() => setIsOpenModal(true)}>
              <Plus size={20} /> Ouvrir un cycle
            </Button>
          ) : undefined
        }
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={cycles}
            isLoading={isLoading}
            emptyMessage="Aucun cycle pour cette tontine"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      {/* Modal ouverture cycle manuel */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => { reset(); setIsOpenModal(false) }}
        title="Ouvrir un nouveau cycle"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { reset(); setIsOpenModal(false) }} disabled={isOpening}>Annuler</Button>
            <Button form="open-cycle-form" type="submit" loading={isOpening}>Ouvrir</Button>
          </div>
        }
      >
        <form id="open-cycle-form" onSubmit={handleSubmit(onOpenSubmit)} className="space-y-4">
          <Input label="Date de début" type="date" error={errors.dateDebut?.message} {...register('dateDebut')} />
          <Input label="Date de fin" type="date" error={errors.dateFin?.message} {...register('dateFin')} />
          <Input
            label="UUID du bénéficiaire (optionnel)"
            placeholder="550e8400-..."
            {...register('beneficiaireId')}
          />
        </form>
      </Modal>

      {/* Confirmation clôture */}
      <ConfirmDialog
        isOpen={!!cycleToClose}
        onClose={() => setCycleToClose(null)}
        onConfirm={handleCloturer}
        title="Clôturer ce cycle ?"
        message="Le jackpot sera calculé, les commissions déduites et les cotisations EN_ATTENTE marquées EN_RETARD. En mode automatique, le cycle suivant démarrera automatiquement."
        confirmText="Clôturer"
        isDangerous
        isLoading={isClosing}
      />
    </AppLayout>
  )
}
