import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { InitialsAvatar } from '@/components/ui/Section'
import { formatMontant, formatFCFA, formatDateCourte } from '@/lib/format'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
import { RecapCotisationsPanel } from '@/components/shared/RecapCotisationsPanel'
import { useAuth } from '@/hooks/useAuth'
import {
  useTontine,
  useActiverTontine,
  useSuspendreTontine,
  useCommissions,
  useCreateCommission,
  useDeleteCommission,
} from '@/hooks/useTontines'
import { useMembres, useUpdateMembreStatut, useRemoveMembre } from '@/hooks/useMembres'
import { useCycles, useOpenCycle, useCloturerCycle, useDesignerGagnants, useBeneficiairesHistorique } from '@/hooks/useCycles'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { Membre } from '@/types/membre'
import { Cycle, GagnantInfo, MembreDistributionInfo } from '@/types/cycle'
import { Cotisation } from '@/types/cotisation'
import { Commission, TontineType } from '@/types/tontine'
import {
  TontineStatut,
  CycleStatut,
  CotisationStatut,
  MembreStatut,
  ModeCycle,
  UserRole,
  AccountStatus,
} from '@/types/common'
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Calendar,
  Percent,
  Trash2,
  CheckCircle,
  UserMinus,
  UserCheck,
  Lock,
  Clock,
  Star,
  Shuffle,
  Trophy,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  CalendarHeart,
  Download,
  Send,
  Users,
} from 'lucide-react'
import { ChipRow } from '@/components/ui/ChipRow'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const openCycleSchema = z.object({
  numeroCycle: z.coerce.number().int().positive('Requis'),
  dateDebut: z.string().min(1, 'Requis'),
  dateFin: z.string().min(1, 'Requis'),
})

const commissionSchema = z.object({
  type: z.enum(['POURCENTAGE_JACKPOT', 'FRAIS_FIXES_PAR_CYCLE', 'FRAIS_ADHESION']),
  valeur: z.coerce.number().positive('Valeur invalide'),
  description: z.string().optional(),
})

type OpenCycleForm = z.infer<typeof openCycleSchema>
type CommissionForm = z.infer<typeof commissionSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_BADGE: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'default',
  SUSPENDUE: 'warning',
  TERMINEE: 'default',
}

const STATUT_LABEL: Record<TontineStatut, string> = {
  ACTIVE: 'Active',
  BROUILLON: 'Brouillon',
  SUSPENDUE: 'Suspendue',
  TERMINEE: 'Terminée',
}

const FREQ_LABELS: Record<string, string> = {
  JOURNALIERE: 'Journalière',
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUEL: 'Bimensuelle',
  MENSUEL: 'Mensuelle',
  TRIMESTRIEL: 'Trimestrielle',
}

const CYCLE_STATUT_COLORS: Record<CycleStatut, string> = {
  EN_ATTENTE: 'bg-primary-100 text-primary-700',
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE: 'bg-purple-100 text-purple-700',
}

const CYCLE_STATUT_LABELS: Record<CycleStatut, string> = {
  EN_ATTENTE: 'Ouvert',
  EN_COURS: 'En Cours',
  TERMINE: 'Versé',
}

const COT_BADGE: Record<CotisationStatut, 'success' | 'warning' | 'error' | 'default'> = {
  VALIDE: 'success',
  EN_ATTENTE: 'warning',
  EN_RETARD: 'error',
}

const COT_LABEL: Record<CotisationStatut, string> = {
  VALIDE: 'Validée',
  EN_ATTENTE: 'En Attente',
  EN_RETARD: 'Retard',
}

const MEMBRE_BADGE: Record<MembreStatut, 'success' | 'warning' | 'error'> = {
  ACTIF: 'success',
  SUSPENDU: 'warning',
  SORTI: 'error',
}

const METHODE_LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
}

function MiniAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const idx = name.charCodeAt(0) % 5
  const colors = ['bg-primary-600', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500']
  return (
    <span className={`w-8 h-8 rounded-full ${colors[idx]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </span>
  )
}

function SaisieParBadge({ cotisation }: { cotisation: Cotisation }) {
  if (!cotisation.enregistrePar) return <span className="text-neutral-300 text-xs">—</span>
  const isAutoDeclaré = cotisation.enregistrePar.id === cotisation.membre.userId
  if (isAutoDeclaré) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
        Auto-déclaré
      </span>
    )
  }
  return (
    <span
      title={`${cotisation.enregistrePar.firstName} ${cotisation.enregistrePar.lastName}`}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 cursor-help"
    >
      Saisie admin
    </span>
  )
}

type Tab = 'infos' | 'membres' | 'cycles' | 'cotisations' | 'recap' | 'commissions' | 'historique'

// ─── Page principale ──────────────────────────────────────────────────────────

export function TontineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasRole } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('infos')
  const [confirmAction, setConfirmAction] = useState<{ type: 'activer' | 'suspendre' } | null>(null)

  // Modals
  const [showAddMembre, setShowAddMembre] = useState(false)
  const [showOpenCycle, setShowOpenCycle] = useState(false)
  const [showAddCommission, setShowAddCommission] = useState(false)
  const [cycleToClose, setCycleToClose] = useState<string | null>(null)
  const [cotisationToValidate, setCotisationToValidate] = useState<string | null>(null)
  const [membreAction, setMembreAction] = useState<{ type: 'suspendre' | 'activer' | 'retirer'; id: string; nom: string } | null>(null)
  const [adminPayModal, setAdminPayModal] = useState<{ membreId: string; membreNom: string } | null>(null)
  const [beneficiaireModal, setBeneficiaireModal] = useState<{ cycleId: string; cycleNum: number } | null>(null)
  const [selectedMembresJackpot, setSelectedMembresJackpot] = useState<string[]>([])
  const [randomJackpotCycle, setRandomJackpotCycle] = useState<string | null>(null)
  const [expandedHistoriqueCycle, setExpandedHistoriqueCycle] = useState<string | null>(null)
  const [distributionFinale, setDistributionFinale] = useState<MembreDistributionInfo[] | null>(null)
  const [membresPage, setMembresPage] = useState(0)
  const [cotPage, setCotPage] = useState(0)

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: tontine, isLoading } = useTontine(id || '')
  const { data: membresData } = useMembres(id || '', 0, 50)
  const { data: cyclesData } = useCycles(id || '', 0, 50)
  const { data: cotisationsData } = useCotisations(id || '', undefined, 0, 50)
  const { data: commissionsData } = useCommissions(id || '', 0, 20)
  const { data: historiqueBeneficiaires, isLoading: isLoadingHistorique } = useBeneficiairesHistorique(id || '', 0, 50)
  // Listes affichées (paginées). Les requêtes « 50 » ci-dessus servent aux calculs
  // (membres sans cotisation, éligibles jackpot…), inchangés.
  const LIST_SIZE = 20
  const { data: membresPageData, isLoading: membresPageLoading } = useMembres(id || '', membresPage, LIST_SIZE)
  const { data: cotPageData, isLoading: cotPageLoading } = useCotisations(id || '', undefined, cotPage, LIST_SIZE)

  // ─── Mutations ────────────────────────────────────────────────────────────
  const { mutate: activer, isPending: isActivating } = useActiverTontine()
  const { mutate: suspendre, isPending: isSuspending } = useSuspendreTontine()
  const { mutate: updateMembreStatut, isPending: isUpdatingMembre } = useUpdateMembreStatut()
  const { mutate: removeMembre, isPending: isRemovingMembre } = useRemoveMembre()
  const { mutate: openCycle, isPending: isOpeningCycle } = useOpenCycle()
  const { mutate: cloturerCycle, isPending: isClosingCycle } = useCloturerCycle()
  const { mutate: validerCotisation, isPending: isValidating } = useValiderCotisation()
  const { mutate: createCommission, isPending: isCreatingCommission } = useCreateCommission()
  const { mutate: deleteCommission } = useDeleteCommission()
  const { mutate: designerGagnants, isPending: isDesignating } = useDesignerGagnants()

  // ─── Forms ────────────────────────────────────────────────────────────────
  const openCycleForm = useForm<OpenCycleForm>({
    resolver: zodResolver(openCycleSchema),
    defaultValues: { numeroCycle: (cyclesData?.content?.length ?? 0) + 1 },
  })
  const commissionForm = useForm<CommissionForm>({ resolver: zodResolver(commissionSchema) })

  // ─── Permissions ──────────────────────────────────────────────────────────
  const isSuperAdmin = hasRole(UserRole.SUPER_ADMIN)
  const isAdminRole = hasRole(UserRole.ADMIN)
  const isCreator = tontine && user && tontine.creePar.phone === user.phone
  const canManage = isCreator && isAdminRole

  const membres = membresData?.content || []
  const cycles = cyclesData?.content || []
  const cotisations = cotisationsData?.content || []
  const commissions = commissionsData?.content || []

  const isEvenementielle = tontine?.tontineType === TontineType.EVENEMENTIELLE
  const isManuel = tontine?.modeCycle === ModeCycle.MANUEL
  const pct = tontine && tontine.nombreMembres > 0
    ? Math.round((tontine.nombreMembresActuels / tontine.nombreMembres) * 100)
    : 0

  const cotValidees = cotisations.filter((c) => c.statut === CotisationStatut.VALIDE).length
  const cotEnAttente = cotisations.filter((c) => c.statut === CotisationStatut.EN_ATTENTE).length
  const cotEnRetard = cotisations.filter((c) => c.statut === CotisationStatut.EN_RETARD).length

  const currentCycle = cycles.find((c: Cycle) => c.statut === CycleStatut.EN_COURS)
  const cotisationsCurrentCycle = cotisations.filter((c: Cotisation) => currentCycle && c.cycleId === currentCycle.id)
  const paidMembreIds = new Set(cotisationsCurrentCycle.map((c: Cotisation) => c.membre.membreId))
  // Inclut ACTIF et PRE_ENROLLED — seul moyen pour un PRE_ENROLLED de déclarer
  const membresWithoutCotisation = membres.filter(
    (m: Membre) =>
      m.statut !== MembreStatut.SORTI &&
      m.statut !== MembreStatut.SUSPENDU &&
      !paidMembreIds.has(m.id)
  )
  // Exclut les membres qui ont déjà reçu un jackpot
  const membresEligiblesJackpot = membres.filter(
    (m: Membre) =>
      m.statut !== MembreStatut.SORTI &&
      m.statut !== MembreStatut.SUSPENDU &&
      !m.aRecuJackpot
  )

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleConfirmTontine = () => {
    if (!confirmAction || !id) return
    if (confirmAction.type === 'activer') {
      activer(id, {
        onSuccess: () => { toast.success('Tontine activée'); setConfirmAction(null) },
        onError: () => toast.error("Erreur lors de l'activation"),
      })
    } else {
      suspendre(id, {
        onSuccess: () => { toast.success('Tontine suspendue'); setConfirmAction(null) },
        onError: () => toast.error('Erreur lors de la suspension'),
      })
    }
  }

  const onOpenCycle = (data: OpenCycleForm) => {
    openCycle(
      { tontineId: id!, request: { dateDebut: data.dateDebut, dateFin: data.dateFin } },
      {
        onSuccess: () => { toast.success('Cycle ouvert'); openCycleForm.reset(); setShowOpenCycle(false) },
        onError: () => toast.error("Erreur lors de l'ouverture du cycle"),
      }
    )
  }

  const onCloturerCycle = () => {
    if (!cycleToClose) return
    cloturerCycle(
      { tontineId: id!, cycleId: cycleToClose },
      {
        onSuccess: (data) => {
          toast.success('Période clôturée')
          setCycleToClose(null)
          if (data.distributionParMembre && data.distributionParMembre.length > 0) {
            setDistributionFinale(data.distributionParMembre)
          }
        },
        onError: () => toast.error('Erreur lors de la clôture'),
      }
    )
  }

  const onValiderCotisation = () => {
    if (!cotisationToValidate) return
    validerCotisation(
      { tontineId: id!, cotisationId: cotisationToValidate },
      {
        onSuccess: () => { toast.success('Cotisation validée'); setCotisationToValidate(null) },
        onError: () => toast.error('Erreur lors de la validation'),
      }
    )
  }

  const handleMembreAction = () => {
    if (!membreAction || !id) return
    if (membreAction.type === 'retirer') {
      removeMembre(
        { tontineId: id, membreId: membreAction.id },
        { onSuccess: () => { toast.success('Membre retiré'); setMembreAction(null) }, onError: () => toast.error('Erreur') }
      )
    } else {
      const statut = membreAction.type === 'activer' ? MembreStatut.ACTIF : MembreStatut.SUSPENDU
      updateMembreStatut(
        { tontineId: id, membreId: membreAction.id, request: { statut } },
        { onSuccess: () => { toast.success('Statut mis à jour'); setMembreAction(null) }, onError: () => toast.error('Erreur') }
      )
    }
  }

  const onAddCommission = (data: CommissionForm) => {
    createCommission(
      { tontineId: id!, request: data },
      {
        onSuccess: () => { toast.success('Commission ajoutée'); commissionForm.reset(); setShowAddCommission(false) },
        onError: () => toast.error("Erreur lors de l'ajout de la commission"),
      }
    )
  }

  const handleDesignerManuel = () => {
    if (!beneficiaireModal || selectedMembresJackpot.length === 0) return
    designerGagnants(
      { tontineId: id!, cycleId: beneficiaireModal.cycleId, request: { membreIds: selectedMembresJackpot } },
      {
        onSuccess: () => {
          toast.success('Gagnants désignés avec succès')
          setBeneficiaireModal(null)
          setSelectedMembresJackpot([])
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la désignation'
          toast.error(msg)
        },
      }
    )
  }

  const handleDesignerAleatoire = () => {
    if (!randomJackpotCycle) return
    designerGagnants(
      { tontineId: id!, cycleId: randomJackpotCycle, request: { membreIds: [] } },
      {
        onSuccess: () => {
          toast.success('Gagnants sélectionnés aléatoirement')
          setRandomJackpotCycle(null)
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Aucun membre éligible ou erreur'
          toast.error(msg)
        },
      }
    )
  }

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'infos',        label: 'Infos',               show: true },
    { id: 'membres',      label: 'Membres',             show: true },
    { id: 'cycles',       label: isEvenementielle ? 'Périodes' : 'Cycles', show: true },
    { id: 'cotisations',  label: 'Paiements',           show: true },
    // Récap : mêmes droits que l'API (créateur de la tontine + SUPER_ADMIN)
    { id: 'recap',        label: 'Récap',               show: !!(isCreator || isSuperAdmin) },
    { id: 'historique',   label: 'Jackpots',            show: !isEvenementielle },
    { id: 'commissions',  label: 'Commissions',         show: !!canManage },
  ]

  if (isLoading || !tontine) {
    return (
      <AppLayout>
        <div className="flex justify-center py-24">
          {isLoading ? <Spinner /> : <p className="text-neutral-500">Tontine introuvable.</p>}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 truncate">{tontine.nom}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <Badge variant={STATUT_BADGE[tontine.statut]}>{STATUT_LABEL[tontine.statut]}</Badge>
            {isEvenementielle ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700">
                <CalendarHeart size={11} /> Événementielle
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700">
                <RefreshCw size={11} /> Rotative
              </span>
            )}
            {!canManage && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500"
                title={isSuperAdmin ? 'Vue Super Admin — lecture seule' : "Vous n'êtes pas le créateur de cette tontine"}
              >
                <Lock size={10} /> Lecture seule
              </span>
            )}
          </div>
        </div>

        {/* Suspendre (créateur admin) — action secondaire, discrète */}
        {canManage && tontine.statut === TontineStatut.ACTIVE && (
          <Button variant="secondary" size="sm" onClick={() => setConfirmAction({ type: 'suspendre' })} loading={isSuspending}>
            <Pause size={14} /> <span className="hidden sm:inline">Suspendre</span>
          </Button>
        )}
      </div>

      {/* ── Carte principale (façon Wave) ────────────────────────────────── */}
      {(() => {
        const jackpotEstime = tontine.montant * tontine.nombreMembres
        const joursEvt = tontine.dateEcheance
          ? Math.ceil((new Date(tontine.dateEcheance).getTime() - Date.now()) / 86400000)
          : null
        const btn = 'flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-primary-700 font-bold text-[15px] active:scale-[0.98] transition disabled:opacity-60'

        // Action principale selon le rôle et l'état de la tontine
        let action: React.ReactNode = null
        if (canManage && tontine.statut === TontineStatut.BROUILLON) {
          action = (
            <button className={btn} onClick={() => setConfirmAction({ type: 'activer' })} disabled={isActivating}>
              <Play size={18} /> Activer la tontine
            </button>
          )
        } else if (canManage && cotEnAttente > 0) {
          action = (
            <button className={btn} onClick={() => setActiveTab('cotisations')}>
              <CheckCircle size={18} /> Valider {cotEnAttente} paiement{cotEnAttente > 1 ? 's' : ''}
            </button>
          )
        } else if (canManage && currentCycle && membresWithoutCotisation.length > 0) {
          action = (
            <button className={btn} onClick={() => setActiveTab('cotisations')}>
              <Plus size={18} /> Enregistrer un paiement
            </button>
          )
        } else if (!canManage && !isSuperAdmin && tontine.statut === TontineStatut.ACTIVE) {
          action = (
            <button className={btn} onClick={() => navigate('/member/cotisations', { state: { openPay: true } })}>
              <Send size={18} /> Payer ma cotisation
            </button>
          )
        }

        return (
          <div className={`relative overflow-hidden rounded-3xl text-white p-5 sm:p-6 mb-5 ${isEvenementielle ? 'bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500' : 'bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500'}`}>
            <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/10" />
            <div className="relative">
              <p className="text-sm text-white/80">
                {isEvenementielle ? 'Cotisation' : `Cotisation ${(FREQ_LABELS[tontine.frequence] || tontine.frequence).toLowerCase()}`}
              </p>
              {isEvenementielle && tontine.montantLibre ? (
                <p className="mt-1 text-3xl font-extrabold">
                  Montant libre
                  {tontine.montantMinimum ? <span className="ml-2 text-base font-semibold text-white/75">min {formatFCFA(tontine.montantMinimum)}</span> : null}
                </p>
              ) : (
                <p className="mt-1 text-[34px] sm:text-4xl font-extrabold tracking-tight tabular leading-tight">
                  {formatMontant(tontine.montant)} <span className="text-lg font-semibold text-white/70">FCFA</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-white/15 rounded-2xl px-3 py-2.5">
                  <p className="text-[11px] text-white/75 flex items-center gap-1"><Users size={12} /> Membres</p>
                  <p className="font-bold tabular">{tontine.nombreMembresActuels}{!isEvenementielle && ` / ${tontine.nombreMembres}`}</p>
                  {!isEvenementielle && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/20">
                      <div className="h-1.5 rounded-full bg-white" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {isEvenementielle ? (
                  <div className="bg-white/15 rounded-2xl px-3 py-2.5">
                    <p className="text-[11px] text-white/75 flex items-center gap-1"><Calendar size={12} /> Événement</p>
                    <p className="font-bold truncate">{tontine.dateEcheance ? formatDateCourte(tontine.dateEcheance) : '—'}</p>
                    {joursEvt != null && (
                      <p className="text-[11px] font-semibold text-white/85">
                        {joursEvt > 0 ? `J-${joursEvt}` : joursEvt === 0 ? "Aujourd'hui" : `J+${Math.abs(joursEvt)}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/15 rounded-2xl px-3 py-2.5">
                    <p className="text-[11px] text-white/75 flex items-center gap-1"><Trophy size={12} /> Jackpot estimé</p>
                    <p className="font-bold tabular">{formatMontant(jackpotEstime)} F</p>
                    <p className="text-[11px] text-white/85">
                      {currentCycle ? `Cycle ${currentCycle.numeroCycle} en cours` : 'Aucun cycle en cours'}
                    </p>
                  </div>
                )}
              </div>

              {action && <div className="mt-5">{action}</div>}
            </div>
          </div>
        )
      })()}

      {/* ── Onglets (pastilles défilables) ───────────────────────────────── */}
      <ChipRow className="mb-3">
        {tabs.filter((t) => t.show).map((tab) => (
          <button
            aria-pressed={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors inline-flex items-center ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {tab.label}
            {tab.id === 'cotisations' && canManage && cotEnAttente > 0 && (
              <span className={`ml-1.5 inline-flex min-w-5 h-5 px-1 rounded-full text-[11px] font-bold items-center justify-center ${activeTab === tab.id ? 'bg-white text-neutral-900' : 'bg-red-500 text-white'}`}>
                {cotEnAttente}
              </span>
            )}
          </button>
        ))}
      </ChipRow>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* ── Vue générale ─────────────────────────────────────────────── */}
          {activeTab === 'infos' && (
            <div className="space-y-4">
              {tontine.description && (
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-xs text-neutral-400 mb-1">Description</p>
                  <p className="text-sm text-neutral-700">{tontine.description}</p>
                </div>
              )}

              {/* Section événement (EVENEMENTIELLE only) */}
              {isEvenementielle && (tontine.nomEvenement || tontine.dateEcheance) && (
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <PartyPopper size={16} className="text-purple-600" />
                    <p className="text-sm font-semibold text-purple-700">Informations de l'événement</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {tontine.nomEvenement && (
                      <div>
                        <p className="text-xs text-purple-400 mb-0.5">Nom de l'événement</p>
                        <p className="text-sm font-semibold text-purple-900">{tontine.nomEvenement}</p>
                      </div>
                    )}
                    {tontine.dateEcheance && (
                      <div>
                        <p className="text-xs text-purple-400 mb-0.5">Date de l'événement</p>
                        <p className="text-sm font-semibold text-purple-900">
                          {new Date(tontine.dateEcheance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-purple-400 mb-0.5">Mode de cotisation</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {tontine.montantLibre ? 'Montant libre' : 'Montant fixe'}
                      </p>
                    </div>
                    {tontine.montantLibre && tontine.montantMinimum && (
                      <div>
                        <p className="text-xs text-purple-400 mb-0.5">Minimum par cotisation</p>
                        <p className="text-sm font-semibold text-purple-900">
                          {tontine.montantMinimum.toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <dl className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100">
                {[
                  { label: isEvenementielle ? 'Fréquence des rappels' : 'Fréquence', value: FREQ_LABELS[tontine.frequence] || tontine.frequence },
                  !isEvenementielle && { label: 'Mode des cycles', value: tontine.modeCycle === ModeCycle.MANUEL ? 'Manuel' : tontine.modeCycle === ModeCycle.AUTOMATIQUE ? 'Automatique' : '—' },
                  !isEvenementielle && { label: 'Gagnants par cycle', value: String(tontine.nombreGagnants ?? 1) },
                  !isEvenementielle && { label: 'Ordre bénéficiaire', value: tontine.ordreBeneficiaire ?? '—' },
                  { label: 'Date de début', value: new Date(tontine.dateDebut).toLocaleDateString('fr-FR') },
                  { label: 'Créateur', value: `${tontine.creePar.firstName} ${tontine.creePar.lastName}` },
                  { label: 'Téléphone créateur', value: tontine.creePar.phone },
                  { label: 'Créée le', value: new Date(tontine.createdAt).toLocaleDateString('fr-FR') },
                  { label: 'Modifiée le', value: new Date(tontine.updatedAt).toLocaleDateString('fr-FR') },
                ].filter((item): item is { label: string; value: string } => Boolean(item)).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-sm text-neutral-500">{label}</dt>
                    <dd className="text-sm font-semibold text-neutral-900 text-right truncate">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* ── Membres ──────────────────────────────────────────────────── */}
          {activeTab === 'membres' && (
            <div>
              {canManage && (
                <div className="flex justify-end mb-4">
                  <Button size="sm" onClick={() => setShowAddMembre(true)}>
                    <Plus size={15} className="mr-1" /> Ajouter un membre
                  </Button>
                </div>
              )}
              {membresPageLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : (membresPageData?.content || []).length === 0 ? (
                <p className="text-center py-10 text-sm text-neutral-500">Aucun membre</p>
              ) : (
                <ul className="-mx-4 sm:-mx-5 divide-y divide-neutral-100 border-y border-neutral-100">
                  {(membresPageData?.content || []).map((m: Membre) => {
                    const nom = `${m.user.firstName} ${m.user.lastName}`
                    const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
                    const actionBtn = 'w-10 h-10 rounded-full flex items-center justify-center transition-colors'
                    return (
                      <li key={m.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <div className="relative flex-shrink-0">
                          <InitialsAvatar name={nom} size={44} />
                          {m.ordreJackpot != null && (
                            <span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white border border-neutral-200 text-[10px] font-bold text-neutral-600 flex items-center justify-center">
                              {m.ordreJackpot}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 truncate">{nom}</p>
                          <p className="text-xs text-neutral-500 truncate">{m.user.phone}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant={MEMBRE_BADGE[m.statut]}>
                              {m.statut === 'ACTIF' ? 'Actif' : m.statut === 'SUSPENDU' ? 'Suspendu' : 'Sorti'}
                            </Badge>
                            {m.aRecuJackpot && (
                              <span
                                title={m.dateJackpot ? `Jackpot reçu le ${new Date(m.dateJackpot).toLocaleDateString('fr-FR')}` : 'Jackpot reçu'}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700"
                              >
                                <Star size={10} /> Jackpot reçu
                              </span>
                            )}
                            {isPreEnrolled && (
                              <span
                                title="Ce membre n'a pas encore activé son compte sur Dinthialma"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700"
                              >
                                <Clock size={10} /> Non inscrit
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1 flex-shrink-0">
                            {m.statut === MembreStatut.ACTIF && (
                              <button
                                onClick={() => setMembreAction({ type: 'suspendre', id: m.id, nom })}
                                className={`${actionBtn} text-orange-600 hover:bg-orange-50`}
                                title="Suspendre"
                                aria-label={`Suspendre ${nom}`}
                              >
                                <UserMinus size={18} />
                              </button>
                            )}
                            {m.statut === MembreStatut.SUSPENDU && (
                              <button
                                onClick={() => setMembreAction({ type: 'activer', id: m.id, nom })}
                                className={`${actionBtn} text-primary-600 hover:bg-primary-50`}
                                title="Réactiver"
                                aria-label={`Réactiver ${nom}`}
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                            {m.statut !== MembreStatut.SORTI && (
                              <button
                                onClick={() => setMembreAction({ type: 'retirer', id: m.id, nom })}
                                className={`${actionBtn} text-red-500 hover:bg-red-50`}
                                title="Retirer"
                                aria-label={`Retirer ${nom}`}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              <Pagination
                className="px-0 pt-4 pb-0"
                page={membresPage}
                totalPages={membresPageData?.totalPages ?? 1}
                totalElements={membresPageData?.totalElements}
                pageSize={LIST_SIZE}
                onPageChange={setMembresPage}
              />
            </div>
          )}

          {/* ── Cycles / Périodes ────────────────────────────────────────── */}
          {activeTab === 'cycles' && (
            <div>
              {canManage && isManuel && !isEvenementielle && (
                <div className="flex justify-end mb-4">
                  <Button size="sm" onClick={() => setShowOpenCycle(true)}>
                    <Plus size={15} className="mr-1" /> Nouveau cycle
                  </Button>
                </div>
              )}
              {cycles.length === 0 ? (
                <p className="text-center text-neutral-400 py-8">
                  {isEvenementielle ? 'Aucune période' : 'Aucun cycle'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {/* Le cycle en cours remonte en premier, puis l'ordre habituel */}
                  {[...cycles]
                    .sort((a: Cycle, b: Cycle) =>
                      (a.statut === CycleStatut.EN_COURS ? 0 : 1) - (b.statut === CycleStatut.EN_COURS ? 0 : 1))
                    .map((cycle: Cycle) => {
                    const enCours = cycle.statut === CycleStatut.EN_COURS
                    return (
                    <div
                      key={cycle.id}
                      className={`rounded-2xl p-4 ${
                        enCours
                          ? isEvenementielle
                            ? 'border-2 border-violet-500 ring-4 ring-violet-100 bg-gradient-to-b from-violet-50 to-white md:col-span-2 xl:col-span-1'
                            : 'border-2 border-primary-500 ring-4 ring-primary-100 bg-gradient-to-b from-primary-50 to-white md:col-span-2 xl:col-span-1'
                          : isEvenementielle ? 'border bg-purple-50 border-purple-100' : 'border bg-neutral-50 border-neutral-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isEvenementielle ? 'bg-purple-100 text-purple-600' : 'bg-primary-100 text-primary-600'}`}>
                            {isEvenementielle ? <CalendarHeart size={12} /> : <RefreshCw size={12} />}
                          </div>
                          <span className="font-bold text-neutral-900 text-sm">
                            {isEvenementielle ? 'Période' : 'Cycle'} #{cycle.numeroCycle}
                          </span>
                        </div>
                        {enCours ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${isEvenementielle ? 'bg-violet-600' : 'bg-primary-600'}`}>
                            <span className="relative flex w-2 h-2">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                              <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                            </span>
                            En cours
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CYCLE_STATUT_COLORS[cycle.statut]}`}>
                            {CYCLE_STATUT_LABELS[cycle.statut]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-3">
                        <Calendar size={11} />
                        <span>{new Date(cycle.dateDebut).toLocaleDateString('fr-FR')} → {new Date(cycle.dateFin).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {[
                          { label: isEvenementielle ? 'Cagnotte' : 'Jackpot', val: cycle.montantJackpot, green: false },
                          { label: 'Commission', val: cycle.montantCommission, green: false },
                          { label: 'Net', val: cycle.montantNet, green: true },
                        ].map(({ label, val, green }) => (
                          <div key={label} className={`rounded-lg p-2 text-center ${green ? (isEvenementielle ? 'bg-purple-100' : 'bg-primary-50') : 'bg-white border border-neutral-100'}`}>
                            <p className={`text-xs mb-0.5 ${green ? (isEvenementielle ? 'text-purple-400' : 'text-primary-400') : 'text-neutral-400'}`}>{label}</p>
                            <p className={`font-bold text-xs ${green ? (isEvenementielle ? 'text-purple-700' : 'text-primary-600') : 'text-neutral-800'}`}>
                              {val ? `${val.toLocaleString('fr-FR')}` : '—'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Distribution finale EVENEMENTIELLE (après clôture) */}
                      {isEvenementielle && cycle.distributionParMembre && cycle.distributionParMembre.length > 0 && (
                        <div className="mb-3 pt-3 border-t border-purple-100">
                          <p className="text-xs text-purple-500 mb-2 flex items-center gap-1 font-semibold">
                            <PartyPopper size={11} /> Distribution finale
                          </p>
                          <div className="space-y-1">
                            {cycle.distributionParMembre.slice(0, 3).map((d) => (
                              <div key={d.membreId} className="flex items-center justify-between">
                                <span className="text-xs text-neutral-700">{d.firstName} {d.lastName}</span>
                                <span className="text-xs font-bold text-purple-700">{d.montantNet.toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            ))}
                            {cycle.distributionParMembre.length > 3 && (
                              <p className="text-xs text-neutral-400 text-center">+{cycle.distributionParMembre.length - 3} autres</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Gagnants ROTATIVE */}
                      {!isEvenementielle && cycle.gagnants && cycle.gagnants.length > 0 ? (
                        <div className="mb-3 pt-3 border-t border-neutral-100">
                          <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1">
                            <Trophy size={10} className="text-amber-500" />
                            {cycle.gagnants.length > 1 ? 'Gagnants' : 'Gagnant'}
                          </p>
                          <div className="space-y-1.5">
                            {cycle.gagnants.map((g: GagnantInfo) => (
                              <div key={g.membreId} className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <MiniAvatar name={`${g.firstName} ${g.lastName}`} />
                                  <span className="text-xs font-semibold text-primary-700">
                                    {g.firstName} {g.lastName}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-primary-600">
                                  {g.montantRecu != null
                                    ? `${Number(g.montantRecu).toLocaleString('fr-FR')} FCFA`
                                    : '—'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        !isEvenementielle &&
                        cycle.statut === CycleStatut.TERMINE &&
                        tontine.ordreBeneficiaire === 'MANUEL' &&
                        (canManage || isSuperAdmin) && (
                          <div className="mb-3 pt-3 border-t border-neutral-100 space-y-2">
                            <p className="text-xs text-neutral-500 font-medium">
                              Désigner {(tontine.nombreGagnants ?? 1) > 1
                                ? `les ${tontine.nombreGagnants} gagnants`
                                : 'le gagnant'} du jackpot
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setBeneficiaireModal({ cycleId: cycle.id, cycleNum: cycle.numeroCycle }); setSelectedMembresJackpot([]) }}
                                className="flex-1 text-xs font-semibold text-primary-700 border border-primary-200 bg-primary-50 rounded-lg py-1.5 hover:bg-primary-100 transition-colors"
                              >
                                Choisir
                              </button>
                              <button
                                onClick={() => setRandomJackpotCycle(cycle.id)}
                                className="flex-1 flex justify-center items-center gap-1 text-xs font-semibold text-neutral-700 border border-neutral-200 rounded-lg py-1.5 hover:bg-neutral-100 transition-colors"
                              >
                                <Shuffle size={11} /> Aléatoire
                              </button>
                            </div>
                          </div>
                        )
                      )}
                      {canManage && cycle.statut === CycleStatut.EN_COURS && (
                        <button
                          onClick={() => setCycleToClose(cycle.id)}
                          className="w-full text-xs font-semibold text-neutral-700 border border-neutral-200 rounded-lg py-1.5 hover:bg-neutral-100 transition-colors"
                        >
                          {isEvenementielle ? 'Clôturer cette période' : 'Clôturer ce cycle'}
                        </button>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Cotisations ──────────────────────────────────────────────── */}
          {activeTab === 'cotisations' && (
            <div>
              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-primary-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-primary-500 mb-0.5">Validées</p>
                  <p className="font-bold text-primary-700 text-lg">{cotValidees}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-orange-500 mb-0.5">En attente</p>
                  <p className="font-bold text-orange-700 text-lg">{cotEnAttente}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-500 mb-0.5">En retard</p>
                  <p className="font-bold text-red-700 text-lg">{cotEnRetard}</p>
                </div>
              </div>

              {/* Membres sans cotisation (cycle EN_COURS) */}
              {canManage && currentCycle && membresWithoutCotisation.length > 0 && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-xs font-semibold text-orange-700 mb-3 uppercase tracking-wide">
                    Membres sans cotisation — Cycle #{currentCycle.numeroCycle} en cours
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {membresWithoutCotisation.map((m: Membre) => {
                      const nom = `${m.user.firstName} ${m.user.lastName}`
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-1.5"
                        >
                          <MiniAvatar name={nom} />
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-neutral-800">{nom}</span>
                            {m.user.accountStatus === AccountStatus.PRE_ENROLLED && (
                              <span
                                title="Ce membre n'a pas encore de compte Dinthialma. Seul l'admin peut enregistrer ses paiements."
                                className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-600 cursor-help"
                              >
                                Sans compte
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setAdminPayModal({ membreId: m.id, membreNom: nom })}
                            className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Plus size={11} /> Paiement
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {cotPageLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : (cotPageData?.content || []).length === 0 ? (
                <p className="text-center py-10 text-sm text-neutral-500">Aucune cotisation</p>
              ) : (
                <ul className="-mx-4 sm:-mx-5 divide-y divide-neutral-100 border-y border-neutral-100">
                  {(cotPageData?.content || []).map((c: Cotisation) => {
                    const nom = `${c.membre.firstName} ${c.membre.lastName}`
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                        <InitialsAvatar name={nom} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 truncate">{nom}</p>
                          <p className="text-xs text-neutral-500 truncate">
                            {METHODE_LABELS[c.methodePaiement] || c.methodePaiement || '—'}
                            {' · '}{formatDateCourte(c.createdAt)}
                            {c.referenceTransaction && <> · <span className="font-mono">{c.referenceTransaction}</span></>}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant={COT_BADGE[c.statut]}>{COT_LABEL[c.statut]}</Badge>
                            <SaisieParBadge cotisation={c} />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-sm font-bold text-neutral-900 tabular">{formatMontant(c.montant)} F</span>
                          {canManage && c.statut === CotisationStatut.EN_ATTENTE && (
                            <button
                              onClick={() => setCotisationToValidate(c.id)}
                              className="h-8 px-3 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-primary-700 active:scale-95 transition"
                            >
                              <CheckCircle size={14} /> Valider
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <Pagination
                className="px-0 pt-4 pb-0"
                page={cotPage}
                totalPages={cotPageData?.totalPages ?? 1}
                totalElements={cotPageData?.totalElements}
                pageSize={LIST_SIZE}
                onPageChange={setCotPage}
              />
            </div>
          )}

          {/* ── Historique jackpots ───────────────────────────────────────── */}
          {activeTab === 'historique' && (
            <div>
              {isLoadingHistorique ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : !historiqueBeneficiaires || historiqueBeneficiaires.content.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-neutral-400 gap-3">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Trophy size={24} className="text-neutral-300" />
                  </div>
                  <p className="font-medium text-neutral-500">Aucun jackpot remis pour le moment</p>
                  <p className="text-xs text-neutral-400">Les bénéficiaires apparaîtront ici au fil des cycles clôturés.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Résumé total */}
                  <div className="flex items-center justify-between px-1 mb-5">
                    <p className="text-sm text-neutral-500">
                      <span className="font-semibold text-neutral-800">{historiqueBeneficiaires.totalElements}</span>{' '}
                      {historiqueBeneficiaires.totalElements > 1 ? 'jackpots remis' : 'jackpot remis'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Total net versé :{' '}
                      <span className="font-bold text-primary-600">
                        {historiqueBeneficiaires.content
                          .reduce((sum, item) => sum + Number(item.montantNet), 0)
                          .toLocaleString('fr-FR')}{' '}
                        FCFA
                      </span>
                    </p>
                  </div>

                  {historiqueBeneficiaires.content.map((item) => {
                    const isExpanded = expandedHistoriqueCycle === item.cycleId
                    const montantNet = Number(item.montantNet)
                    const montantBrut = Number(item.montantJackpot)
                    const montantComm = item.montantCommission ? Number(item.montantCommission) : 0
                    const montantParGagnant = item.montantParGagnant ? Number(item.montantParGagnant) : null
                    const gagnants = item.gagnants || []
                    // Date de référence : premier gagnant ou dateRemise
                    const dateRef = gagnants[0]?.dateJackpot
                      ? new Date(gagnants[0].dateJackpot).toLocaleDateString('fr-FR')
                      : new Date(item.dateRemise).toLocaleDateString('fr-FR')

                    return (
                      <div
                        key={item.cycleId}
                        className="bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Ligne principale — layout corrigé sans superposition */}
                        <div className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            {/* Badge cycle */}
                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
                              <span className="text-[9px] text-primary-400 leading-none font-medium">Cycle</span>
                              <span className="font-extrabold text-primary-700 text-lg leading-none">{item.numeroCycle}</span>
                            </div>

                            {/* Nom + date — flex-1 avec min-w-0 pour éviter le débordement */}
                            <div className="flex-1 min-w-0">
                              {gagnants.length === 0 ? (
                                <p className="text-sm text-neutral-400 italic">Gagnants non encore désignés</p>
                              ) : gagnants.length === 1 ? (
                                <>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <MiniAvatar name={`${gagnants[0].firstName} ${gagnants[0].lastName}`} />
                                    <div className="min-w-0">
                                      <p className="font-bold text-neutral-900 text-sm truncate">
                                        {gagnants[0].firstName} {gagnants[0].lastName}
                                        {gagnants[0].ordreJackpot != null && (
                                          <span className="ml-1.5 px-1 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-500">
                                            #{gagnants[0].ordreJackpot}
                                          </span>
                                        )}
                                      </p>
                                      {/* Montant sous le nom — plus de superposition */}
                                      <p className="font-extrabold text-primary-600 text-base">
                                        {montantNet.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-primary-400">FCFA</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 ml-10">
                                    <Calendar size={10} className="text-neutral-400" />
                                    <span className="text-xs text-neutral-400">{dateRef}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {gagnants.map((g) => (
                                      <div key={g.membreId} className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 rounded-full">
                                        <MiniAvatar name={`${g.firstName} ${g.lastName}`} />
                                        <span className="text-xs font-semibold text-primary-700">{g.firstName}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="font-extrabold text-primary-600 text-base">
                                    {montantNet.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-primary-400">FCFA</span>
                                  </p>
                                  {montantParGagnant != null && (
                                    <p className="text-[10px] text-neutral-400">
                                      {montantParGagnant.toLocaleString('fr-FR')} FCFA / pers.
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar size={10} className="text-neutral-400" />
                                    <span className="text-xs text-neutral-400">{dateRef}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Badge + accordéon — colonne droite fixe */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                                <Trophy size={11} /> Jackpot
                              </span>
                              <button
                                onClick={() => setExpandedHistoriqueCycle(isExpanded ? null : item.cycleId)}
                                className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Accordéon — détail financier */}
                        {isExpanded && (
                          <div className="border-t border-neutral-50 bg-neutral-50 px-5 py-4">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="bg-white rounded-xl p-3 border border-neutral-100 text-center">
                                <p className="text-xs text-neutral-400 mb-1">Jackpot brut</p>
                                <p className="font-bold text-neutral-800 text-sm">
                                  {montantBrut.toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>
                              <div className={`rounded-xl p-3 border text-center ${montantComm > 0 ? 'bg-white border-neutral-100' : 'bg-neutral-50 border-neutral-100'}`}>
                                <p className="text-xs text-neutral-400 mb-1">Commission</p>
                                <p className={`font-bold text-sm ${montantComm > 0 ? 'text-orange-600' : 'text-neutral-400'}`}>
                                  {montantComm > 0 ? `− ${montantComm.toLocaleString('fr-FR')} FCFA` : '—'}
                                </p>
                              </div>
                              <div className="bg-primary-50 rounded-xl p-3 border border-primary-100 text-center">
                                <p className="text-xs text-primary-400 mb-1">Net total</p>
                                <p className="font-bold text-primary-700 text-sm">
                                  {montantNet.toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>
                            </div>

                            {/* Détail par gagnant si multi */}
                            {gagnants.length > 1 && (
                              <div className="mt-2 space-y-1.5">
                                <p className="text-xs text-neutral-400 font-medium mb-2">Détail par gagnant</p>
                                {gagnants.map((g) => (
                                  <div key={g.membreId} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <MiniAvatar name={`${g.firstName} ${g.lastName}`} />
                                      <span className="text-sm font-medium text-neutral-800">{g.firstName} {g.lastName}</span>
                                      {(canManage || isSuperAdmin) && (
                                        <span className="text-xs text-neutral-400 font-mono">{g.phone}</span>
                                      )}
                                    </div>
                                    <span className="font-bold text-primary-600 text-sm">
                                      {g.montantRecu != null
                                        ? `${Number(g.montantRecu).toLocaleString('fr-FR')} FCFA`
                                        : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Téléphone gagnant unique (admin/superadmin) */}
                            {gagnants.length === 1 && (canManage || isSuperAdmin) && (
                              <p className="mt-2 text-xs text-neutral-400 font-mono">
                                Tél : {gagnants[0].phone}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Commissions (créateur seulement) ─────────────────────────── */}
          {/* ── Récap des cotisations (créateur + SUPER_ADMIN) ────────────── */}
          {activeTab === 'recap' && (isCreator || isSuperAdmin) && (
            <RecapCotisationsPanel
              tontineId={tontine.id}
              cycles={cycles}
              cycleLabel={isEvenementielle ? 'Période' : 'Cycle'}
            />
          )}

          {activeTab === 'commissions' && canManage && (            <div>
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddCommission(true)}>
                  <Plus size={15} className="mr-1" /> Ajouter une commission
                </Button>
              </div>
              {commissions.length === 0 ? (
                <p className="text-center text-neutral-400 py-8">Aucune commission configurée</p>
              ) : (
                <div className="space-y-3">
                  {commissions.map((c: Commission) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-xl bg-neutral-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          <Percent size={15} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-neutral-800">{c.type.replace(/_/g, ' ')}</p>
                          {c.description && <p className="text-xs text-neutral-500">{c.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-primary-600">
                          {c.type === 'POURCENTAGE_JACKPOT' ? `${c.valeur}%` : `${c.valeur.toLocaleString('fr-FR')} FCFA`}
                        </p>
                        <button
                          onClick={() => deleteCommission(
                            { tontineId: id!, commissionId: c.id },
                            { onSuccess: () => toast.success('Commission supprimée'), onError: () => toast.error('Erreur') }
                          )}
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Activer / Suspendre */}
      {confirmAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmTontine}
          title={confirmAction.type === 'activer' ? 'Activer cette tontine ?' : 'Suspendre cette tontine ?'}
          message={confirmAction.type === 'activer'
            ? 'La tontine sera activée et les cycles démarreront selon le mode configuré.'
            : 'La tontine sera suspendue. Les cotisations en cours seront conservées.'}
          confirmText={confirmAction.type === 'activer' ? 'Activer' : 'Suspendre'}
          isDangerous={confirmAction.type === 'suspendre'}
          isLoading={isActivating || isSuspending}
        />
      )}

      {/* Ajouter membre — modal 2 étapes */}
      <AddMembreModal
        tontineId={id!}
        isOpen={showAddMembre}
        onClose={() => setShowAddMembre(false)}
      />

      {/* Ouvrir cycle */}
      <Modal
        isOpen={showOpenCycle}
        onClose={() => { openCycleForm.reset(); setShowOpenCycle(false) }}
        title="Nouveau cycle"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { openCycleForm.reset(); setShowOpenCycle(false) }} disabled={isOpeningCycle}>Annuler</Button>
            <Button form="open-cycle-form" type="submit" loading={isOpeningCycle}>Ouvrir le cycle</Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-500 mb-4">Ouvrez un nouveau cycle de cotisation.</p>
        <form id="open-cycle-form" onSubmit={openCycleForm.handleSubmit(onOpenCycle)} className="space-y-4">
          <Input
            label="Numéro de cycle"
            type="number"
            error={openCycleForm.formState.errors.numeroCycle?.message}
            {...openCycleForm.register('numeroCycle')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date de début" type="date" error={openCycleForm.formState.errors.dateDebut?.message} {...openCycleForm.register('dateDebut')} />
            <Input label="Date de fin" type="date" error={openCycleForm.formState.errors.dateFin?.message} {...openCycleForm.register('dateFin')} />
          </div>
        </form>
      </Modal>

      {/* Clôturer cycle / période */}
      <ConfirmDialog
        isOpen={!!cycleToClose}
        onClose={() => setCycleToClose(null)}
        onConfirm={onCloturerCycle}
        title={isEvenementielle ? 'Clôturer cette période ?' : 'Clôturer ce cycle ?'}
        message={isEvenementielle
          ? 'La cagnotte sera calculée et distribuée à chaque membre selon ses cotisations validées, après déduction des commissions.'
          : 'Le jackpot sera calculé, les commissions déduites. En mode automatique, le cycle suivant démarrera.'}
        confirmText="Clôturer"
        isDangerous
        isLoading={isClosingCycle}
      />

      {/* Valider cotisation */}
      <ConfirmDialog
        isOpen={!!cotisationToValidate}
        onClose={() => setCotisationToValidate(null)}
        onConfirm={onValiderCotisation}
        title="Valider ce paiement ?"
        message="Cette cotisation sera marquée VALIDÉE et prise en compte dans le jackpot à la clôture du cycle."
        confirmText="Valider"
        isLoading={isValidating}
      />

      {/* Action membre */}
      {membreAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setMembreAction(null)}
          onConfirm={handleMembreAction}
          title={
            membreAction.type === 'retirer' ? 'Retirer ce membre ?' :
            membreAction.type === 'suspendre' ? 'Suspendre ce membre ?' :
            'Réactiver ce membre ?'
          }
          message={
            membreAction.type === 'retirer' ? `${membreAction.nom} sera définitivement retiré de la tontine.` :
            membreAction.type === 'suspendre' ? `${membreAction.nom} sera suspendu temporairement.` :
            `${membreAction.nom} sera réactivé.`
          }
          confirmText={
            membreAction.type === 'retirer' ? 'Retirer' :
            membreAction.type === 'suspendre' ? 'Suspendre' : 'Réactiver'
          }
          isDangerous={membreAction.type !== 'activer'}
          isLoading={isUpdatingMembre || isRemovingMembre}
        />
      )}

      {/* Désigner gagnants — sélection manuelle (multi-gagnants) */}
      <Modal
        isOpen={!!beneficiaireModal}
        onClose={() => { setBeneficiaireModal(null); setSelectedMembresJackpot([]) }}
        title={`Désigner ${(tontine?.nombreGagnants ?? 1) > 1 ? 'les gagnants' : 'le gagnant'} — Cycle #${beneficiaireModal?.cycleNum ?? ''}`}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => { setBeneficiaireModal(null); setSelectedMembresJackpot([]) }}
              disabled={isDesignating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDesignerManuel}
              disabled={selectedMembresJackpot.length === 0}
              loading={isDesignating}
            >
              Confirmer
            </Button>
          </div>
        }
      >
        {(() => {
          const maxGagnants = tontine?.nombreGagnants ?? 1
          const eligibles = membresEligiblesJackpot

          if (eligibles.length === 0) {
            return (
              <p className="text-sm text-orange-600 py-2">
                Aucun membre éligible — tous ont déjà reçu un jackpot.
              </p>
            )
          }

          return (
            <>
              <p className="text-sm text-neutral-500 mb-4">
                {maxGagnants === 1
                  ? 'Sélectionnez le membre qui recevra le jackpot.'
                  : `Sélectionnez jusqu'à ${maxGagnants} membres. Le jackpot sera divisé équitablement.`}
              </p>

              {maxGagnants === 1 ? (
                /* Mode classique — Select simple */
                <Select
                  label="Gagnant"
                  placeholder="Choisir un membre..."
                  value={selectedMembresJackpot[0] ?? ''}
                  onChange={(e) => setSelectedMembresJackpot(e.target.value ? [e.target.value] : [])}
                  options={eligibles.map((m: Membre) => ({
                    value: m.id,
                    label: `${m.user.firstName} ${m.user.lastName}`,
                  }))}
                />
              ) : (
                /* Mode multi — checkboxes */
                <div className="space-y-2">
                  <p className="text-xs text-neutral-400 mb-2">
                    {selectedMembresJackpot.length}/{maxGagnants} sélectionnés
                  </p>
                  {eligibles.map((m: Membre) => {
                    const nom = `${m.user.firstName} ${m.user.lastName}`
                    const checked = selectedMembresJackpot.includes(m.id)
                    const disabled = !checked && selectedMembresJackpot.length >= maxGagnants
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'border-primary-300 bg-primary-50'
                            : disabled
                            ? 'border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            setSelectedMembresJackpot((prev) =>
                              checked
                                ? prev.filter((id) => id !== m.id)
                                : [...prev, m.id]
                            )
                          }}
                          className="accent-primary-600 w-4 h-4 flex-shrink-0"
                        />
                        <MiniAvatar name={nom} />
                        <span className="text-sm font-medium text-neutral-800">{nom}</span>
                        {m.ordreJackpot && (
                          <span className="ml-auto text-xs text-neutral-400">#{m.ordreJackpot}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </>
          )
        })()}
      </Modal>

      {/* Désigner gagnants — sélection aléatoire */}
      <ConfirmDialog
        isOpen={!!randomJackpotCycle}
        onClose={() => setRandomJackpotCycle(null)}
        onConfirm={handleDesignerAleatoire}
        title="Sélection aléatoire ?"
        message={`Le système choisira automatiquement ${(tontine?.nombreGagnants ?? 1) > 1 ? `${tontine?.nombreGagnants} membres` : 'un membre'} parmi ceux qui n'ont pas encore reçu de jackpot.`}
        confirmText="Sélectionner"
        isLoading={isDesignating}
      />

      {/* Enregistrement admin de paiement */}
      {adminPayModal && currentCycle && (
        <AdminEnregistrerPaiementModal
          isOpen={!!adminPayModal}
          onClose={() => setAdminPayModal(null)}
          tontineId={id!}
          cycleId={currentCycle.id}
          membreId={adminPayModal.membreId}
          membreNom={adminPayModal.membreNom}
          montantDefaut={tontine.montant}
        />
      )}

      {/* Ajouter commission */}
      <Modal
        isOpen={showAddCommission}
        onClose={() => { commissionForm.reset(); setShowAddCommission(false) }}
        title="Ajouter une commission"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { commissionForm.reset(); setShowAddCommission(false) }} disabled={isCreatingCommission}>Annuler</Button>
            <Button form="commission-form" type="submit" loading={isCreatingCommission}>Ajouter</Button>
          </div>
        }
      >
        <form id="commission-form" onSubmit={commissionForm.handleSubmit(onAddCommission)} className="space-y-4">
          <Select
            label="Type de commission"
            error={commissionForm.formState.errors.type?.message}
            options={[
              { value: 'POURCENTAGE_JACKPOT', label: 'Pourcentage du jackpot' },
              { value: 'FRAIS_FIXES_PAR_CYCLE', label: 'Frais fixes par cycle' },
              { value: 'FRAIS_ADHESION', label: "Frais d'adhésion" },
            ]}
            {...commissionForm.register('type')}
          />
          <Input
            label="Valeur (% ou FCFA)"
            type="number"
            placeholder="4"
            error={commissionForm.formState.errors.valeur?.message}
            {...commissionForm.register('valeur')}
          />
          <Input
            label="Description (optionnel)"
            placeholder="Commission de gestion..."
            {...commissionForm.register('description')}
          />
        </form>
      </Modal>

      {/* Distribution finale — EVENEMENTIELLE (après clôture de la dernière période) */}
      <Modal
        isOpen={!!distributionFinale}
        onClose={() => setDistributionFinale(null)}
        title="Distribution finale"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDistributionFinale(null)}>Fermer</Button>
          </div>
        }
      >
        {distributionFinale && (
          <div className="space-y-4">
            {/* Hero */}
            <div className="flex flex-col items-center py-4 bg-purple-50 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <PartyPopper size={28} className="text-purple-600" />
              </div>
              <p className="font-bold text-purple-900 text-lg">Tontine clôturée !</p>
              <p className="text-sm text-purple-500 mt-0.5">La cagnotte a été distribuée entre tous les membres</p>
              <p className="mt-2 font-extrabold text-purple-700 text-2xl">
                {distributionFinale.reduce((s, d) => s + d.montantNet, 0).toLocaleString('fr-FR')} FCFA
                <span className="text-xs font-medium text-purple-400 ml-1">net total</span>
              </p>
            </div>

            {/* Liste membres */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Détail par membre ({distributionFinale.length})
              </p>
              {distributionFinale.map((d) => (
                <div
                  key={d.membreId}
                  className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <MiniAvatar name={`${d.firstName} ${d.lastName}`} />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{d.firstName} {d.lastName}</p>
                      <p className="text-xs text-neutral-400">
                        Cotisé : {d.montantCotise.toLocaleString('fr-FR')} FCFA
                        {d.montantCommission > 0 && (
                          <span className="text-orange-400"> — comm. {d.montantCommission.toLocaleString('fr-FR')}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-extrabold text-purple-700 text-sm">
                    {d.montantNet.toLocaleString('fr-FR')} <span className="text-xs font-medium text-purple-400">FCFA</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Export hint */}
            <p className="flex items-center gap-1.5 text-xs text-neutral-400 justify-center">
              <Download size={11} />
              Faites une capture d'écran pour conserver ce récapitulatif
            </p>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
