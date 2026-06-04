import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { useCotisations, useRecordCotisation } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { useCodeList } from '@/hooks/useCodeList'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut, TontineStatut } from '@/types/common'
import { Plus } from 'lucide-react'

const schema = z.object({
  tontineId: z.string().min(1, 'Sélectionnez une tontine'),
  cycleId: z.string().min(1, 'Sélectionnez un cycle'),
  montant: z.coerce.number().positive('Montant invalide'),
  methodePaiement: z.string().min(1, 'Sélectionnez une méthode'),
  referenceTransaction: z.string().optional(),
  note: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const STATUT_BADGE: Record<CotisationStatut, 'success' | 'warning' | 'error' | 'default'> = {
  VALIDE: 'success',
  EN_ATTENTE: 'default',
  EN_RETARD: 'error',
}

const STATUT_LABEL: Record<CotisationStatut, string> = {
  VALIDE: 'Validée',
  EN_ATTENTE: 'En Attente',
  EN_RETARD: 'Retard',
}

const METHODE_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
}

export function MesCotisationsPage() {
  const [page, setPage] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTontineId, setSelectedTontineId] = useState('')

  const { data: tontinesData } = useTontines(0, 50)
  const tontines = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)
  const firstTontineId = tontines[0]?.id || ''

  const { data: cotisationsData, isLoading } = useCotisations(firstTontineId, undefined, page, 20)
  const { data: cyclesData } = useCycles(selectedTontineId, 0, 50)
  const { data: methodesPaiement = [] } = useCodeList('METHODE_PAIEMENT')
  const { mutate: recordCotisation, isPending } = useRecordCotisation()

  const cotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1
  const cycles = (cyclesData?.content || []).filter((c) => c.statut === 'EN_COURS')

  const totalVerse = cotisations
    .filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE)
    .reduce((s: number, c: Cotisation) => s + c.montant, 0)
  const enAttenteCount = cotisations.filter((c: Cotisation) => c.statut === CotisationStatut.EN_ATTENTE).length

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedTontineId = watch('tontineId')
  if (watchedTontineId && watchedTontineId !== selectedTontineId) {
    setSelectedTontineId(watchedTontineId)
    setValue('cycleId', '')
  }

  const onSubmit = (data: FormData) => {
    recordCotisation(
      {
        tontineId: data.tontineId,
        request: {
          cycleId: data.cycleId,
          montant: data.montant,
          methodePaiement: data.methodePaiement,
          referenceTransaction: data.referenceTransaction,
          note: data.note,
        },
      },
      {
        onSuccess: () => { toast.success("Paiement déclaré — en attente de validation"); reset(); setIsOpen(false) },
        onError: () => toast.error('Erreur lors de la déclaration du paiement'),
      }
    )
  }

  const handleClose = () => { reset(); setIsOpen(false) }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mes cotisations</h1>
          <p className="text-sm text-neutral-500 mt-1">Historique de mes paiements et déclarations.</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)} className="self-start sm:self-auto">
          <Plus size={16} className="mr-1" /> Déclarer un paiement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <p className="text-xs text-neutral-500 mb-1">Total versé</p>
          <p className="text-2xl font-bold text-primary-600">{totalVerse.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <p className="text-xs text-neutral-500 mb-1">En attente de validation</p>
          <p className="text-2xl font-bold text-neutral-900">{enAttenteCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <p className="text-xs text-neutral-500 mb-1">Prochaine échéance</p>
          <p className="text-sm font-semibold text-neutral-900">
            {tontines[0] ? `Demain · ${tontines[0].montant.toLocaleString('fr-FR')} FCFA` : '—'}
          </p>
        </div>
      </div>

      {/* Table desktop / Cards mobile */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">

        {/* Cards — mobile uniquement */}
        <div className="md:hidden divide-y divide-neutral-50">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : cotisations.length === 0 ? (
            <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
          ) : (
            cotisations.map((c: Cotisation) => {
              const tontine = tontines.find((t) => t.id === firstTontineId)
              return (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 truncate">{tontine?.nom || '—'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}
                      {' · '}
                      {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-bold text-sm text-neutral-900">{c.montant.toLocaleString('fr-FR')} FCFA</p>
                    <Badge variant={STATUT_BADGE[c.statut]}>{STATUT_LABEL[c.statut]}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Table — desktop uniquement */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Tontine', 'Montant', 'Méthode', 'Référence', 'Date', 'Statut'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10"><Spinner /></td></tr>
              ) : cotisations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-neutral-400">Aucune cotisation trouvée</td></tr>
              ) : (
                cotisations.map((c: Cotisation) => {
                  const tontine = tontines.find((t) => t.id === firstTontineId)
                  return (
                    <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-neutral-900">{tontine?.nom || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-neutral-900">{c.montant.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-5 py-4 text-neutral-600">{METHODE_LABELS[c.methodePaiement || ''] || c.methodePaiement || '—'}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs font-mono">{c.referenceTransaction || '—'}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUT_BADGE[c.statut]}>{STATUT_LABEL[c.statut] || c.statut}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-neutral-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal déclaration */}
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Déclarer un paiement"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>Annuler</Button>
            <Button form="declare-form" type="submit" loading={isPending}>Déclarer</Button>
          </div>
        }
      >
        <form id="declare-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Tontine"
            error={errors.tontineId?.message}
            options={[
              { value: '', label: 'Sélectionnez une tontine' },
              ...tontines.map((t) => ({ value: t.id, label: t.nom })),
            ]}
            {...register('tontineId')}
          />
          <Select
            label="Cycle en cours"
            error={errors.cycleId?.message}
            options={[
              { value: '', label: cycles.length ? 'Sélectionnez un cycle' : 'Aucun cycle en cours' },
              ...cycles.map((c) => ({ value: c.id, label: `Cycle ${c.numeroCycle} (${new Date(c.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(c.dateFin).toLocaleDateString('fr-FR')})` })),
            ]}
            {...register('cycleId')}
          />
          <Input
            label="Montant (FCFA)"
            type="number"
            placeholder="5000"
            error={errors.montant?.message}
            {...register('montant')}
          />
          <Select
            label="Méthode de paiement"
            error={errors.methodePaiement?.message}
            options={[
              { value: '', label: 'Sélectionnez une méthode' },
              ...methodesPaiement.map((m) => ({ value: m.value, label: m.description })),
            ]}
            {...register('methodePaiement')}
          />
          <Input
            label="Référence de transaction (optionnel)"
            placeholder="WAVE-TXN-20240701-XYZ123"
            {...register('referenceTransaction')}
          />
          <Input
            label="Note (optionnel)"
            placeholder="Informations supplémentaires..."
            {...register('note')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
