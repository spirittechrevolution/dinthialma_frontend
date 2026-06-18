import { useState } from 'react'
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
import { useAuth } from '@/hooks/useAuth'
import { useCotisations, useRecordCotisation } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut, TontineStatut } from '@/types/common'
import { CheckCircle, Clock, AlertTriangle, Trophy, Plus, Lock } from 'lucide-react'

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
  const [isOpen, setIsOpen]       = useState(false)
  const [selectedTontineId, setSelectedTontineId] = useState('')
  const [selectedMethode, setSelectedMethode]     = useState('')

  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { data: tontinesData } = useTontines(0, 50)
  const tontines    = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)
  const firstTontineId = tontines[0]?.id || ''

  const { data: cotisationsData, isLoading } = useCotisations(firstTontineId, undefined, page, 20)
  // Requête dédiée aux stats : charge toutes les cotisations sans pagination
  const { data: allCotisationsData } = useCotisations(firstTontineId, undefined, 0, 200)
  const { data: cyclesData }         = useCycles(selectedTontineId, 0, 50)
  const { mutate: recordCotisation, isPending } = useRecordCotisation()

  // Pour un ADMIN/SUPER_ADMIN, l'API retourne toutes les cotisations → on filtre par phone normalisé.
  // Keycloak stocke "221XXXXXXXX", l'API stocke "7XXXXXXXX" → on retire l'indicatif.
  // Pour un MEMBER pur, l'API filtre déjà côté backend → pas de filtre client.
  const normalizePhone = (p: string) => p.replace(/^\+?221/, '')
  const myPhone        = normalizePhone(user?.phone || '')
  const rawPage        = cotisationsData?.content || []
  const rawAll         = allCotisationsData?.content || []
  const isAdminUser    = isAdmin() || isSuperAdmin()
  const cotisations    = isAdminUser ? rawPage.filter((c: Cotisation) => normalizePhone(c.membre.phone) === myPhone) : rawPage
  const allCotisations = isAdminUser ? rawAll.filter((c: Cotisation) => normalizePhone(c.membre.phone) === myPhone) : rawAll
  const totalPages     = cotisationsData?.totalPages || 1
  const cycles         = (cyclesData?.content || []).filter((c) => c.statut === 'EN_COURS')

  // Stats calculées sur l'ensemble des cotisations, pas seulement la page affichée
  const totalVerse     = allCotisations.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE).reduce((s: number, c: Cotisation) => s + c.montant, 0)
  const enAttenteCount = allCotisations.filter((c: Cotisation) => c.statut === CotisationStatut.EN_ATTENTE).length
  const jackpotVerse   = allCotisations.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE && c.montant > 50000)

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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Mes cotisations</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Historique de vos paiements.</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus size={14} className="mr-1" /> Payer
        </Button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-primary-600 rounded-2xl p-3 text-center">
          <p className="text-primary-200 text-[10px] mb-1">Total versé</p>
          <p className="text-white font-extrabold text-sm">{totalVerse.toLocaleString('fr-FR')}</p>
          <p className="text-primary-200 text-[10px]">FCFA</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-2xl p-3 text-center shadow-sm">
          <p className="text-neutral-400 text-[10px] mb-1">En attente</p>
          <p className="text-orange-500 font-extrabold text-sm">{enAttenteCount}</p>
          <p className="text-neutral-400 text-[10px]">cotisation{enAttenteCount > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
          <p className="text-amber-600 text-[10px] mb-1">Jackpots</p>
          <p className="text-amber-700 font-extrabold text-sm">{jackpotVerse.length}</p>
          <p className="text-amber-500 text-[10px]">reçu{jackpotVerse.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Historique — style timeline */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-50">
          <p className="text-sm font-semibold text-neutral-900">Historique</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : cotisations.length === 0 ? (
          <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
        ) : (
          <div className="divide-y divide-neutral-50">
            {cotisations.map((c: Cotisation) => {
              const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.EN_ATTENTE
              const tontine = tontines.find((t) => t.id === firstTontineId)
              const isJackpot = c.montant > 50000
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                  {/* Icône statut */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {isJackpot ? <Trophy size={16} className="text-amber-600" /> : cfg.icon}
                  </div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {isJackpot ? 'Jackpot versé' : cfg.label}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {tontine?.nom || '—'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Montant */}
                  <p className={`text-sm font-bold flex-shrink-0 ${isJackpot ? 'text-amber-600' : c.statut === CotisationStatut.VALIDE ? 'text-primary-600' : c.statut === CotisationStatut.EN_RETARD ? 'text-red-500' : 'text-neutral-500'}`}>
                    {c.montant.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-neutral-50">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                {i + 1}
              </button>
            ))}
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
              {tontines[0]?.montant.toLocaleString('fr-FR') || '—'}
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
