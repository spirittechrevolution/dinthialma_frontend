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
import { Plus, RefreshCw, Calendar, Trophy } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMontant, formatDateCourte } from '@/lib/format'
import { ChipRow } from '@/components/ui/ChipRow'

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

const PAGE_SIZE = 12

export function CyclesPage() {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [cycleToClose, setCycleToClose] = useState<{ cycleId: string; tontineId: string } | null>(null)
  const [selectedTontineId, setSelectedTontineId] = useState('')
  const [page, setPage] = useState(0)

  const { data: tontinesData, isLoading: loadingTontines } = useTontines(0, 50)
  const tontines = tontinesData?.content || []

  const activeTontineId = selectedTontineId || tontines[0]?.id || ''
  const { data: cyclesData, isLoading: loadingCycles } = useCycles(activeTontineId, page, PAGE_SIZE)
  // L'API ne filtre pas par statut : on charge la liste complète (≤ 100 cycles, une tontine
  // ayant au plus 100 membres) uniquement pour épingler le cycle en cours en tête.
  const { data: allCyclesData } = useCycles(activeTontineId, 0, 100)
  const cycleEnCours = allCyclesData?.content.find((c: Cycle) => c.statut === CycleStatut.EN_COURS)
  const { mutate: openCycle, isPending: isOpening } = useOpenCycle()
  const { mutate: cloturerCycle, isPending: isClosing } = useCloturerCycle()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OpenCycleForm>({
    resolver: zodResolver(openCycleSchema),
    defaultValues: { tontineId: activeTontineId, numeroCycle: 1 },
  })

  const tontineNom = tontines.find((t) => t.id === activeTontineId)?.nom
  const withTontine = (c: Cycle): CycleWithTontine => ({ ...c, tontineNom, tontineId: activeTontineId })
  // Le cycle en cours est affiché à part, en tête : on l'exclut de la grille paginée
  const cycles: CycleWithTontine[] = (cyclesData?.content || [])
    .filter((c: Cycle) => c.id !== cycleEnCours?.id)
    .map(withTontine)

  const openModal = () => {
    // La tontine affichée est réellement présélectionnée dans le formulaire
    reset({ tontineId: activeTontineId, numeroCycle: (cyclesData?.totalElements ?? 0) + 1, dateDebut: '', dateFin: '' })
    setIsOpenModal(true)
  }

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

  // ─── Carte d'un cycle (le cycle en cours est mis en évidence) ──────────────
  const renderCycleCard = (cycle: CycleWithTontine) => {
    const enCours = cycle.statut === CycleStatut.EN_COURS
    return (
      <div
        key={cycle.id}
        className={
          enCours
            ? 'relative rounded-2xl border-2 border-primary-500 ring-4 ring-primary-100 bg-gradient-to-b from-primary-50 to-white p-4 sm:p-5'
            : 'bg-white rounded-2xl border border-neutral-100 p-4 sm:p-5'
        }
      >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enCours ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'}`}>
                <RefreshCw size={14} />
              </div>
              <div>
                <p className="font-bold text-neutral-900 text-sm">Cycle #{cycle.numeroCycle}</p>
                <p className="text-xs text-neutral-500">{cycle.tontineNom}</p>
              </div>
            </div>
            {enCours ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-600 text-white">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                </span>
                En cours
              </span>
            ) : (
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUT_COLORS[cycle.statut]}`}>
                {STATUT_LABELS[cycle.statut]}
              </span>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-4">
            <Calendar size={12} />
            <span>
              {formatDateCourte(cycle.dateDebut)} → {formatDateCourte(cycle.dateFin)}
            </span>
          </div>

          {/* Montants */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <p className="text-[11px] text-neutral-400 mb-1">Jackpot</p>
              <p className="font-bold text-neutral-900 text-sm">
                {cycle.montantJackpot ? formatMontant(cycle.montantJackpot) : '—'}
              </p>
              {cycle.montantJackpot && <p className="text-xs text-neutral-400">FCFA</p>}
            </div>
            <div className="text-center">
              <p className="text-[11px] text-neutral-400 mb-1">Commission</p>
              <p className="font-bold text-neutral-900 text-sm">
                {cycle.montantCommission ? formatMontant(cycle.montantCommission) : '—'}
              </p>
              {cycle.montantCommission && <p className="text-xs text-neutral-400">FCFA</p>}
            </div>
            <div className="text-center bg-primary-50 rounded-xl py-1">
              <p className="text-[11px] text-primary-600 mb-1">Net</p>
              <p className="font-bold text-primary-600 text-sm">
                {cycle.montantNet ? formatMontant(cycle.montantNet) : '—'}
              </p>
              {cycle.montantNet && <p className="text-xs text-primary-400">FCFA</p>}
            </div>
          </div>

          {/* Gagnants */}
          {cycle.gagnants && cycle.gagnants.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
              <Trophy size={14} className="text-amber-500 flex-shrink-0" />
              <span className="truncate">
                {cycle.gagnants.length === 1
                  ? <>{cycle.gagnants[0].firstName} {cycle.gagnants[0].lastName}</>
                  : <>{cycle.gagnants.map(g => g.firstName).join(', ')}</>
                }
              </span>
            </div>
          )}

          {/* Action */}
          {enCours && (
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
    )
  }

  if (loadingTontines) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        title="Cycles"
        description="Ouvrez et clôturez les cycles de cotisation."
        action={
          <Button onClick={openModal} disabled={!activeTontineId}>
            <Plus size={18} /> <span className="hidden sm:inline">Nouveau cycle</span><span className="sm:hidden">Nouveau</span>
          </Button>
        }
      />

      {/* Choix de la tontine */}
      {tontines.length > 1 && (
        <ChipRow className="mb-4">
          {tontines.map((t) => (
            <button
              aria-pressed={activeTontineId === t.id}
              key={t.id}
              onClick={() => { setSelectedTontineId(t.id); setPage(0) }}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTontineId === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      {/* Cycle en cours — épinglé en tête, quelle que soit la page */}
      {cycleEnCours && (
        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-neutral-900 mb-2 px-1">Cycle en cours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderCycleCard(withTontine(cycleEnCours))}
          </div>
        </section>
      )}

      {cycleEnCours && cycles.length > 0 && (
        <h2 className="text-[15px] font-bold text-neutral-900 mb-2 px-1">Autres cycles</h2>
      )}

      {/* Cards */}
      {loadingCycles ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : cycles.length === 0 && cycleEnCours ? null : cycles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 text-center py-16 px-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-3"><RefreshCw size={22} /></div>
          <p className="font-semibold text-neutral-900">Aucun cycle pour cette tontine</p>
          <p className="text-sm text-neutral-500 mt-1">Ouvrez le premier cycle pour commencer à collecter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cycles.map(renderCycleCard)}
        </div>
      )}

      {!loadingCycles && (
        <Pagination
          className="mt-4 px-0"
          page={page}
          totalPages={cyclesData?.totalPages ?? 1}
          totalElements={cyclesData?.totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      {/* Modal nouveau cycle */}
      <Modal
        isOpen={isOpenModal}
        onClose={() => { reset(); setIsOpenModal(false) }}
        title="Nouveau cycle"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { reset(); setIsOpenModal(false) }} disabled={isOpening}>Annuler</Button>
            <Button className="flex-1" form="open-cycle-form" type="submit" loading={isOpening}>Ouvrir le cycle</Button>
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
