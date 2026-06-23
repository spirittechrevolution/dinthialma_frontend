import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { useCycles, useOpenCycle, useCloturerCycle } from '@/hooks/useCycles'
import { Cycle } from '@/types/cycle'
import { CycleStatut } from '@/types/common'
import { Plus, RefreshCw, Calendar, User, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const openCycleSchema = z.object({
  tontineId: z.string().min(1, 'Requis'),
  numeroCycle: z.coerce.number().int().positive('Requis'),
  dateDebut: z.string().min(1, 'Requis'),
  dateFin: z.string().min(1, 'Requis'),
})
type OpenCycleForm = z.infer<typeof openCycleSchema>

const STATUT_LABELS: Record<CycleStatut, string> = {
  EN_ATTENTE: 'Ouvert',
  EN_COURS: 'En Cours',
  TERMINE: 'Versé',
}

const STATUT_COLORS: Record<CycleStatut, string> = {
  EN_ATTENTE: 'bg-primary-100 text-primary-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-purple-100 text-purple-700',
}

type CycleWithTontine = Cycle & { tontineNom?: string; tontineId?: string }

export function CyclesPage() {
  const navigate = useNavigate()
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [cycleToClose, setCycleToClose] = useState<{ cycleId: string; tontineId: string } | null>(null)
  const [selectedTontineId, setSelectedTontineId] = useState('')

  const { data: tontinesData, isLoading: loadingTontines } = useTontines(0, 50)
  const tontines = tontinesData?.content || []

  const activeTontineId = selectedTontineId || tontines[0]?.id || ''
  const { data: cyclesData, isLoading: loadingCycles } = useCycles(activeTontineId, 0, 50)
  const { mutate: openCycle, isPending: isOpening } = useOpenCycle()
  const { mutate: cloturerCycle, isPending: isClosing } = useCloturerCycle()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OpenCycleForm>({
    resolver: zodResolver(openCycleSchema),
    defaultValues: { tontineId: activeTontineId, numeroCycle: 1 },
  })

  const CYCLE_ORDER: Record<CycleStatut, number> = { EN_COURS: 0, EN_ATTENTE: 1, TERMINE: 2 }

  const cycles: CycleWithTontine[] = (cyclesData?.content || [])
    .map((c: Cycle) => ({
      ...c,
      tontineNom: tontines.find((t) => t.id === activeTontineId)?.nom,
      tontineId: activeTontineId,
    }))
    .sort((a, b) => (CYCLE_ORDER[a.statut] ?? 3) - (CYCLE_ORDER[b.statut] ?? 3))

  const onOpenSubmit = (data: OpenCycleForm) => {
    openCycle(
      {
        tontineId: data.tontineId,
        request: {
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
        },
      },
      {
        onSuccess: () => { toast.success('Cycle ouvert'); reset(); setIsOpenModal(false) },
        onError: () => toast.error("Erreur lors de l'ouverture du cycle"),
      }
    )
  }

  const handleCloturer = () => {
    if (!cycleToClose) return
    cloturerCycle(
      { tontineId: cycleToClose.tontineId, cycleId: cycleToClose.cycleId },
      {
        onSuccess: () => { toast.success('Cycle clôturé avec succès'); setCycleToClose(null) },
        onError: () => toast.error('Erreur lors de la clôture'),
      }
    )
  }

  if (loadingTontines) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Cycles</h1>
          <p className="text-sm text-neutral-500 mt-1">Ouvrez et clôturez les cycles de cotisation.</p>
        </div>
        <Button size="sm" onClick={() => setIsOpenModal(true)} className="self-start sm:self-auto">
          <Plus size={16} className="mr-1" /> Nouveau cycle
        </Button>
      </div>

      {/* Filter par tontine */}
      {tontines.length > 1 && (
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          {tontines.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTontineId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTontineId === t.id ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200 shadow-sm'
              }`}
            >
              {t.nom}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      {loadingCycles ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p>Aucun cycle pour cette tontine</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cycles.map((cycle) => (
            <div key={cycle.id} className={`bg-white rounded-2xl shadow-sm p-5 ${
              cycle.statut === CycleStatut.EN_COURS
                ? 'border-2 border-primary-400 ring-2 ring-primary-50'
                : 'border border-neutral-100'
            }`}>
              {/* Bandeau cycle en cours */}
              {cycle.statut === CycleStatut.EN_COURS && (
                <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 bg-primary-50 rounded-lg w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-xs font-semibold text-primary-700">Cycle en cours</span>
                </div>
              )}
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                    <RefreshCw size={14} />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 text-sm">Cycle #{cycle.numeroCycle}</p>
                    <p className="text-xs text-neutral-500">{cycle.tontineNom}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_COLORS[cycle.statut]}`}>
                  {STATUT_LABELS[cycle.statut]}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-4">
                <Calendar size={12} />
                <span>
                  {new Date(cycle.dateDebut).toLocaleDateString('fr-FR')} → {new Date(cycle.dateFin).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {/* Montants */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Jackpot</p>
                  <p className="font-bold text-neutral-900 text-sm">
                    {cycle.montantJackpot ? cycle.montantJackpot.toLocaleString('fr-FR') : '—'}
                  </p>
                  {cycle.montantJackpot && <p className="text-xs text-neutral-400">FCFA</p>}
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Commission</p>
                  <p className="font-bold text-neutral-900 text-sm">
                    {cycle.montantCommission ? `${cycle.montantCommission.toLocaleString('fr-FR')}` : '—'}
                  </p>
                  {cycle.montantCommission && <p className="text-xs text-neutral-400">FCFA</p>}
                </div>
                <div className="text-center bg-primary-50 rounded-xl py-1">
                  <p className="text-xs text-primary-500 uppercase tracking-wide mb-1">Net</p>
                  <p className="font-bold text-primary-600 text-sm">
                    {cycle.montantNet ? cycle.montantNet.toLocaleString('fr-FR') : '—'}
                  </p>
                  {cycle.montantNet && <p className="text-xs text-primary-400">FCFA</p>}
                </div>
              </div>

              {/* Gagnants */}
              {cycle.gagnants && cycle.gagnants.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                  <User size={14} className="text-neutral-400 flex-shrink-0" />
                  <span className="truncate">
                    {cycle.gagnants.length === 1
                      ? <>{cycle.gagnants[0].firstName} {cycle.gagnants[0].lastName}</>
                      : <>{cycle.gagnants.map(g => g.firstName).join(', ')}</>
                    }
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {cycle.statut !== CycleStatut.EN_ATTENTE && (
                  <button
                    onClick={() => navigate('/admin/cotisations', { state: { tontineId: cycle.tontineId, cycleId: cycle.id } })}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    <List size={12} /> Voir les cotisations
                  </button>
                )}
                {cycle.statut === CycleStatut.EN_COURS && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setCycleToClose({ cycleId: cycle.id, tontineId: cycle.tontineId! })}
                  >
                    Clôturer ce cycle
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nouveau cycle */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => { reset(); setIsOpenModal(false) }}
        title="Nouveau cycle"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { reset(); setIsOpenModal(false) }} disabled={isOpening}>Annuler</Button>
            <Button form="open-cycle-form" type="submit" loading={isOpening}>Ouvrir le cycle</Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-500 mb-4">Ouvrez un nouveau cycle de cotisation.</p>
        <form id="open-cycle-form" onSubmit={handleSubmit(onOpenSubmit)} className="space-y-4">
          <Select
            label="Tontine"
            error={errors.tontineId?.message}
            options={tontines.map((t) => ({ value: t.id, label: t.nom }))}
            {...register('tontineId')}
          />
          <Input
            label="Numéro de cycle"
            type="number"
            placeholder="1"
            error={errors.numeroCycle?.message}
            {...register('numeroCycle')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début" type="date" error={errors.dateDebut?.message} {...register('dateDebut')} />
            <Input label="Date de fin" type="date" error={errors.dateFin?.message} {...register('dateFin')} />
          </div>
        </form>
      </Modal>

      {/* Confirmation clôture */}
      <ConfirmDialog
        isOpen={!!cycleToClose}
        onClose={() => setCycleToClose(null)}
        onConfirm={handleCloturer}
        title="Clôturer ce cycle ?"
        message="Le jackpot sera calculé, les commissions déduites et les cotisations EN_ATTENTE marquées EN_RETARD."
        confirmText="Clôturer"
        isDangerous
        isLoading={isClosing}
      />
    </AppLayout>
  )
}
