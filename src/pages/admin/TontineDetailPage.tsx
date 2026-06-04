import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Table, Column } from '@/components/ui/Table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
import { useTontine, useActiverTontine, useSuspendreTontine, useCommissions, useDeleteCommission } from '@/hooks/useTontines'
import { useMembres, useRemoveMembre, useUpdateMembreStatut } from '@/hooks/useMembres'
import { useCycles, useCloturerCycle } from '@/hooks/useCycles'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { Membre } from '@/types/membre'
import { Cycle } from '@/types/cycle'
import { Cotisation } from '@/types/cotisation'
import { TontineStatut, CycleStatut, CotisationStatut, MembreStatut, AccountStatus } from '@/types/common'
import { ArrowLeft, Play, Pause, Trash2, CheckCircle, UserMinus, AlertTriangle, CreditCard } from 'lucide-react'

type Tab = 'infos' | 'membres' | 'cycles' | 'cotisations' | 'commissions'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

// ─── Types locaux ──────────────────────────────────────────────────────────────
interface PaiementModalState {
  isOpen: boolean
  membreId: string
  membreNom: string
  cycleId: string
}

export function TontineDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('infos')
  const [confirm, setConfirm] = useState<{ action: string; label: string; danger?: boolean } | null>(null)
  const [paiementModal, setPaiementModal] = useState<PaiementModalState>({
    isOpen: false,
    membreId: '',
    membreNom: '',
    cycleId: '',
  })

  const { data: tontine, isLoading } = useTontine(id || '')
  const { mutate: activer, isPending: isActivating } = useActiverTontine()
  const { mutate: suspendre, isPending: isSuspending } = useSuspendreTontine()

  // Membres
  const { data: membresData, isLoading: membresLoading } = useMembres(id || '', 0, 50)
  const { mutate: removeMembre } = useRemoveMembre()
  const { mutate: updateStatut } = useUpdateMembreStatut()

  // Cycles
  const { data: cyclesData, isLoading: cyclesLoading } = useCycles(id || '', 0, 50)
  const { mutate: cloturerCycle } = useCloturerCycle()

  // Cotisations
  const { data: cotisationsData, isLoading: cotisationsLoading } = useCotisations(id || '', undefined, 0, 20)
  const { mutate: validerCotisation } = useValiderCotisation()

  // Commissions
  const { data: commissionsData, isLoading: commissionsLoading } = useCommissions(id || '', 0, 20)
  const { mutate: deleteCommission } = useDeleteCommission()

  if (isLoading) return <AppLayout><div className="flex justify-center py-20 bg-neutral-50 min-h-screen"><Spinner /></div></AppLayout>
  if (!tontine) return <AppLayout><div className="text-center py-12 text-neutral-600 bg-neutral-50 min-h-screen">Tontine non trouvée</div></AppLayout>

  // ─── Cycle en cours + membres pre-enrolled sans cotisation ────────────────
  const cycles = cyclesData?.content || []
  const cycleEnCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)
  const membres = membresData?.content || []
  const cotisations = cotisationsData?.content || []

  const membresPreEnrolledSansCotisation = cycleEnCours
    ? membres.filter((m) => {
        const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
        const aCotise = cotisations.some(
          (c) => c.membre.membreId === m.id && c.cycleId === cycleEnCours.id
        )
        return isPreEnrolled && !aCotise
      })
    : []

  const handleConfirm = () => {
    if (!confirm || !id) return
    if (confirm.action === 'activer') {
      activer(id, {
        onSuccess: () => { toast.success('Tontine activée'); setConfirm(null) },
        onError: () => toast.error('Erreur lors de l\'activation'),
      })
    } else if (confirm.action === 'suspendre') {
      suspendre(id, {
        onSuccess: () => { toast.success('Tontine suspendue'); setConfirm(null) },
        onError: () => toast.error('Erreur lors de la suspension'),
      })
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'infos', label: 'Infos générales' },
    { id: 'membres', label: 'Membres' },
    { id: 'cycles', label: 'Cycles' },
    { id: 'cotisations', label: 'Cotisations' },
    { id: 'commissions', label: 'Commissions' },
  ]

  // ─── Colonnes membres ──────────────────────────────────────────────────────
  const membreColumns: Column<Membre>[] = [
    {
      key: 'user',
      header: 'Membre',
      render: (row) => <span className="font-semibold">{row.user.firstName} {row.user.lastName}</span>,
    },
    { key: 'user', header: 'Téléphone', render: (row) => row.user.phone },
    { key: 'ordreJackpot', header: 'Ordre' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const v: Record<MembreStatut, 'success' | 'warning' | 'error' | 'default'> = {
          ACTIF: 'success', SUSPENDU: 'warning', SORTI: 'error',
        }
        return <Badge variant={v[row.statut]}>{row.statut}</Badge>
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.statut === MembreStatut.ACTIF && (
            <Button variant="secondary" size="sm" title="Suspendre"
              onClick={() => updateStatut(
                { tontineId: id!, membreId: row.id, request: { statut: MembreStatut.SUSPENDU } },
                { onSuccess: () => toast.success('Membre suspendu'), onError: () => toast.error('Erreur') }
              )}>
              <UserMinus size={16} />
            </Button>
          )}
          <Button variant="danger" size="sm" title="Retirer"
            onClick={() => removeMembre(
              { tontineId: id!, membreId: row.id },
              { onSuccess: () => toast.success('Membre retiré'), onError: () => toast.error('Erreur') }
            )}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  // ─── Colonnes cycles ───────────────────────────────────────────────────────
  const cycleColumns: Column<Cycle>[] = [
    {
      key: 'numeroCycle',
      header: 'Cycle',
      render: (row) => <span className="font-semibold">Cycle {row.numeroCycle}</span>,
    },
    { key: 'dateDebut', header: 'Début', render: (row) => new Date(row.dateDebut).toLocaleDateString('fr-FR') },
    { key: 'dateFin', header: 'Fin', render: (row) => new Date(row.dateFin).toLocaleDateString('fr-FR') },
    {
      key: 'montantNet',
      header: 'Jackpot net',
      render: (row) => row.montantNet ? `${row.montantNet.toLocaleString()} FCFA` : '—',
    },
    {
      key: 'beneficiaire',
      header: 'Bénéficiaire',
      render: (row) => row.beneficiaire ? `${row.beneficiaire.firstName} ${row.beneficiaire.lastName}` : '—',
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const v: Record<CycleStatut, 'success' | 'warning' | 'info' | 'default'> = {
          EN_ATTENTE: 'warning', EN_COURS: 'info', TERMINE: 'success',
        }
        return <Badge variant={v[row.statut]}>{row.statut}</Badge>
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => row.statut === CycleStatut.EN_COURS ? (
        <Button variant="secondary" size="sm"
          onClick={() => cloturerCycle(
            { tontineId: id!, cycleId: row.id },
            { onSuccess: () => toast.success('Cycle clôturé'), onError: () => toast.error('Erreur') }
          )}>
          Clôturer
        </Button>
      ) : null,
    },
  ]

  // ─── Colonnes cotisations ──────────────────────────────────────────────────
  const cotisationColumns: Column<Cotisation>[] = [
    {
      key: 'membre',
      header: 'Membre',
      render: (row) => <span className="font-semibold">{row.membre.firstName} {row.membre.lastName}</span>,
    },
    { key: 'montant', header: 'Montant', render: (row) => `${row.montant.toLocaleString()} FCFA` },
    { key: 'methodePaiement', header: 'Méthode' },
    { key: 'referenceTransaction', header: 'Référence', render: (row) => row.referenceTransaction || '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const v: Record<CotisationStatut, 'success' | 'warning' | 'error'> = {
          EN_ATTENTE: 'warning', VALIDE: 'success', EN_RETARD: 'error',
        }
        return <Badge variant={v[row.statut]}>{row.statut}</Badge>
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => row.statut === CotisationStatut.EN_ATTENTE ? (
        <Button variant="secondary" size="sm"
          onClick={() => validerCotisation(
            { tontineId: id!, cotisationId: row.id },
            { onSuccess: () => toast.success('Cotisation validée'), onError: () => toast.error('Erreur') }
          )}>
          <CheckCircle size={16} />
        </Button>
      ) : null,
    },
  ]

  return (
    <AppLayout>
      <div className="min-h-screen bg-neutral-50 py-8 px-0 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <PageHeader
              title={<span className="text-3xl font-extrabold tracking-tight text-neutral-900">{tontine.nom}</span>}
              description={<span className="text-lg text-neutral-500">{tontine.description}</span>}
              action={
                <div className="flex gap-2">
                  {tontine.statut === TontineStatut.BROUILLON && (
                    <Button className="rounded-full shadow-md" size="lg" onClick={() => setConfirm({ action: 'activer', label: 'Activer cette tontine ?' })}>
                      <Play size={18} className="mr-2" /> Activer
                    </Button>
                  )}
                  {tontine.statut === TontineStatut.ACTIVE && (
                    <Button variant="danger" className="rounded-full shadow-md" size="lg" onClick={() => setConfirm({ action: 'suspendre', label: 'Suspendre cette tontine ?', danger: true })}>
                      <Pause size={18} className="mr-2" /> Suspendre
                    </Button>
                  )}
                </div>
              }
            />
          </div>

          {/* Résumé */}
          <Card className="mb-8 shadow-lg rounded-3xl bg-white/90 backdrop-blur-sm border border-neutral-100">
            <div className="flex flex-wrap gap-8 justify-between items-center px-2 py-4 sm:px-8 sm:py-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Statut</span>
                <Badge variant={statutVariants[tontine.statut]} className="text-base px-4 py-1 rounded-full font-semibold">{tontine.statut}</Badge>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Montant</span>
                <span className="text-2xl font-extrabold text-primary-600">{tontine.montant.toLocaleString()} FCFA</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Membres</span>
                <span className="text-2xl font-extrabold">{tontine.nombreMembresActuels}/{tontine.nombreMembres}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Mode</span>
                <span className="text-lg font-bold text-neutral-800 uppercase tracking-wide">{tontine.modeCycle}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Fréquence</span>
                <span className="text-lg font-bold text-neutral-800 uppercase tracking-wide">{tontine.frequence}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">Créateur</span>
                <span className="text-lg font-bold text-neutral-800">{tontine.creePar.firstName} {tontine.creePar.lastName}</span>
              </div>
            </div>
          </Card>

          {/* Onglets */}
          <Card noPadding className="shadow-md rounded-3xl">
            <div className="border-b border-neutral-200 flex overflow-x-auto bg-white rounded-t-3xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium whitespace-nowrap transition-colors focus:outline-none ${
                    activeTab === tab.id
                      ? 'bg-primary-50 border-b-2 border-primary-500 text-primary-600 rounded-t-2xl shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <CardBody className="bg-white rounded-b-3xl">
              {activeTab === 'infos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
                  <div><span className="text-xs text-neutral-500">Date de début</span><p className="font-semibold text-lg mt-1">{new Date(tontine.dateDebut).toLocaleDateString('fr-FR')}</p></div>
                  <div><span className="text-xs text-neutral-500">Ordre bénéficiaire</span><p className="font-semibold text-lg mt-1">{tontine.ordreBeneficiaire}</p></div>
                  <div><span className="text-xs text-neutral-500">Créé le</span><p className="font-semibold text-lg mt-1">{new Date(tontine.createdAt).toLocaleDateString('fr-FR')}</p></div>
                  <div><span className="text-xs text-neutral-500">Modifié le</span><p className="font-semibold text-lg mt-1">{new Date(tontine.updatedAt).toLocaleDateString('fr-FR')}</p></div>
                </div>
              )}
              {activeTab === 'membres' && (
                <Table columns={membreColumns} data={membresData?.content || []} isLoading={membresLoading} emptyMessage="Aucun membre" />
              )}
              {activeTab === 'cycles' && (
                <Table columns={cycleColumns} data={cyclesData?.content || []} isLoading={cyclesLoading} emptyMessage="Aucun cycle" />
              )}
              {activeTab === 'cotisations' && (
                <div>
                  {/* ── Section Action requise : membres pre-enrolled sans cotisation ── */}
                  {membresPreEnrolledSansCotisation.length > 0 && (
                    <div className="mb-6 rounded-2xl border-l-4 border-orange-400 bg-orange-50 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                        <AlertTriangle size={16} className="text-orange-500 shrink-0" />
                        <span className="text-sm font-bold text-orange-700 uppercase tracking-wide">
                          Action requise —{' '}
                          {membresPreEnrolledSansCotisation.length}{' '}
                          {membresPreEnrolledSansCotisation.length > 1
                            ? 'membres sans cotisation'
                            : 'membre sans cotisation'}
                        </span>
                        {cycleEnCours && (
                          <span className="ml-auto text-xs text-orange-500 font-medium">
                            Cycle #{cycleEnCours.numeroCycle} en cours
                          </span>
                        )}
                      </div>

                      {/* Cards membres */}
                      <div className="px-4 pb-4 space-y-2">
                        {membresPreEnrolledSansCotisation.map((m) => {
                          const initials = `${m.user.firstName[0]}${m.user.lastName[0]}`.toUpperCase()
                          const nomComplet = `${m.user.firstName} ${m.user.lastName}`
                          return (
                            <div
                              key={m.id}
                              className="flex items-center gap-3 bg-white rounded-xl border border-orange-200 px-4 py-3 shadow-sm"
                            >
                              {/* Avatar */}
                              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {initials}
                              </div>

                              {/* Nom + badges */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-neutral-900 text-sm truncate">{nomComplet}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                                    Sans compte
                                  </span>
                                  <span className="text-xs text-neutral-400">{m.user.phone}</span>
                                  {tontine && (
                                    <span className="text-xs text-neutral-500 font-medium">
                                      · {tontine.montant.toLocaleString('fr-FR')} FCFA attendus
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* CTA */}
                              <Button
                                size="sm"
                                onClick={() =>
                                  setPaiementModal({
                                    isOpen: true,
                                    membreId: m.id,
                                    membreNom: nomComplet,
                                    cycleId: cycleEnCours!.id,
                                  })
                                }
                                className="shrink-0 gap-1.5"
                              >
                                <CreditCard size={14} />
                                Déclarer le paiement
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Tableau cotisations ── */}
                  <Table
                    columns={cotisationColumns}
                    data={cotisationsData?.content || []}
                    isLoading={cotisationsLoading}
                    emptyMessage="Aucune cotisation"
                  />
                </div>
              )}
              {activeTab === 'commissions' && (
                <div>
                  {commissionsLoading ? <Spinner /> : (
                    <div className="space-y-3">
                      {(commissionsData?.content || []).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl bg-neutral-50">
                          <div>
                            <p className="font-semibold text-neutral-800">{c.type}</p>
                            <p className="text-sm text-neutral-500">{c.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-primary-600">
                              {c.type === 'POURCENTAGE_JACKPOT' ? `${c.valeur}%` : `${c.valeur.toLocaleString()} FCFA`}
                            </p>
                            <Button variant="danger" size="sm"
                              onClick={() => deleteCommission(
                                { tontineId: id!, commissionId: c.id },
                                { onSuccess: () => toast.success('Commission supprimée'), onError: () => toast.error('Erreur') }
                              )}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(commissionsData?.content || []).length === 0 && (
                        <p className="text-neutral-500 text-center py-4">Aucune commission configurée</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {confirm && (
            <ConfirmDialog
              isOpen
              onClose={() => setConfirm(null)}
              onConfirm={handleConfirm}
              title={confirm.label}
              message=""
              confirmText="Confirmer"
              isDangerous={confirm.danger}
              isLoading={isActivating || isSuspending}
            />
          )}

          {/* Modal paiement admin pour membres pre-enrolled */}
          {id && cycleEnCours && (
            <AdminEnregistrerPaiementModal
              isOpen={paiementModal.isOpen}
              onClose={() => setPaiementModal((s) => ({ ...s, isOpen: false }))}
              tontineId={id}
              cycleId={paiementModal.cycleId}
              membreId={paiementModal.membreId}
              membreNom={paiementModal.membreNom}
              montantDefaut={tontine.montant}
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
