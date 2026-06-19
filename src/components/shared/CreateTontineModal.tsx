import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { useCreateTontine } from '@/hooks/useTontines'
import { useCodeList } from '@/hooks/useCodeList'
import { TontineType, CreateTontineRequest } from '@/types/tontine'
import { ModeCycle } from '@/types/common'
import { RotateCcw, CalendarHeart, ChevronRight, ChevronLeft } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  tontineType:        z.enum(['ROTATIVE', 'EVENEMENTIELLE']),
  nom:                z.string().min(2, 'Au moins 2 caractères'),
  description:        z.string().optional(),
  frequence:          z.string().min(1, 'Requis'),
  dateDebut:          z.string().min(1, 'Requis'),
  // ROTATIVE
  ordreBeneficiaire:  z.string().optional(),
  modeCycle:          z.nativeEnum(ModeCycle).optional(),
  montant:            z.coerce.number().optional(),
  nombreMembres:      z.coerce.number().optional(),
  nombreGagnants:     z.coerce.number().optional(),
  // EVENEMENTIELLE
  dateEcheance:       z.string().optional(),
  nomEvenement:       z.string().max(200).optional(),
  montantLibre:       z.boolean().optional(),
  montantMinimum:     z.coerce.number().optional(),
}).superRefine((d, ctx) => {
  if (d.tontineType === 'ROTATIVE') {
    if (!d.ordreBeneficiaire)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ordreBeneficiaire'], message: 'Requis' })
    if (!d.modeCycle)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['modeCycle'], message: 'Requis' })
    if (!d.montant || d.montant <= 0)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['montant'], message: 'Montant invalide' })
    if (!d.nombreMembres || d.nombreMembres < 2)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nombreMembres'], message: 'Min 2 membres' })
    if (!d.nombreGagnants || d.nombreGagnants < 1)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['nombreGagnants'], message: 'Min 1' })
  }
  if (d.tontineType === 'EVENEMENTIELLE') {
    if (!d.dateEcheance)
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateEcheance'], message: 'Requis' })
    if (!d.montantLibre && (!d.montant || d.montant <= 0))
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['montant'], message: 'Requis si montant fixe' })
  }
})

type FormData = z.infer<typeof schema>

interface CreateTontineModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

const STEP1_FIELDS: (keyof FormData)[] = ['nom', 'dateDebut']

export function CreateTontineModal({ isOpen, onClose, onCreated }: CreateTontineModalProps) {
  const [step, setStep] = useState(1)
  const { mutate: createTontine, isPending } = useCreateTontine()
  const { data: frequences = [] }         = useCodeList('FREQUENCE_TONTINE')
  const { data: ordresBeneficiaire = [] } = useCodeList('ORDRE_BENEFICIAIRE')

  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tontineType:    'ROTATIVE',
      modeCycle:      ModeCycle.AUTOMATIQUE,
      nombreMembres:  12,
      nombreGagnants: 1,
      montantLibre:   false,
    },
  })

  const today = new Date().toISOString().slice(0, 10)

  const tontineType    = watch('tontineType')
  const montantLibre   = watch('montantLibre')
  const nombreMembres  = watch('nombreMembres')
  const nombreGagnants = watch('nombreGagnants')
  const nbCycles = nombreMembres && nombreMembres > 0 && nombreGagnants && nombreGagnants > 0
    ? Math.ceil(Number(nombreMembres) / Number(nombreGagnants))
    : null

  useEffect(() => {
    if (!isOpen) {
      reset({
        tontineType: 'ROTATIVE', modeCycle: ModeCycle.AUTOMATIQUE,
        nombreMembres: 12, nombreGagnants: 1, montantLibre: false,
      })
      setStep(1)
    }
  }, [isOpen, reset])

  const handleNext = async () => {
    const valid = await trigger(STEP1_FIELDS)
    if (valid) setStep(2)
  }

  const onSubmit = (data: FormData) => {
    const payload: CreateTontineRequest = {
      tontineType: data.tontineType as TontineType,
      nom: data.nom,
      description: data.description,
      frequence: data.frequence,
      dateDebut: data.dateDebut,
    }
    if (data.tontineType === 'ROTATIVE') {
      payload.ordreBeneficiaire = data.ordreBeneficiaire
      payload.modeCycle         = data.modeCycle
      payload.montant           = data.montant
      payload.nombreMembres     = data.nombreMembres
      payload.nombreGagnants    = data.nombreGagnants
    } else {
      payload.dateEcheance   = data.dateEcheance
      payload.nomEvenement   = data.nomEvenement || undefined
      payload.montantLibre   = data.montantLibre ?? false
      payload.montant        = data.montantLibre ? undefined : data.montant
      payload.montantMinimum = data.montantLibre ? data.montantMinimum || undefined : undefined
    }

    createTontine(payload, {
      onSuccess: () => {
        toast.success('Tontine créée ! Reconnectez-vous pour accéder à votre espace admin.')
        onClose()
        onCreated?.()
      },
      onError: () => toast.error('Erreur lors de la création de la tontine'),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle tontine"
      size="md"
      footer={
        step === 1 ? (
          <div className="flex gap-3 justify-between w-full">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="button" onClick={handleNext}>
              Suivant <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 justify-between w-full">
            <Button variant="ghost" type="button" onClick={() => setStep(1)} disabled={isPending}>
              <ChevronLeft size={16} className="mr-1" /> Retour
            </Button>
            <Button form="create-tontine-shared" type="submit" loading={isPending}>Créer</Button>
          </div>
        )
      }
    >
      {/* ── Indicateur d'étapes ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              s === step
                ? 'bg-primary-600 text-white'
                : s < step
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-neutral-100 text-neutral-400'
            }`}>
              {s}
            </div>
            {s < 2 && <div className={`w-10 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-primary-400' : 'bg-neutral-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-xs text-neutral-400">
          {step === 1 ? 'Informations générales' : 'Configuration'}
        </span>
      </div>

      <form id="create-tontine-shared" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ ÉTAPE 1 ════════════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Sélecteur de type */}
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Type de tontine</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'ROTATIVE',       label: 'Rotative',       icon: <RotateCcw size={14} />,     desc: 'Jackpot tournant entre les membres' },
                  { value: 'EVENEMENTIELLE', label: 'Événementielle', icon: <CalendarHeart size={14} />, desc: 'Épargne collective vers un événement' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('tontineType', opt.value)}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      tontineType === opt.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span className={`mt-0.5 flex-shrink-0 ${tontineType === opt.value ? 'text-primary-600' : 'text-neutral-400'}`}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${tontineType === opt.value ? 'text-primary-700' : 'text-neutral-700'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4 space-y-3">
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
              <Input
                label="Date de début"
                type="date"
                max={today}
                error={errors.dateDebut?.message}
                {...register('dateDebut')}
              />
            </div>
          </>
        )}

        {/* ═══ ÉTAPE 2 ════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-3">
            <Select
              label={tontineType === 'EVENEMENTIELLE' ? 'Fréquence des rappels' : 'Fréquence'}
              error={errors.frequence?.message}
              options={frequences.map((f) => ({ value: f.value, label: f.description }))}
              {...register('frequence')}
            />

            {/* ── Champs ROTATIVE ──────────────────────────────────── */}
            {tontineType === 'ROTATIVE' && (
              <>
                <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <Input
                    label="Gagnants par cycle"
                    type="number"
                    placeholder="1"
                    error={errors.nombreGagnants?.message}
                    {...register('nombreGagnants')}
                  />
                  {nbCycles !== null && (
                    <p className="mt-1 text-xs font-semibold text-primary-600">
                      → {nbCycles} cycle{nbCycles > 1 ? 's' : ''} seront générés
                    </p>
                  )}
                </div>
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
              </>
            )}

            {/* ── Champs EVENEMENTIELLE ────────────────────────────── */}
            {tontineType === 'EVENEMENTIELLE' && (
              <>
                <Input
                  label="Date de l'événement"
                  type="date"
                  error={errors.dateEcheance?.message}
                  {...register('dateEcheance')}
                />
                <Input
                  label="Nom de l'événement (ex : Tabaski 2026)"
                  placeholder="Tabaski 2026, Korité, Mariage..."
                  {...register('nomEvenement')}
                />

                {/* Toggle montant libre */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">
                      {montantLibre ? 'Cotisation libre (chaque membre décide)' : 'Montant fixe imposé'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {montantLibre ? 'Chaque membre choisit son montant' : 'Même montant pour tous'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('montantLibre', !montantLibre)}
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      montantLibre ? 'bg-primary-600' : 'bg-neutral-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      montantLibre ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {!montantLibre && (
                  <Input
                    label="Montant fixe par période (FCFA)"
                    type="number"
                    placeholder="5000"
                    error={errors.montant?.message}
                    {...register('montant')}
                  />
                )}
                {montantLibre && (
                  <Input
                    label="Montant minimum par cotisation (facultatif)"
                    type="number"
                    placeholder="1000"
                    {...register('montantMinimum')}
                  />
                )}
              </>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
