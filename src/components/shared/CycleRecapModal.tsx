import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useCotisationRecap } from '@/hooks/useCotisations'
import { CotisationRecapItem } from '@/types/cotisation'
import { EditCotisationInitialValues } from './AdminEditCotisationModal'
import { Cycle } from '@/types/cycle'
import { CycleStatut, CotisationStatut, AccountStatus, MembreStatut } from '@/types/common'
import { Edit2, CreditCard } from 'lucide-react'
import { AdminEditCotisationModal } from './AdminEditCotisationModal'
import { AdminEnregistrerPaiementModal } from './AdminEnregistrerPaiementModal'

interface Props {
  isOpen: boolean
  onClose: () => void
  tontineId: string
  cycle: Cycle
  montantDefaut?: number
}

interface EditState {
  isOpen: boolean
  cotisationId: string
  membreNom: string
  initialValues: EditCotisationInitialValues
}

interface PaiementState {
  isOpen: boolean
  membreId: string
  membreNom: string
}

const STATUT_BADGE: Record<CotisationStatut, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  VALIDE:     { label: 'Validé',     variant: 'success' },
  EN_ATTENTE: { label: 'En attente', variant: 'warning' },
  EN_RETARD:  { label: 'En retard',  variant: 'error'   },
}

function statutBadge(statut: CotisationStatut | null) {
  if (statut === null) return <Badge variant="default">Non payé</Badge>
  const { label, variant } = STATUT_BADGE[statut]
  return <Badge variant={variant}>{label}</Badge>
}

function canEdit(item: CotisationRecapItem, cycleEnCours: boolean): boolean {
  if (!item.cotisationId) return false
  if (item.statutCotisation === CotisationStatut.EN_RETARD) return false
  if (item.statutCotisation === CotisationStatut.EN_ATTENTE) return true
  if (item.statutCotisation === CotisationStatut.VALIDE && cycleEnCours) return true
  return false
}

export function CycleRecapModal({ isOpen, onClose, tontineId, cycle, montantDefaut }: Props) {
  const { data: recapItems, isLoading } = useCotisationRecap(tontineId, cycle.id, isOpen)

  const [editState, setEditState] = useState<EditState>({
    isOpen: false,
    cotisationId: '',
    membreNom: '',
    initialValues: { montant: 0, methodePaiement: 'CASH' },
  })
  const [paiementState, setPaiementState] = useState<PaiementState>({
    isOpen: false,
    membreId: '',
    membreNom: '',
  })

  const sorted = [...(recapItems || [])].sort((a, b) => a.ordreJackpot - b.ordreJackpot)
  const cycleEnCours = cycle.statut === CycleStatut.EN_COURS

  const payeCount = sorted.filter((r) => r.statutCotisation !== null).length
  const totalValide = sorted
    .filter((r) => r.statutCotisation === CotisationStatut.VALIDE)
    .reduce((sum, r) => sum + (r.montant ?? 0), 0)

  const openEdit = (item: CotisationRecapItem) =>
    setEditState({
      isOpen: true,
      cotisationId: item.cotisationId!,
      membreNom: `${item.firstName} ${item.lastName}`,
      initialValues: {
        montant: item.montant!,
        methodePaiement: item.methodePaiement!,
        referenceTransaction: item.referenceTransaction,
        note: item.note,
      },
    })

  const openPaiement = (item: CotisationRecapItem) =>
    setPaiementState({
      isOpen: true,
      membreId: item.membreId,
      membreNom: `${item.firstName} ${item.lastName}`,
    })

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Récapitulatif cotisations — Cycle ${cycle.numeroCycle}`}
        size="xl"
        footer={<Button variant="ghost" onClick={onClose}>Fermer</Button>}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div>
            {/* ── Stats ── */}
            <div className="flex items-center gap-6 mb-5 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-neutral-900">
                  {payeCount}<span className="text-neutral-400 font-medium text-base">/{sorted.length}</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">Ont payé</p>
              </div>
              <div className="w-px h-10 bg-neutral-200" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-primary-600">
                  {totalValide.toLocaleString('fr-FR')}
                  <span className="text-sm font-medium text-neutral-500 ml-1">FCFA</span>
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">Validés</p>
              </div>
              {cycleEnCours && (
                <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  Cycle en cours
                </span>
              )}
            </div>

            {/* ── Tableau ── */}
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 w-8">#</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500">Membre</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500">Statut</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500">Montant</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500">Méthode</th>
                    <th className="text-right py-2.5 px-3 text-xs font-semibold text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => (
                    <tr
                      key={item.membreId}
                      className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 transition-colors"
                    >
                      <td className="py-3 px-3 text-neutral-400 font-medium text-xs">{item.ordreJackpot}</td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-neutral-900 leading-tight">
                          {item.firstName} {item.lastName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-neutral-400">{item.phone}</span>
                          {item.accountStatus === AccountStatus.PRE_ENROLLED && (
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide">
                              Pré-inscrit
                            </span>
                          )}
                          {item.statutMembre === MembreStatut.SUSPENDU && (
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide">
                              Suspendu
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">{statutBadge(item.statutCotisation)}</td>

                      <td className="py-3 px-3 text-right font-semibold text-neutral-800 tabular-nums">
                        {item.montant !== null
                          ? `${item.montant.toLocaleString('fr-FR')} FCFA`
                          : <span className="text-neutral-400 font-normal">—</span>}
                      </td>

                      <td className="py-3 px-3 text-neutral-600 text-xs">
                        {item.methodePaiement ?? <span className="text-neutral-400">—</span>}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit(item, cycleEnCours) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              title="Modifier la cotisation"
                              onClick={() => openEdit(item)}
                            >
                              <Edit2 size={14} />
                            </Button>
                          )}
                          {item.cotisationId === null && cycleEnCours && (
                            <Button
                              size="sm"
                              title="Enregistrer un paiement"
                              onClick={() => openPaiement(item)}
                            >
                              <CreditCard size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-neutral-400 text-sm">
                        Aucun membre trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <AdminEditCotisationModal
        isOpen={editState.isOpen}
        onClose={() => setEditState((s) => ({ ...s, isOpen: false }))}
        tontineId={tontineId}
        cotisationId={editState.cotisationId}
        membreNom={editState.membreNom}
        initialValues={editState.initialValues}
      />

      <AdminEnregistrerPaiementModal
        isOpen={paiementState.isOpen}
        onClose={() => setPaiementState((s) => ({ ...s, isOpen: false }))}
        tontineId={tontineId}
        cycleId={cycle.id}
        membreId={paiementState.membreId}
        membreNom={paiementState.membreNom}
        montantDefaut={montantDefaut}
      />
    </>
  )
}
