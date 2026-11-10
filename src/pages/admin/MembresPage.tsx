import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { useMembres, useUpdateMembreStatut, useRemoveMembre } from '@/hooks/useMembres'
import { useCycles } from '@/hooks/useCycles'
import { Membre } from '@/types/membre'
import { Cycle } from '@/types/cycle'
import { MembreStatut, AccountStatus, CycleStatut } from '@/types/common'
import { Plus, MoreHorizontal, Search, Clock, CreditCard } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChipRow } from '@/components/ui/ChipRow'

type MembreAction = { type: 'suspendre' | 'activer' | 'retirer'; membreId: string; nom: string; tontineId: string } | null

const STATUT_VARIANT: Record<MembreStatut, 'success' | 'warning' | 'error'> = {
  ACTIF: 'success',
  SUSPENDU: 'warning',
  SORTI: 'error',
}

function MiniAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-primary-600', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <span className={`w-8 h-8 rounded-full ${colors[idx]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </span>
  )
}

function MembreActionsMenu({ membre, tontineId, onAction, canPay, onPayment }: {
  membre: Membre
  tontineId: string
  onAction: (a: MembreAction) => void
  canPay?: boolean
  onPayment?: () => void
}) {
  const [open, setOpen] = useState(false)
  const nom = `${membre.user.firstName} ${membre.user.lastName}`
  const isEligiblePayment = membre.statut !== MembreStatut.SORTI && membre.statut !== MembreStatut.SUSPENDU

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-neutral-200 z-20 overflow-hidden text-sm">
            {canPay && isEligiblePayment && (
              <button
                onClick={() => { setOpen(false); onPayment?.() }}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-primary-50 text-primary-700 font-medium transition-colors"
              >
                <CreditCard size={14} /> Enregistrer paiement
              </button>
            )}
            {membre.statut === MembreStatut.ACTIF && (
              <button
                onClick={() => { setOpen(false); onAction({ type: 'suspendre', membreId: membre.id, nom, tontineId }) }}
                className={`w-full flex items-center px-4 py-2.5 hover:bg-neutral-50 text-orange-600 transition-colors ${canPay && isEligiblePayment ? 'border-t border-neutral-100' : ''}`}
              >
                Suspendre
              </button>
            )}
            {membre.statut === MembreStatut.SUSPENDU && (
              <button
                onClick={() => { setOpen(false); onAction({ type: 'activer', membreId: membre.id, nom, tontineId }) }}
                className="w-full flex items-center px-4 py-2.5 hover:bg-neutral-50 text-primary-600 transition-colors"
              >
                Réactiver
              </button>
            )}
            {membre.statut !== MembreStatut.SORTI && (
              <button
                onClick={() => { setOpen(false); onAction({ type: 'retirer', membreId: membre.id, nom, tontineId }) }}
                className="w-full flex items-center px-4 py-2.5 hover:bg-neutral-50 text-red-600 transition-colors border-t border-neutral-100"
              >
                Retirer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function MembresPage() {
  const [selectedTontineId, setSelectedTontineId] = useState('')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [action, setAction] = useState<MembreAction>(null)
  const [paymentModal, setPaymentModal] = useState<{ membreId: string; membreNom: string; cycleId: string } | null>(null)

  const { data: tontinesData, isLoading: loadingTontines } = useTontines(0, 50)
  const tontines = tontinesData?.content || []

  const activeTontineId = selectedTontineId || tontines[0]?.id || ''

  const { data: membresData, isLoading: loadingMembres } = useMembres(activeTontineId, page, 20)
  const { data: cyclesData } = useCycles(activeTontineId, 0, 50)
  const currentCycle = cyclesData?.content?.find((c: Cycle) => c.statut === CycleStatut.EN_COURS)
  const activeTontine = tontines.find((t) => t.id === activeTontineId)
  const { mutate: updateStatut, isPending: isUpdating } = useUpdateMembreStatut()
  const { mutate: removeMembre, isPending: isRemoving } = useRemoveMembre()

  const membres = membresData?.content || []
  const totalPages = membresData?.totalPages || 1

  const filtered = membres.filter((m: Membre) => {
    const q = search.toLowerCase()
    return !q ||
      `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(q) ||
      m.user.phone.includes(q)
  })

  const handleConfirmAction = () => {
    if (!action) return
    if (action.type === 'retirer') {
      removeMembre(
        { tontineId: action.tontineId, membreId: action.membreId },
        { onSuccess: () => { toast.success('Membre retiré'); setAction(null) }, onError: () => toast.error('Erreur') }
      )
    } else {
      const statut = action.type === 'activer' ? MembreStatut.ACTIF : MembreStatut.SUSPENDU
      updateStatut(
        { tontineId: action.tontineId, membreId: action.membreId, request: { statut } },
        { onSuccess: () => { toast.success('Statut mis à jour'); setAction(null) }, onError: () => toast.error('Erreur') }
      )
    }
  }

  const confirmConfig = action ? {
    suspendre: { title: 'Suspendre ce membre ?', message: `${action.nom} sera suspendu temporairement.`, danger: true, confirmText: 'Suspendre' },
    activer: { title: 'Réactiver ce membre ?', message: `${action.nom} sera réactivé.`, danger: false, confirmText: 'Réactiver' },
    retirer: { title: 'Retirer ce membre ?', message: `${action.nom} sera définitivement retiré.`, danger: true, confirmText: 'Retirer' },
  }[action.type] : null

  if (loadingTontines) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        title="Membres"
        description={activeTontine ? `${activeTontine.nom} · ${membresData?.totalElements ?? 0} membre${(membresData?.totalElements ?? 0) > 1 ? 's' : ''}` : 'Gérez les participants de vos tontines.'}
        action={
          <Button onClick={() => setIsAddOpen(true)} disabled={!activeTontineId}>
            <Plus size={18} /> Ajouter
          </Button>
        }
      />

      {/* Choix de la tontine (les membres sont gérés tontine par tontine) */}
      {tontines.length > 1 && (
        <ChipRow className="mb-3">
          {tontines.map((t) => (
            <button
              aria-pressed={activeTontineId === t.id}
              key={t.id}
              onClick={() => { setSelectedTontineId(t.id); setPage(0); setSearch('') }}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTontineId === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4">
          <div className="relative sm:max-w-sm">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full h-11 pl-11 pr-4 text-[15px] border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-neutral-50 mt-3">
          {loadingMembres ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-neutral-400 text-sm">Aucun membre</p>
          ) : (
            filtered.map((m: Membre) => {
              const nom = `${m.user.firstName} ${m.user.lastName}`
              const tontine = tontines.find((t) => t.id === activeTontineId)
              const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
              return (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <MiniAvatar name={nom} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-neutral-900 truncate">{nom}</p>
                        {isPreEnrolled && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">
                            <Clock size={9} /> Non inscrit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">{tontine?.nom || m.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={STATUT_VARIANT[m.statut]}>
                      {m.statut === 'ACTIF' ? 'Actif' : m.statut === 'SUSPENDU' ? 'Susp.' : 'Sorti'}
                    </Badge>
                    <MembreActionsMenu
                      membre={m}
                      tontineId={activeTontineId}
                      onAction={setAction}
                      canPay={!!currentCycle}
                      onPayment={() => setPaymentModal({ membreId: m.id, membreNom: nom, cycleId: currentCycle!.id })}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Membre', 'Tontine', 'Ordre', 'Adhésion', 'Statut', 'Compte', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingMembres ? (
                <tr><td colSpan={7} className="text-center py-10"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-neutral-400">Aucun membre dans cette tontine</td></tr>
              ) : (
                filtered.map((m: Membre) => {
                  const nom = `${m.user.firstName} ${m.user.lastName}`
                  const tontine = tontines.find((t) => t.id === activeTontineId)
                  const isPreEnrolled = m.user.accountStatus === AccountStatus.PRE_ENROLLED
                  return (
                    <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <MiniAvatar name={nom} />
                          <div>
                            <p className="font-semibold text-neutral-900">{nom}</p>
                            <p className="text-xs text-neutral-500">{m.user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">{tontine?.nom || '—'}</td>
                      <td className="px-5 py-4 text-neutral-700">#{m.ordreJackpot || '—'}</td>
                      <td className="px-5 py-4 text-neutral-500 text-xs">
                        {m.dateAdhesion ? new Date(m.dateAdhesion).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={STATUT_VARIANT[m.statut]}>
                          {m.statut === 'ACTIF' ? 'Actif' : m.statut === 'SUSPENDU' ? 'Suspendu' : 'Sorti'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {isPreEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 cursor-help" title="Ce membre n'a pas encore activé son compte">
                            <Clock size={10} /> Non inscrit
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <MembreActionsMenu
                          membre={m}
                          tontineId={activeTontineId}
                          onAction={setAction}
                          canPay={!!currentCycle}
                          onPayment={() => setPaymentModal({ membreId: m.id, membreNom: nom, cycleId: currentCycle!.id })}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-neutral-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={membresData?.totalElements}
              pageSize={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal ajouter membre — 2 étapes (scoped sur la tontine active) */}
      <AddMembreModal
        tontineId={activeTontineId}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {/* Modal enregistrer paiement admin */}
      {paymentModal && currentCycle && (
        <AdminEnregistrerPaiementModal
          isOpen={!!paymentModal}
          onClose={() => setPaymentModal(null)}
          tontineId={activeTontineId}
          cycleId={paymentModal.cycleId}
          membreId={paymentModal.membreId}
          membreNom={paymentModal.membreNom}
          montantDefaut={activeTontine?.montant}
        />
      )}

      {action && confirmConfig && (
        <ConfirmDialog
          isOpen
          onClose={() => setAction(null)}
          onConfirm={handleConfirmAction}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          isDangerous={confirmConfig.danger}
          isLoading={isUpdating || isRemoving}
        />
      )}
    </AppLayout>
  )
}
