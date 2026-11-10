import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMontant, formatDateHeure } from '@/lib/format'
import { useCotisations, useRecordCotisation } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut, TontineStatut } from '@/types/common'
import { CheckCircle, Clock, AlertTriangle, Plus, Lock } from 'lucide-react'
import { ChipRow } from '@/components/ui/ChipRow'

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  tontineId:            z.string().min(1, 'Sélectionnez une tontine'),
  cycleId:              z.string().min(1, 'Sélectionnez un cycle'),
  montant:              z.coerce.number().positive('Montant invalide'),
  methodePaiement:      z.string().min(1, 'Sélectionnez une méthode'),
  referenceTransaction: z.string().optional(),
  note:                 z.string().optional(),
})
type FormData = z.infer<typeof schema>

// ─── Config icônes par statut ─────────────────────────────────────────────────
const STATUT_CONFIG: Record<CotisationStatut, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  VALIDE:     { icon: <CheckCircle size={16} />, color: 'text-primary-600', bg: 'bg-primary-50',  label: 'Validée'   },
  EN_ATTENTE: { icon: <Clock size={16} />,       color: 'text-orange-500',  bg: 'bg-orange-50',   label: 'En attente' },
  EN_RETARD:  { icon: <AlertTriangle size={16}/>, color: 'text-red-500',    bg: 'bg-red-50',      label: 'En retard'  },
}

// ─── Méthodes de paiement visuelles ───────────────────────────────────────────
const METHODES = [
  { value: 'ORANGE_MONEY', label: 'Orange Money', emoji: '🟠', color: 'border-orange-400 bg-orange-50' },
  { value: 'WAVE',         label: 'Wave',         emoji: '🔵', color: 'border-blue-400 bg-blue-50'   },
  { value: 'FREE_MONEY',   label: 'Free Money',   emoji: '🟢', color: 'border-green-400 bg-green-50' },
  { value: 'CASH',         label: 'Espèces',      emoji: '💵', color: 'border-neutral-300 bg-neutral-50' },
]

export function MesCotisationsPage() {
  const [page, setPage]           = useState(0)
  const location = useLocation()
  // Ouverture directe du formulaire depuis le bouton « Payer » de l'accueil
  const [isOpen, setIsOpen]       = useState(() => !!(location.state as { openPay?: boolean } | null)?.openPay)
  const [selectedTontineId, setSelectedTontineId] = useState('')
  const [selectedMethode, setSelectedMethode]     = useState('')

  const [listTontineId, setListTontineId] = useState('')

  const { data: tontinesData } = useTontines(0, 50)
  const tontines    = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)
  const historyTontineId = listTontineId || tontines[0]?.id || ''
  const historyTontine = tontines.find((t) => t.id === historyTontineId)

  const { data: cotisationsData, isLoading } = useCotisations(historyTontineId, undefined, page, 20)
  const { data: cyclesData }   = useCycles(selectedTontineId, 0, 50)
  const { mutate: recordCotisation, isPending } = useRecordCotisation()

  const cotisations = cotisationsData?.content || []
  const totalPages  = cotisationsData?.totalPages || 1
  const cycles      = (cyclesData?.content || []).filter((c) => c.statut === 'EN_COURS')


  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedTontineId = watch('tontineId')
  if (watchedTontineId && watchedTontineId !== selectedTontineId) {
    setSelectedTontineId(watchedTontineId)
    setValue('cycleId', '')
    const t = tontines.find((x) => x.id === watchedTontineId)
    if (t && !t.montantLibre) setValue('montant', t.montant)
  }
  const payTontine = tontines.find((t) => t.id === watchedTontineId)

  // À l'ouverture (y compris depuis « Payer » de l'accueil), présélectionner la tontine affichée
  useEffect(() => {
    if (isOpen && !watchedTontineId && historyTontineId) setValue('tontineId', historyTontineId)
  }, [isOpen, watchedTontineId, historyTontineId, setValue])

  // Un seul cycle en cours → le présélectionner
  useEffect(() => {
    if (isOpen && cycles.length === 1 && !watch('cycleId')) setValue('cycleId', cycles[0].id)
  }, [isOpen, cycles, setValue, watch])

  const onSubmit = (data: FormData) => {
    recordCotisation(
      { tontineId: data.tontineId, request: { cycleId: data.cycleId, montant: data.montant, methodePaiement: data.methodePaiement, referenceTransaction: data.referenceTransaction, note: data.note } },
      {
        onSuccess: () => { toast.success('Paiement déclaré — en attente de validation'); reset(); setSelectedMethode(''); setIsOpen(false) },
        onError: () => toast.error('Erreur lors de la déclaration'),
      }
    )
  }

  const handleClose = () => { reset(); setSelectedMethode(''); setIsOpen(false) }

  return (
    <AppLayout>
      <PageHeader
        title="Mes cotisations"
        description="Historique de vos paiements."
        action={
          <Button onClick={() => setIsOpen(true)} disabled={tontines.length === 0}>
            <Plus size={18} /> Payer
          </Button>
        }
      />

      {/* Choix de la tontine (si plusieurs) */}
      {tontines.length > 1 && (
        <ChipRow className="mb-3">
          {tontines.map((t) => (
            <button
              aria-pressed={historyTontineId === t.id}
              key={t.id}
              onClick={() => { setListTontineId(t.id); setPage(0) }}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                historyTontineId === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      {/* Historique — style timeline */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">{historyTontine?.nom || 'Historique'}</p>
          {cotisationsData && <p className="text-xs text-neutral-500">{cotisationsData.totalElements} paiement{cotisationsData.totalElements > 1 ? 's' : ''}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : cotisations.length === 0 ? (
          <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
        ) : (
          <div className="divide-y divide-neutral-50">
            {cotisations.map((c: Cotisation) => {
              const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.EN_ATTENTE
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{cfg.label}</p>
                    <p className="text-xs text-neutral-500 truncate">{formatDateHeure(c.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-bold tabular flex-shrink-0 ${c.statut === CotisationStatut.VALIDE ? 'text-neutral-900' : c.statut === CotisationStatut.EN_RETARD ? 'text-red-600' : 'text-neutral-500'}`}>
                    {formatMontant(c.montant)} F
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-neutral-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={cotisationsData?.totalElements}
              pageSize={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ── Modal paiement — style écran 7 ─────────────────────── */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Payer ma cotisation"
        size="md"
        footer={
          <div className="space-y-3">
            <Button form="declare-form" type="submit" className="w-full" size="lg" loading={isPending}>
              Payer maintenant
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
              <Lock size={11} /> Paiement sécurisé
            </div>
          </div>
        }
      >
        <form id="declare-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Montant en gros */}
          <div className="text-center py-4 border-b border-neutral-100">
            <p className="text-xs text-neutral-400 mb-1">Montant à payer</p>
            <p className="text-4xl font-extrabold text-neutral-900">
              {payTontine && !payTontine.montantLibre ? formatMontant(payTontine.montant) : '—'}
              <span className="text-lg font-bold text-neutral-400 ml-2">FCFA</span>
            </p>
          </div>

          <Select
            label="Tontine"
            error={errors.tontineId?.message}
            options={[{ value: '', label: 'Sélectionnez une tontine' }, ...tontines.map((t) => ({ value: t.id, label: t.nom }))]}
            {...register('tontineId')}
          />

          <Select
            label="Cycle en cours"
            error={errors.cycleId?.message}
            options={[{ value: '', label: cycles.length ? 'Sélectionnez un cycle' : 'Aucun cycle en cours' }, ...cycles.map((c) => ({ value: c.id, label: `Cycle ${c.numeroCycle}` }))]}
            {...register('cycleId')}
          />

          {/* Méthodes visuelles */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-2">Choisir un moyen de paiement</p>
            <div className="space-y-2">
              {METHODES.map((m) => (
                <label key={m.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedMethode === m.value ? m.color + ' border-opacity-100' : 'border-neutral-100 bg-white'}`}>
                  <input type="radio" value={m.value} {...register('methodePaiement')}
                    onChange={(e) => { setSelectedMethode(e.target.value); setValue('methodePaiement', e.target.value) }}
                    className="hidden" />
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

          <Input
            label="Montant (FCFA)"
            type="number"
            placeholder="5 000"
            error={errors.montant?.message}
            {...register('montant')}
          />

          <Input
            label="Référence (optionnel)"
            placeholder="Ex: 123456789"
            {...register('referenceTransaction')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
