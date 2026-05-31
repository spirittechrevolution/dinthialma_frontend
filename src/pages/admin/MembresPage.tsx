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
import {
  useTontineMembers,
  useAddMemberToTontine,
  useValidateMember,
  useSuspendMember,
  useExcludeMember,
} from '@/hooks/useMembres'
import { TontineMembre } from '@/types/membre'
import { MemberStatus } from '@/types/common'
import { Plus, UserCheck, UserX, UserMinus } from 'lucide-react'

const addMemberSchema = z.object({
  userId: z.string().min(1, 'L\'identifiant utilisateur est requis'),
})

type AddMemberForm = z.infer<typeof addMemberSchema>

type MemberAction = {
  type: 'validate' | 'suspend' | 'exclude'
  memberId: string
  memberName: string
} | null

export function MembresPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [action, setAction] = useState<MemberAction>(null)

  const { data: membersData, isLoading } = useTontineMembers(tontineId || '', page, 20)
  const { mutate: addMember, isPending: isAdding } = useAddMemberToTontine()
  const { mutate: validateMember, isPending: isValidating } = useValidateMember()
  const { mutate: suspendMember, isPending: isSuspending } = useSuspendMember()
  const { mutate: excludeMember, isPending: isExcluding } = useExcludeMember()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
  })

  const members = membersData?.content || []
  const totalPages = membersData?.totalPages || 1

  const onAddSubmit = (data: AddMemberForm) => {
    addMember(
      { tontineId: tontineId || '', request: { userId: data.userId } },
      {
        onSuccess: () => {
          toast.success('Membre ajouté avec succès')
          reset()
          setIsAddOpen(false)
        },
        onError: () => toast.error('Erreur lors de l\'ajout du membre'),
      }
    )
  }

  const handleConfirmAction = () => {
    if (!action || !tontineId) return

    const params = { tontineId, memberId: action.memberId }
    const callbacks = {
      onSuccess: () => {
        const labels = {
          validate: 'Membre validé avec succès',
          suspend: 'Membre suspendu avec succès',
          exclude: 'Membre exclu avec succès',
        }
        toast.success(labels[action.type])
        setAction(null)
      },
      onError: () => toast.error('Une erreur est survenue'),
    }

    if (action.type === 'validate') validateMember(params, callbacks)
    else if (action.type === 'suspend') suspendMember(params, callbacks)
    else excludeMember(params, callbacks)
  }

  const isActionPending = isValidating || isSuspending || isExcluding

  const columns: Column<TontineMembre>[] = [
    {
      key: 'userFullName',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.userFullName}</span>,
    },
    { key: 'userEmail', header: 'Email' },
    { key: 'userPhone', header: 'Téléphone' },
    { key: 'ordreJackpot', header: 'Ordre Jackpot' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const variants: Record<MemberStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
          EN_ATTENTE: 'warning',
          ACTIF: 'success',
          SUSPENDU: 'warning',
          EXCLU: 'error',
        }
        return <Badge variant={variants[row.statut]}>{row.statut}</Badge>
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.statut === MemberStatus.EN_ATTENTE && (
            <Button
              variant="secondary"
              size="sm"
              title="Valider"
              onClick={() => setAction({ type: 'validate', memberId: row.id, memberName: row.userFullName || '' })}
            >
              <UserCheck size={16} />
            </Button>
          )}
          {row.statut === MemberStatus.ACTIF && (
            <Button
              variant="secondary"
              size="sm"
              title="Suspendre"
              onClick={() => setAction({ type: 'suspend', memberId: row.id, memberName: row.userFullName || '' })}
            >
              <UserMinus size={16} />
            </Button>
          )}
          {row.statut !== MemberStatus.EXCLU && (
            <Button
              variant="danger"
              size="sm"
              title="Exclure"
              onClick={() => setAction({ type: 'exclude', memberId: row.id, memberName: row.userFullName || '' })}
            >
              <UserX size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const confirmConfig = action
    ? {
        validate: {
          title: 'Valider ce membre ?',
          message: `Confirmer la validation de ${action.memberName} dans cette tontine.`,
          isDangerous: false,
          confirmText: 'Valider',
        },
        suspend: {
          title: 'Suspendre ce membre ?',
          message: `${action.memberName} sera suspendu et ne pourra plus participer temporairement.`,
          isDangerous: true,
          confirmText: 'Suspendre',
        },
        exclude: {
          title: 'Exclure ce membre ?',
          message: `${action.memberName} sera définitivement exclu de cette tontine. Cette action est irréversible.`,
          isDangerous: true,
          confirmText: 'Exclure',
        },
      }[action.type]
    : null

  return (
    <AppLayout>
      <PageHeader
        title="Membres"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={20} />
            Ajouter un membre
          </Button>
        }
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={members}
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
            <Button variant="ghost" onClick={() => { reset(); setIsAddOpen(false) }} disabled={isAdding}>
              Annuler
            </Button>
            <Button form="add-member-form" type="submit" loading={isAdding}>
              Ajouter
            </Button>
          </div>
        }
      >
        <form id="add-member-form" onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          <Input
            label="ID utilisateur"
            placeholder="Identifiant de l'utilisateur"
            error={errors.userId?.message}
            {...register('userId')}
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
          isDangerous={confirmConfig.isDangerous}
          isLoading={isActionPending}
        />
      )}
    </AppLayout>
  )
}
