import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUpdateCotisation } from '@/hooks/useCotisations'
import { UpdateCotisationRequest } from '@/types/cotisation'

const schema = z.object({
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.string().min(1, 'Méthode requise'),
  referenceTransaction: z.string().optional(),
  note: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export interface EditCotisationInitialValues {
  montant: number
  methodePaiement: string
  referenceTransaction?: string | null
  note?: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
  tontineId: string
  cotisationId: string
  membreNom: string
  initialValues: EditCotisationInitialValues
}

export function AdminEditCotisationModal({
  isOpen,
  onClose,
  tontineId,
  cotisationId,
  membreNom,
  initialValues,
}: Props) {
  const { mutate: updateCotisation, isPending } = useUpdateCotisation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (isOpen) {
      reset({
        montant: initialValues.montant,
        methodePaiement: initialValues.methodePaiement,
        referenceTransaction: initialValues.referenceTransaction ?? '',
        note: initialValues.note ?? '',
      })
    }
  }, [isOpen, initialValues, reset])

  const onSubmit = (data: FormData) => {
    // Strict PATCH: compare avec les valeurs initiales, n'envoyer que les champs modifiés
    const payload: UpdateCotisationRequest = {}

    if (data.montant !== initialValues.montant) payload.montant = data.montant
    if (data.methodePaiement !== initialValues.methodePaiement) payload.methodePaiement = data.methodePaiement

    const newRef = data.referenceTransaction?.trim() || undefined
    const origRef = initialValues.referenceTransaction?.trim() || undefined
    if (newRef !== origRef) payload.referenceTransaction = newRef

    const newNote = data.note?.trim() || undefined
    const origNote = initialValues.note?.trim() || undefined
    if (newNote !== origNote) payload.note = newNote

    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    updateCotisation(
      { tontineId, cotisationId, request: payload },
      {
        onSuccess: () => {
          toast.success('Cotisation mise à jour avec succès')
          onClose()
        },
        onError: (err: unknown) => {
          let msg = 'Erreur lors de la mise à jour'
          if (isAxiosError(err) && err.response?.data?.message) {
            msg = err.response.data.message
          }
          toast.error(msg)
        },
      }
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier la cotisation — ${membreNom}`}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button form="edit-cotisation-form" type="submit" loading={isPending}>
            Enregistrer les modifications
          </Button>
        </div>
      }
    >
      <form id="edit-cotisation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Montant (FCFA)"
          type="number"
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
