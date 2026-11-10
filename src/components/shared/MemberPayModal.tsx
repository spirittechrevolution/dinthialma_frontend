/**
 * MemberPayModal — Déclarer un paiement (vue Membre)
 *
 * Modal standalone extraite de MesCotisationsPage.
 * Utilisée par MobileQuickActions pour un accès en 1 clic.
 */

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useRecordCotisation } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { TontineStatut } from '@/types/common'
import { CheckCircle, Lock } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  tontineId: z.string().min(1, 'Sélectionnez une tontine'),
  cycleId: z.string().min(1, 'Sélectionnez un cycle'),
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.string().min(1, 'Sélectionnez une méthode'),
  referenceTransaction: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Méthodes visuelles ───────────────────────────────────────────────────────

const METHODES = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { value: 'WAVE',         label: 'Wave',         emoji: '🔵', color: 'border-blue-400 bg-blue-50'    },
  { value: 'FREE_MONEY',   label: 'Free Money',   emoji: '🟢', color: 'border-green-400 bg-green-50'  },
  { value: 'CASH',         label: 'Espèces',      emoji: '💵', color: 'border-neutral-300 bg-neutral-50' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface MemberPayModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pré-sélectionne une tontine (ex: quand ouvert depuis une page tontine) */
  tontineId?: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function MemberPayModal({ isOpen, onClose, tontineId: preselectedTontineId }: MemberPayModalProps) {
  const [selectedMethode, setSelectedMethode] = useState('')
  const [selectedTontineId, setSelectedTontineId] = useState(preselectedTontineId || '')

  const { data: tontinesData } = useTontines(0, 50)
  const tontines = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)

  const { data: cyclesData } = useCycles(selectedTontineId, 0, 50)
  const cycles = (cyclesData?.content || []).filter((c) => c.statut === 'EN_COURS')

  const { mutate: recordCotisation, isPending } = useRecordCotisation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedTontineId = watch('tontineId')

  // Synchronise le state local pour charger les cycles
  useEffect(() => {
    if (watchedTontineId && watchedTontineId !== selectedTontineId) {
      setSelectedTontineId(watchedTontineId)
      setValue('cycleId', '')
    }
  }, [watchedTontineId, selectedTontineId, setValue])

  // Pré-sélectionne la tontine à l'ouverture :
  // priorité au tontineId passé en prop, sinon première tontine active
  useEffect(() => {
    if (!isOpen || tontines.length === 0 || watchedTontineId) return
    const targetId = preselectedTontineId || tontines[0].id
    const target = tontines.find((t) => t.id === targetId) || tontines[0]
    setValue('tontineId', target.id)
    setSelectedTontineId(target.id)
    setValue('montant', target.montant)
  }, [isOpen, tontines, watchedTontineId, preselectedTontineId, setValue])

  // Pré-sélectionne le cycle en cours dès qu'il est chargé
  useEffect(() => {
    if (cycles.length > 0) {
      setValue('cycleId', cycles[0].id)
    }
  }, [cycles, setValue])

  const handleClose = () => {
    reset()
    setSelectedMethode('')
    setSelectedTontineId('')
    onClose()
  }

  const onSubmit = (data: FormData) => {
    recordCotisation(
      {
        tontineId: data.tontineId,
        request: {
          cycleId: data.cycleId,
          montant: data.montant,
          methodePaiement: data.methodePaiement,
          referenceTransaction: data.referenceTransaction || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Paiement déclaré — en attente de validation par l\'admin')
          handleClose()
        },
        onError: () => toast.error('Erreur lors de la déclaration'),
      }
    )
  }

  // Tontine sélectionnée pour afficher le montant
  const currentTontine = tontines.find((t) => t.id === watchedTontineId) || tontines[0]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Payer ma cotisation"
      size="md"
      footer={
        <div className="space-y-3">
          <Button
            form="member-pay-form"
            type="submit"
            className="w-full"
            size="lg"
            loading={isPending}
          >
            Déclarer le paiement
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Lock size={11} /> Déclaration sécurisée
          </div>
        </div>
      }
    >
      <form id="member-pay-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Montant mis en avant */}
        {currentTontine && (
          <div className="text-center py-4 border-b border-neutral-100">
            <p className="text-xs text-neutral-400 mb-1">Montant de la cotisation</p>
            <p className="text-4xl font-extrabold text-neutral-900">
              {currentTontine.montant.toLocaleString('fr-FR')}
              <span className="text-lg font-bold text-neutral-400 ml-2">FCFA</span>
            </p>
          </div>
        )}

        {/* Tontine — masqué si une seule */}
        {tontines.length > 1 && (
          <Select
            label="Tontine"
            error={errors.tontineId?.message}
            options={[
              { value: '', label: 'Sélectionnez une tontine' },
              ...tontines.map((t) => ({ value: t.id, label: t.nom })),
            ]}
            {...register('tontineId')}
          />
        )}

        {/* Cycle */}
        <Select
          label="Cycle en cours"
          error={errors.cycleId?.message}
          options={[
            {
              value: '',
              label: cycles.length ? 'Sélectionnez un cycle' : 'Aucun cycle en cours',
            },
            ...cycles.map((c) => ({ value: c.id, label: `Cycle ${c.numeroCycle}` })),
          ]}
          {...register('cycleId')}
        />

        {/* Méthode de paiement — visuelle */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Moyen de paiement</p>
          <div className="space-y-2">
            {METHODES.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMethode === m.value
                    ? m.color + ' border-opacity-100'
                    : 'border-neutral-100 bg-white'
                }`}
              >
                <input
                  type="radio"
                  value={m.value}
                  {...register('methodePaiement')}
                  onChange={(e) => {
                    setSelectedMethode(e.target.value)
                    setValue('methodePaiement', e.target.value)
                  }}
                  className="hidden"
                />
                <span className="text-xl">{m.emoji}</span>
                <span className="flex-1 text-sm font-semibold text-neutral-800">{m.label}</span>
                {selectedMethode === m.value && (
                  <CheckCircle size={18} className="text-primary-600" />
                )}
              </label>
            ))}
          </div>
          {errors.methodePaiement && (
            <p className="text-xs text-red-500 mt-1">{errors.methodePaiement.message}</p>
          )}
        </div>

        {/* Montant — pré-rempli mais modifiable */}
        <Input
          label="Montant (FCFA)"
          type="number"
          placeholder="5 000"
          error={errors.montant?.message}
          {...register('montant')}
        />

        {/* Référence */}
        <Input
          label="Référence transaction (optionnel)"
          placeholder="Ex: 123456789"
          {...register('referenceTransaction')}
        />
      </form>
    </Modal>
  )
}
