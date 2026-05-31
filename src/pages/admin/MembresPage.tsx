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
import { useMembres, useAddMembre, useUpdateMembreStatut, useRemoveMembre } from '@/hooks/useMembres'
import { Membre } from '@/types/membre'
import { MembreStatut } from '@/types/common'
import { Plus, UserMinus, UserCheck, Trash2 } from 'lucide-react'

const addMembreSchema = z.object({
  userId: z.string().uuid('UUID invalide'),
  ordreJackpot: z.coerce.number().int().positive().optional(),
})

type AddMembreForm = z.infer<typeof addMembreSchema>

type MembreAction = {
  type: 'suspendre' | 'activer' | 'retirer'
  membreId: string
  nom: string
} | null

const statutVariants: Record<MembreStatut, 'success' | 'warning' | 'error'> = {
  ACTIF: 'success',
  SUSPENDU: 'warning',
  SORTI: 'error',
}

export function MembresPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [action, setAction] = useState<MembreAction>(null)

  const { data: membresData, isLoading } = useMembres(tontineId || '', page, 20)
  const { mutate: addMembre, isPending: isAdding } = useAddMembre()
  const { mutate: updateStatut, isPending: isUpdating } = useUpdateMembreStatut()
  const { mutate: removeMembre, isPending: isRemoving } = useRemoveMembre()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddMembreForm>({
    resolver: zodResolver(addMembreSchema),
  })

  const membres = membresData?.content || []
  const totalPages = membresData?.totalPages || 1

  const onAddSubmit = (data: AddMembreForm) => {
    addMembre(
      { tontineId: tontineId!, request: { userId: data.userId, ordreJackpot: data.ordreJackpot } },
      {
        onSuccess: () => { toast.success('Membre ajouté'); reset(); setIsAddOpen(false) },
        onError: () => toast.error('Erreur lors de l\'ajout'),
      }
    )
  }

  const handleConfirmAction = () => {
    if (!action || !tontineId) return
    if (action.type === 'retirer') {
      removeMembre(
        { tontineId, membreId: action.membreId },
        { onSuccess: () => { toast.success('Membre retiré'); setAction(null) }, onError: () => toast.error('Erreur') }
      )
    } else {
      const statut = action.type === 'activer' ? MembreStatut.ACTIF : MembreStatut.SUSPENDU
      updateStatut(
        { tontineId, membreId: action.membreId, request: { statut } },
        { onSuccess: () => { toast.success('Statut mis à jour'); setAction(null) }, onError: () => toast.error('Erreur') }
      )
    }
  }

  const columns: Column<Membre>[] = [
    {
      key: 'user',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.user.firstName} {row.user.lastName}</span>,
    },
    { key: 'user', header: 'Téléphone', render: (row) => row.user.phone },
    { key: 'user', header: 'Email', render: (row) => row.user.email || '—' },
    { key: 'ordreJackpot', header: 'Ordre Jackpot' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.statut === MembreStatut.SUSPENDU && (
            <Button variant="secondary" size="sm" title="Réactiver"
              onClick={() => setAction({ type: 'activer', membreId: row.id, nom: `${row.user.firstName} ${row.user.lastName}` })}>
              <UserCheck size={16} />
            </Button>
          )}
          {row.statut === MembreStatut.ACTIF && (
            <Button variant="secondary" size="sm" title="Suspendre"
              onClick={() => setAction({ type: 'suspendre', membreId: row.id, nom: `${row.user.firstName} ${row.user.lastName}` })}>
              <UserMinus size={16} />
            </Button>
          )}
          {row.statut !== MembreStatut.SORTI && (
            <Button variant="danger" size="sm" title="Retirer"
              onClick={() => setAction({ type: 'retirer', membreId: row.id, nom: `${row.user.firstName} ${row.user.lastName}` })}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const confirmConfig = action ? {
    suspendre: { title: 'Suspendre ce membre ?', message: `${action.nom} sera suspendu temporairement.`, danger: true, confirmText: 'Suspendre' },
    activer: { title: 'Réactiver ce membre ?', message: `${action.nom} sera réactivé.`, danger: false, confirmText: 'Réactiver' },
    retirer: { title: 'Retirer ce membre ?', message: `${action.nom} sera définitivement retiré de la tontine.`, danger: true, confirmText: 'Retirer' },
  }[action.type] : null

  return (
    <AppLayout>
      <PageHeader
        title="Membres"
        description="Gérez les cotisants de cette tontine"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={20} /> Ajouter un membre
          </Button>
        }
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={membres}
            isLoading={isLoading}
            emptyMessage="Aucun membre dans cette tontine"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={isAddOpen}
        onClose={() => { reset(); setIsAddOpen(false) }}
        title="Ajouter un membre"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { reset(); setIsAddOpen(false) }} disabled={isAdding}>Annuler</Button>
            <Button form="add-membre-form" type="submit" loading={isAdding}>Ajouter</Button>
          </div>
        }
      >
        <form id="add-membre-form" onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          <Input
            label="UUID de l'utilisateur"
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            error={errors.userId?.message}
            {...register('userId')}
          />
          <Input
            label="Ordre jackpot (optionnel)"
            type="number"
            placeholder="Laissez vide pour placer en fin de liste"
            {...register('ordreJackpot')}
          />
        </form>
      </Modal>

      {action && confirmConfig && (
        <ConfirmDialog
          isOpen
          onClose={() => setAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          isDangerous={confirmConfig.danger}
          isLoading={isUpdating || isRemoving}
        />
      )}
    </AppLayout>
  )
}
