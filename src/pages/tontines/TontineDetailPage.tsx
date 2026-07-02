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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
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
  XCircle,
  UserMinus,
  UserCheck,
  Clock,
  Star,
  Shuffle,
  Trophy,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  CalendarHeart,
  Download,
  AlertTriangle,
  LayoutList,
  Users2,
} from 'lucide-react'
import { CotisationsRecapTotal } from '@/components/shared/CotisationsRecapTotal'

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

type Tab = 'infos' | 'membres' | 'cycles' | 'cotisations' | 'commissions' | 'historique'

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
  // undefined = auto (EN_COURS), '' = tout afficher, 'id' = cycle explicite
  const [cotisationCycleFilter, setCotisationCycleFilter] = useState<string | undefined>(undefined)
  const [selectedMembreId, setSelectedMembreId] = useState<string | undefined>(undefined)
  const [showMembresSansCot, setShowMembresSansCot] = useState(false)
  const [cotisationView, setCotisationView] = useState<'par-cycle' | 'recap-total'>('par-cycle')

  // ─── Data ─────────────────────────────────────────────────────────────────
  const { data: tontine, isLoading } = useTontine(id || '')
  const { data: membresData } = useMembres(id || '', 0, 50)
  const { data: cyclesData } = useCycles(id || '', 0, 50)
  const cycleEnCoursId = (cyclesData?.content || []).find((c: Cycle) => c.statut === CycleStatut.EN_COURS)?.id
  // undefined = auto → EN_COURS, '' = tout, 'id' = cycle choisi
  // quand un membre est sélectionné → pas de filtre cycle (on veut toutes ses cotisations)
  const baseCycleFilter = cotisationCycleFilter === undefined ? cycleEnCoursId : (cotisationCycleFilter || undefined)
  const effectiveCycleFilter = selectedMembreId ? undefined : baseCycleFilter
  const { data: cotisationsData } = useCotisations(id || '', effectiveCycleFilter, 0, selectedMembreId ? 200 : 50, selectedMembreId)
  const { data: commissionsData } = useCommissions(id || '', 0, 20)
  const { data: historiqueBeneficiaires, isLoading: isLoadingHistorique } = useBeneficiairesHistorique(id || '', 0, 50)

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

  // Visibilité: membre voit seulement ses cotisations; admin/superadmin voient tout
  const normalizePhone = (p: string) => p.replace(/^\+?221/, '')
  const myPhone = normalizePhone(user?.phone || '')
  const cotisationsToShow = cotisations
    .filter((c: Cotisation) => (canManage || isSuperAdmin) ? true : normalizePhone(c.membre.phone) === myPhone)

  const cotValidees = cotisationsToShow.filter((c) => c.statut === CotisationStatut.VALIDE).length
  const cotEnAttente = cotisationsToShow.filter((c) => c.statut === CotisationStatut.EN_ATTENTE).length
  const cotEnRetard = cotisationsToShow.filter((c) => c.statut === CotisationStatut.EN_RETARD).length

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
  // Exclut les membres qui ont déjà reçu un jackpot (aRecuJackpot true ou undefined=jamais reçu)
  const membresEligiblesJackpot = membres.filter(
    (m: Membre) =>
      m.statut !== MembreStatut.SORTI &&
      m.statut !== MembreStatut.SUSPENDU &&
      m.aRecuJackpot !== true
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

  // Compteurs pour les badges d'onglets
  const membresActifs = membres.filter((m: Membre) => m.statut === MembreStatut.ACTIF).length
  const cyclesEnCours = cycles.filter((c: Cycle) => c.statut === CycleStatut.EN_COURS).length
  // cotEnAttente et cotEnRetard déjà calculés plus haut

  const tabs: { id: Tab; label: string; show: boolean; badge?: number; badgeAlert?: boolean }[] = [
    { id: 'infos',       label: 'Général',                                   show: true },
    { id: 'membres',     label: 'Membres',      badge: membresActifs,        show: true },
    { id: 'cycles',      label: isEvenementielle ? 'Périodes' : 'Cycles',
                                                badge: cyclesEnCours > 0 ? cyclesEnCours : undefined, show: true },
    { id: 'cotisations', label: 'Cotisations',
                                                badge: cotEnAttente + cotEnRetard || undefined,
                                                badgeAlert: cotEnRetard > 0,                show: true },
    { id: 'historique',  label: 'Jackpots',                                  show: !isEvenementielle },
    { id: 'commissions', label: 'Commissions',                               show: !!canManage },
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
      <div className="flex items-start gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 truncate">{tontine.nom}</h1>
            <Badge variant={STATUT_BADGE[tontine.statut]}>
              {STATUT_LABEL[tontine.statut]}
            </Badge>
            {isEvenementielle ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                <CalendarHeart size={11} /> Événementielle
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                <RefreshCw size={11} /> Rotative
              </span>
            )}
          </div>
          {tontine.description && (
            <p className="text-sm text-neutral-500 mt-0.5">{tontine.description}</p>
          )}
        </div>

        {/* Actions (créateur admin uniquement) */}
        {canManage && (
          <div className="flex gap-2 flex-shrink-0">
            {tontine.statut === TontineStatut.BROUILLON && (
              <Button
                size="sm"
                onClick={() => setConfirmAction({ type: 'activer' })}
                loading={isActivating}
              >
                <Play size={14} className="mr-1" /> Activer
              </Button>
            )}
            {tontine.statut === TontineStatut.ACTIVE && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmAction({ type: 'suspendre' })}
                loading={isSuspending}
              >
                <Pause size={14} className="mr-1" /> Suspendre
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Bande de résumé ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Montant — ROTATIVE = montant fixe, EVENEMENTIELLE = libre ou fixe */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">{isEvenementielle ? 'Cotisation' : 'Montant'}</p>
            {isEvenementielle && tontine.montantLibre ? (
              <>
                <p className="font-bold text-purple-600 text-lg">Libre</p>
                {tontine.montantMinimum && (
                  <p className="text-xs text-neutral-400">min {tontine.montantMinimum.toLocaleString('fr-FR')} FCFA</p>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-primary-600 text-lg">{tontine.montant.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-neutral-400">{FREQ_LABELS[tontine.frequence] || tontine.frequence}</p>
              </>
            )}
          </div>

          {/* Membres */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">Membres</p>
            <p className="font-bold text-neutral-900 text-lg">{tontine.nombreMembresActuels}{!isEvenementielle && `/${tontine.nombreMembres}`}</p>
            {!isEvenementielle && (
              <div className="mt-1 w-full bg-neutral-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>

          {/* Champs ROTATIVE uniquement */}
          {!isEvenementielle && (
            <>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Mode</p>
                <p className="font-semibold text-neutral-900 uppercase text-sm">{tontine.modeCycle}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Fréquence</p>
                <p className="font-semibold text-neutral-900 text-sm">{FREQ_LABELS[tontine.frequence] || tontine.frequence}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Gagnants / cycle</p>
                <p className="font-semibold text-neutral-900 text-sm">
                  {tontine.nombreGagnants ?? 1}
                  {(tontine.nombreGagnants ?? 1) > 1 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Multi</span>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Champs EVENEMENTIELLE uniquement */}
          {isEvenementielle && (
            <>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Fréquence rappels</p>
                <p className="font-semibold text-neutral-900 text-sm">{FREQ_LABELS[tontine.frequence] || tontine.frequence}</p>
              </div>
              {tontine.nomEvenement && (
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Événement</p>
                  <p className="font-semibold text-neutral-900 text-sm truncate">{tontine.nomEvenement}</p>
                </div>
              )}
              {tontine.dateEcheance && (() => {
                const jours = Math.ceil((new Date(tontine.dateEcheance).getTime() - Date.now()) / 86400000)
                return (
                  <div>
                    <p className="text-xs text-neutral-400 mb-1">Date événement</p>
                    <p className="font-bold text-purple-700 text-sm">{new Date(tontine.dateEcheance).toLocaleDateString('fr-FR')}</p>
                    <p className={`text-xs font-semibold ${jours > 0 ? 'text-purple-500' : 'text-red-500'}`}>
                      {jours > 0 ? `J-${jours}` : jours === 0 ? "Aujourd'hui" : `J+${Math.abs(jours)}`}
                    </p>
                  </div>
                )
              })()}
            </>
          )}

          {/* Début */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">Début</p>
            <p className="font-semibold text-neutral-900 text-sm">{new Date(tontine.dateDebut).toLocaleDateString('fr-FR')}</p>
          </div>
          {/* Créateur */}
          <div>
            <p className="text-xs text-neutral-400 mb-1">Créateur</p>
            <p className="font-semibold text-neutral-900 text-sm">{tontine.creePar.firstName} {tontine.creePar.lastName}</p>
          </div>
        </div>
      </div>


      {/* ── Onglets ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Mobile — pills scrollables avec compteurs */}
        <div className="sm:hidden overflow-x-auto border-b border-neutral-100">
          <div className="flex items-center gap-1.5 px-3 py-3 min-w-max">
            {tabs.filter((t) => t.show).map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      active
                        ? 'bg-white/25 text-white'
                        : tab.badgeAlert
                          ? 'bg-red-500 text-white'
                          : 'bg-primary-100 text-primary-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        {/* Desktop — tab buttons */}
        <div className="hidden sm:flex border-b border-neutral-100 overflow-x-auto">
          {tabs.filter((t) => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : tab.badgeAlert
                      ? 'bg-red-100 text-red-600'
                      : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  !isEvenementielle && { label: 'Ordre bénéficiaire', value: tontine.ordreBeneficiaire ?? '—' },
                  { label: 'Date de début', value: new Date(tontine.dateDebut).toLocaleDateString('fr-FR') },
                  { label: 'Créé le', value: new Date(tontine.createdAt).toLocaleDateString('fr-FR') },
                  { label: 'Modifié le', value: new Date(tontine.updatedAt).toLocaleDateString('fr-FR') },
                  { label: 'Créateur', value: `${tontine.creePar.firstName} ${tontine.creePar.lastName}` },
                  { label: 'Téléphone créateur', value: tontine.creePar.phone },
                ].filter((item): item is { label: string; value: string } => Boolean(item)).map(({ label, value }) => (
                  <div key={label} className="p-3 bg-neutral-50 rounded-xl">
                    <p className="text-xs text-neutral-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-neutral-800">{value}</p>
                  </div>
                ))}
              </div>
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
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['#', 'Membre', 'Téléphone', 'Statut', 'Compte', canManage ? '' : undefined]
                        .filter(Boolean)
                        .map((h) => (
                          <th key={String(h)} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {membres.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Aucun membre</td></tr>
                    ) : (
                      membres.map((m: Membre) => {
                        const nom = `${m.user.firstName} ${m.user.lastName}`
                        const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
                        return (
                          <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                            <td className="px-4 py-3 font-semibold text-neutral-500 text-xs">#{m.ordreJackpot}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <MiniAvatar name={nom} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-neutral-900">{nom}</p>
                                    {m.aRecuJackpot && (
                                      <span title={m.dateJackpot ? `Jackpot reçu le ${new Date(m.dateJackpot).toLocaleDateString('fr-FR')}` : 'Jackpot reçu'}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 cursor-help">
                                        <Star size={9} /> Jackpot
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-400">Adhésion : {m.dateAdhesion ? new Date(m.dateAdhesion).toLocaleDateString('fr-FR') : '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-neutral-600 text-xs font-mono">{m.user.phone}</td>
                            <td className="px-4 py-3"><Badge variant={MEMBRE_BADGE[m.statut]}>{m.statut === 'ACTIF' ? 'Actif' : m.statut === 'SUSPENDU' ? 'Suspendu' : 'Sorti'}</Badge></td>
                            <td className="px-4 py-3">
                              {isPreEnrolled ? (
                                <span title="Ce membre n'a pas encore activé son compte sur Dinthialma"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 cursor-help">
                                  <Clock size={10} /> Non inscrit
                                </span>
                              ) : <span className="text-neutral-300 text-xs">—</span>}
                            </td>
                            {canManage && (
                              <td className="px-4 py-3">
                                <div className="flex gap-1.5">
                                  {m.statut === MembreStatut.ACTIF && <button onClick={() => setMembreAction({ type: 'suspendre', id: m.id, nom })} className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition-colors" title="Suspendre"><UserMinus size={13} /></button>}
                                  {m.statut === MembreStatut.SUSPENDU && <button onClick={() => setMembreAction({ type: 'activer', id: m.id, nom })} className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors" title="Réactiver"><UserCheck size={13} /></button>}
                                  {m.statut !== MembreStatut.SORTI && <button onClick={() => setMembreAction({ type: 'retirer', id: m.id, nom })} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Retirer"><Trash2 size={13} /></button>}
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {/* Mobile — cards */}
              <div className="sm:hidden space-y-2 pt-1">
                {membres.length === 0 ? (
                  <p className="text-center py-8 text-neutral-400 text-sm">Aucun membre</p>
                ) : membres.map((m: Membre) => {
                  const nom = `${m.user.firstName} ${m.user.lastName}`
                  const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
                  const statutColor: Record<MembreStatut, string> = { ACTIF: 'bg-primary-100 text-primary-700', SUSPENDU: 'bg-orange-100 text-orange-700', SORTI: 'bg-red-100 text-red-700' }
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-3 rounded-xl border border-neutral-100 bg-neutral-50">
                      <MiniAvatar name={nom} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-neutral-400">#{m.ordreJackpot}</span>
                          <p className="text-sm font-semibold text-neutral-900 truncate">{nom}</p>
                          {m.aRecuJackpot && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700"><Star size={8} /> Jackpot</span>}
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mb-1">{m.user.phone}</p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statutColor[m.statut]}`}>{m.statut === 'ACTIF' ? 'Actif' : m.statut === 'SUSPENDU' ? 'Suspendu' : 'Sorti'}</span>
                          {isPreEnrolled && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700"><Clock size={8} /> Non inscrit</span>}
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {m.statut === MembreStatut.ACTIF && <button onClick={() => setMembreAction({ type: 'suspendre', id: m.id, nom })} className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition-colors"><UserMinus size={16} /></button>}
                          {m.statut === MembreStatut.SUSPENDU && <button onClick={() => setMembreAction({ type: 'activer', id: m.id, nom })} className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors"><UserCheck size={16} /></button>}
                          {m.statut !== MembreStatut.SORTI && <button onClick={() => setMembreAction({ type: 'retirer', id: m.id, nom })} className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
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
                  {[...cycles].sort((a, b) => {
                    if (a.statut === CycleStatut.EN_COURS) return -1
                    if (b.statut === CycleStatut.EN_COURS) return 1
                    return 0
                  }).map((cycle: Cycle) => (
                    <div
                      key={cycle.id}
                      className={`rounded-2xl border p-4 ${isEvenementielle ? 'bg-purple-50 border-purple-100' : 'bg-neutral-50 border-neutral-100'}`}
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CYCLE_STATUT_COLORS[cycle.statut]}`}>
                          {CYCLE_STATUT_LABELS[cycle.statut]}
                        </span>
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
                      {cycle.statut !== CycleStatut.EN_ATTENTE && (
                        <button
                          onClick={() => { setCotisationCycleFilter(cycle.id); setActiveTab('cotisations') }}
                          className="w-full text-xs font-semibold text-primary-700 border border-primary-200 bg-primary-50 rounded-lg py-1.5 hover:bg-primary-100 transition-colors"
                        >
                          Voir les cotisations
                        </button>
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Cotisations ──────────────────────────────────────────────── */}
          {activeTab === 'cotisations' && (
            <div>
              {/* Toggle vue (gestionnaire uniquement) */}
              {canManage && (
                <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-4 w-fit">
                  <button
                    onClick={() => setCotisationView('par-cycle')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      cotisationView === 'par-cycle'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <LayoutList size={13} /> Par cycle
                  </button>
                  <button
                    onClick={() => setCotisationView('recap-total')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      cotisationView === 'recap-total'
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Users2 size={13} /> Vue d'ensemble
                  </button>
                </div>
              )}

              {/* Vue d'ensemble : recap total par membre */}
              {cotisationView === 'recap-total' && canManage && id && (
                <CotisationsRecapTotal tontineId={id} />
              )}

              {/* Vue par cycle */}
              {(cotisationView === 'par-cycle' || !canManage) && (
              <>{/* Indicateur cycle affiché */}
              {effectiveCycleFilter && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {(() => {
                      const cy = cycles.find((c: Cycle) => c.id === effectiveCycleFilter)
                      return cy ? `${isEvenementielle ? 'Période' : 'Cycle'} #${cy.numeroCycle}` : 'Cycle'
                    })()} — cotisations
                  </span>
                  <button
                    onClick={() => setCotisationCycleFilter('')}
                    className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                  >
                    Voir tout
                  </button>
                </div>
              )}

              {/* Sélecteur membre (gestionnaire uniquement) */}
              {canManage && membres.length > 0 && (
                <div className="mb-4">
                  <select
                    value={selectedMembreId || ''}
                    onChange={(e) => setSelectedMembreId(e.target.value || undefined)}
                    className="w-full sm:w-72 text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="">Tous les membres</option>
                    {membres.filter((m: Membre) => m.statut !== MembreStatut.SORTI).map((m: Membre) => (
                      <option key={m.id} value={m.id}>
                        {m.user.firstName} {m.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fiche membre sélectionné */}
              {selectedMembreId && (() => {
                const membreInfo = membres.find((m: Membre) => m.id === selectedMembreId)
                const totalValide = cotisationsToShow.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE).reduce((s: number, c: Cotisation) => s + c.montant, 0)
                const nbEnAttente = cotisationsToShow.filter((c: Cotisation) => c.statut === CotisationStatut.EN_ATTENTE).length
                const nbEnRetard = cotisationsToShow.filter((c: Cotisation) => c.statut === CotisationStatut.EN_RETARD).length
                return (
                  <div className="mb-4 bg-primary-50 border border-primary-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {membreInfo && <MiniAvatar name={`${membreInfo.user.firstName} ${membreInfo.user.lastName}`} />}
                        <div>
                          <p className="text-sm font-bold text-primary-900">
                            {membreInfo ? `${membreInfo.user.firstName} ${membreInfo.user.lastName}` : '—'}
                          </p>
                          <p className="text-xs text-primary-500">Toutes les cotisations sur cette tontine</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedMembreId(undefined)}
                        className="text-xs text-neutral-400 hover:text-neutral-600 underline"
                      >
                        Voir tous les membres
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-xs text-neutral-400 mb-0.5">Validées</p>
                        <p className="font-bold text-primary-600">{cotisationsToShow.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE).length}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-xs text-neutral-400 mb-0.5">En attente</p>
                        <p className="font-bold text-orange-500">{nbEnAttente}</p>
                      </div>
                      <div className="bg-white rounded-xl p-2.5 text-center">
                        <p className="text-xs text-neutral-400 mb-0.5">En retard</p>
                        <p className="font-bold text-red-500">{nbEnRetard}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-primary-100 flex items-center justify-between">
                      <p className="text-xs text-primary-600">Total versé (validé)</p>
                      <p className="text-sm font-extrabold text-primary-700">{totalValide.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>
                )
              })()}

              {/* Mini stats (masquées quand un membre est sélectionné — la fiche les remplace) */}
              {!selectedMembreId && (
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
              )}

              {/* Membres sans cotisation — seulement quand on est sur le cycle EN_COURS */}
              {canManage && currentCycle && effectiveCycleFilter === currentCycle.id && !selectedMembreId && membresWithoutCotisation.length > 0 && (
                <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 overflow-hidden">
                  <button
                    onClick={() => setShowMembresSansCot((v) => !v)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-orange-100 transition-colors"
                  >
                    <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wide flex-1">
                      {membresWithoutCotisation.length}{' '}
                      {membresWithoutCotisation.length > 1 ? 'membres sans cotisation' : 'membre sans cotisation'}
                      {' '}— Cycle #{currentCycle.numeroCycle}
                    </span>
                    {showMembresSansCot
                      ? <ChevronUp size={15} className="text-orange-400 shrink-0" />
                      : <ChevronDown size={15} className="text-orange-400 shrink-0" />
                    }
                  </button>
                  {showMembresSansCot && (
                    <div className="px-3 pb-3 space-y-2">
                      {membresWithoutCotisation.map((m: Membre) => {
                        const nom = `${m.user.firstName} ${m.user.lastName}`
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2"
                          >
                            <MiniAvatar name={nom} />
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm font-medium text-neutral-800 truncate">{nom}</span>
                              {m.user.accountStatus === AccountStatus.PRE_ENROLLED && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-600 shrink-0">
                                  Sans compte
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setAdminPayModal({ membreId: m.id, membreNom: nom })}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Plus size={11} /> Paiement
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      {['Membre', 'Montant', 'Méthode', 'Référence', 'Date', 'Statut', 'Saisie par', canManage ? '' : undefined]
                        .filter(Boolean)
                        .map((h) => (
                          <th key={String(h)} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{h}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cotisationsToShow.length === 0 ? (
                      <tr><td colSpan={canManage ? 8 : 7} className="text-center py-8 text-neutral-400">Aucune cotisation</td></tr>
                    ) : cotisationsToShow.map((c: Cotisation) => (
                      <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                        <td className="px-4 py-3 font-semibold text-neutral-900">{c.membre.firstName} {c.membre.lastName}</td>
                        <td className="px-4 py-3 font-semibold">{c.montant.toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-4 py-3 text-neutral-600">{METHODE_LABELS[c.methodePaiement] || c.methodePaiement || '—'}</td>
                        <td className="px-4 py-3 text-neutral-500 text-xs font-mono">{c.referenceTransaction || '—'}</td>
                        <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3"><Badge variant={COT_BADGE[c.statut]}>{COT_LABEL[c.statut]}</Badge></td>
                        <td className="px-4 py-3"><SaisieParBadge cotisation={c} /></td>
                        {canManage && (
                          <td className="px-4 py-3">
                            {c.statut === CotisationStatut.EN_ATTENTE && (
                              <div className="flex gap-1.5">
                                <button onClick={() => setCotisationToValidate(c.id)} className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center hover:bg-primary-100 transition-colors" title="Valider"><CheckCircle size={15} /></button>
                                <button className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Refuser"><XCircle size={15} /></button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile — cards */}
              <div className="sm:hidden space-y-2 pt-1">
                {cotisationsToShow.length === 0 ? (
                  <p className="text-center py-8 text-neutral-400 text-sm">Aucune cotisation</p>
                ) : cotisationsToShow.map((c: Cotisation) => (
                  <div key={c.id} className="px-3 py-3 rounded-xl border border-neutral-100 bg-neutral-50">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MiniAvatar name={`${c.membre.firstName} ${c.membre.lastName}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{c.membre.firstName} {c.membre.lastName}</p>
                          <p className="text-xs text-neutral-400">{METHODE_LABELS[c.methodePaiement] || c.methodePaiement} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-sm font-bold text-neutral-800">{c.montant.toLocaleString('fr-FR')} FCFA</p>
                        <Badge variant={COT_BADGE[c.statut]}>{COT_LABEL[c.statut]}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                      <SaisieParBadge cotisation={c} />
                      {canManage && c.statut === CotisationStatut.EN_ATTENTE && (
                        <div className="flex gap-1.5">
                          <button onClick={() => setCotisationToValidate(c.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-600 text-xs font-semibold hover:bg-primary-100 transition-colors"><CheckCircle size={12} /> Valider</button>
                          <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors"><XCircle size={12} /> Refuser</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              </>)}
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
