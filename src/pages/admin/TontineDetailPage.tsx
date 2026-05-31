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
import { useTontine, useActiverTontine, useSuspendreTontine, useCommissions, useDeleteCommission } from '@/hooks/useTontines'
import { useMembres, useRemoveMembre, useUpdateMembreStatut } from '@/hooks/useMembres'
import { useCycles, useCloturerCycle } from '@/hooks/useCycles'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { Membre } from '@/types/membre'
import { Cycle } from '@/types/cycle'
import { Cotisation } from '@/types/cotisation'
import { TontineStatut, CycleStatut, CotisationStatut, MembreStatut } from '@/types/common'
import { ArrowLeft, Play, Pause, Trash2, CheckCircle, UserMinus } from 'lucide-react'

type Tab = 'infos' | 'membres' | 'cycles' | 'cotisations' | 'commissions'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  BROUILLON: 'warning',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
}

export function TontineDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('infos')
  const [confirm, setConfirm] = useState<{ action: string; label: string; danger?: boolean } | null>(null)

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

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>
  if (!tontine) return <AppLayout><div className="text-center py-12 text-neutral-600">Tontine non trouvée</div></AppLayout>

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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={20} /></Button>
        <PageHeader
          title={tontine.nom}
          description={tontine.description}
          action={
            <div className="flex gap-2">
              {tontine.statut === TontineStatut.BROUILLON && (
                <Button onClick={() => setConfirm({ action: 'activer', label: 'Activer cette tontine ?' })}>
                  <Play size={16} /> Activer
                </Button>
              )}
              {tontine.statut === TontineStatut.ACTIVE && (
                <Button variant="secondary" onClick={() => setConfirm({ action: 'suspendre', label: 'Suspendre cette tontine ?', danger: true })}>
                  <Pause size={16} /> Suspendre
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Résumé */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-sm text-neutral-500">Statut</p>
            <Badge variant={statutVariants[tontine.statut]}>{tontine.statut}</Badge>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Montant</p>
            <p className="text-xl font-bold text-primary-600">{tontine.montant.toLocaleString()} FCFA</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Membres</p>
            <p className="text-xl font-bold">{tontine.nombreMembresActuels}/{tontine.nombreMembres}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Mode</p>
            <p className="text-xl font-bold">{tontine.modeCycle}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Fréquence</p>
            <p className="text-xl font-bold">{tontine.frequence}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Créateur</p>
            <p className="text-xl font-bold">{tontine.creePar.firstName} {tontine.creePar.lastName}</p>
          </div>
        </div>
      </Card>

      {/* Onglets */}
      <Card noPadding>
        <div className="border-b border-neutral-200 flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-500 text-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CardBody>
          {activeTab === 'infos' && (
            <div className="grid grid-cols-2 gap-6">
              <div><p className="text-sm text-neutral-500">Date de début</p><p className="font-semibold">{new Date(tontine.dateDebut).toLocaleDateString('fr-FR')}</p></div>
              <div><p className="text-sm text-neutral-500">Ordre bénéficiaire</p><p className="font-semibold">{tontine.ordreBeneficiaire}</p></div>
              <div><p className="text-sm text-neutral-500">Créé le</p><p className="font-semibold">{new Date(tontine.createdAt).toLocaleDateString('fr-FR')}</p></div>
              <div><p className="text-sm text-neutral-500">Modifié le</p><p className="font-semibold">{new Date(tontine.updatedAt).toLocaleDateString('fr-FR')}</p></div>
            </div>
          )}
          {activeTab === 'membres' && (
            <Table columns={membreColumns} data={membresData?.content || []} isLoading={membresLoading} emptyMessage="Aucun membre" />
          )}
          {activeTab === 'cycles' && (
            <Table columns={cycleColumns} data={cyclesData?.content || []} isLoading={cyclesLoading} emptyMessage="Aucun cycle" />
          )}
          {activeTab === 'cotisations' && (
            <Table columns={cotisationColumns} data={cotisationsData?.content || []} isLoading={cotisationsLoading} emptyMessage="Aucune cotisation" />
          )}
          {activeTab === 'commissions' && (
            <div>
              {commissionsLoading ? <Spinner /> : (
                <div className="space-y-3">
                  {(commissionsData?.content || []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                      <div>
                        <p className="font-semibold">{c.type}</p>
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
    </AppLayout>
  )
}
