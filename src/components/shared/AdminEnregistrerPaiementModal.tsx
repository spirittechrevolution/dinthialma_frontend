import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAdminRecordCotisation } from '@/hooks/useCotisations'

const schema = z.object({
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.string().min(1, 'Méthode requise'),
  referenceTransaction: z.string().optional(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  isOpen: boolean
  onClose: () => void
  tontineId: string
  cycleId: string
  membreId: string
  membreNom: string
  montantDefaut?: number
}

export function AdminEnregistrerPaiementModal({
  isOpen,
  onClose,
  tontineId,
  cycleId,
  membreId,
  membreNom,
  montantDefaut,
}: Props) {
  const { mutate: adminRecord, isPending } = useAdminRecordCotisation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { montant: montantDefaut, methodePaiement: 'CASH' },
  })

  useEffect(() => {
    if (isOpen) reset({ montant: montantDefaut, methodePaiement: 'CASH' })
  }, [isOpen, montantDefaut, reset])

  const onSubmit = (data: FormData) => {
    adminRecord(
      {
        tontineId,
        request: {
          membreId,
          cycleId,
          montant: data.montant,
          methodePaiement: data.methodePaiement || undefined,
          referenceTransaction: data.referenceTransaction || undefined,
          note: data.note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Cotisation enregistrée et validée. Le membre a été notifié.')
          reset()
          onClose()
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Erreur lors de l'enregistrement"
          toast.error(msg)
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enregistrer un paiement — ${membreNom}`}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button form="admin-paiement-form" type="submit" loading={isPending}>
            Enregistrer
          </Button>
        </div>
      }
    >
      <p className="text-sm text-neutral-500 mb-4">
        La cotisation sera créée directement{' '}
        <span className="font-semibold text-primary-600">validée</span> et le membre recevra une
        notification WhatsApp.
      </p>
      <form id="admin-paiement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Montant (FCFA)"
          type="number"
          placeholder="5000"
          error={errors.montant?.message}
          {...register('montant')}
        />
        <Select
          label="Méthode de paiement"
          options={[
            { value: 'CASH', label: 'Espèces' },
            { value: 'WAVE', label: 'Wave' },
            { value: 'ORANGE_MONEY', label: 'Orange Money' },
            { value: 'FREE_MONEY', label: 'Free Money' },
          ]}
          error={errors.methodePaiement?.message}
          {...register('methodePaiement')}
        />
        <Input
          label="Référence transaction (optionnel)"
          placeholder="REF-0001"
          {...register('referenceTransaction')}
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Note (optionnel)
          </label>
          <textarea
            {...register('note')}
            rows={2}
            placeholder="Notes supplémentaires..."
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </form>
    </Modal>
  )
}
