/**
 * MobileQuickActions — FAB speed-dial mobile (contextuel)
 *
 * Dashboard            : Créer une tontine uniquement
 * Tontine (créateur)   : Enregistrer paiement + Ajouter membre + Créer tontine
 * Tontine (membre) ou pages cotisations/tontines : Déclarer mon paiement
 * Ailleurs             : masqué
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Plus, X, CreditCard, UserPlus, BookCopy, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { CycleStatut, MembreStatut } from '@/types/common'
import { AdminEnregistrerPaiementModal } from '@/components/shared/AdminEnregistrerPaiementModal'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { MemberPayModal } from '@/components/shared/MemberPayModal'
import { Modal } from '@/components/ui/Modal'
import { useTontine } from '@/hooks/useTontines'
import { useCycles } from '@/hooks/useCycles'
import { useMembres } from '@/hooks/useMembres'
import { Membre } from '@/types/membre'

// ─── Helpers URL ──────────────────────────────────────────────────────────────

function useTontineContext(): string | null {
  const location = useLocation()
  const match = location.pathname.match(/\/tontines\/([^/]+)$/)
  return match ? match[1] : null
}

function useIsDashboard(): boolean {
  const location = useLocation()
  return /\/(dashboard|accueil)\/?$/.test(location.pathname) || location.pathname === '/'
}

// Pages où le membre voit le FAB "Déclarer mon paiement"
function useIsMemberPage(): boolean {
  const location = useLocation()
  return /\/(dashboard|cotisations|tontines)\/?$/.test(location.pathname)
}

interface SpeedAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  onClick: () => void
}

export function MobileQuickActions() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const tontineId   = useTontineContext()
  const isDashboard  = useIsDashboard()
  const isMemberPage = useIsMemberPage()
  const isInTontine  = !!tontineId

  const [isOpen, setIsOpen] = useState(false)
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null)
  const [paiementModal, setPaiementModal] = useState(false)
  const [addMembreModal, setAddMembreModal] = useState(false)
  const [createTontineModal, setCreateTontineModal] = useState(false)
  const [memberPayModal, setMemberPayModal] = useState(false)

  // Données tontine courante (si on est dans une tontine)
  const { data: tontine } = useTontine(tontineId || '')
  const { data: cyclesData } = useCycles(tontineId || '', 0, 50)
  const cycles = cyclesData?.content || []
  const cycleEnCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)

  const { data: membresData } = useMembres(tontineId || '', 0, 100)
  const membres = (membresData?.content || []).filter(
    (m: Membre) => m.statut === MembreStatut.ACTIF
  )
  const membresFiltrés = membres.filter((m: Membre) => {
    const q = pickerSearch.toLowerCase()
    return !q || `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(q)
  })

  // L'utilisateur est-il créateur de la tontine courante ?
  const normalizePhone = (p: string) => p.replace(/^\+?221/, '')
  const isCreatorOfCurrentTontine =
    isInTontine &&
    tontine &&
    user &&
    normalizePhone(tontine.creePar.phone) === normalizePhone(user.phone)

  // Ferme le FAB au clic extérieur
  const fabRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const onClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isOpen])

  const close = () => setIsOpen(false)

  // ─── Règles d'affichage ────────────────────────────────────────────────────
  // Masqué si : pas connecté, ou hors dashboard/pages-membre ET hors tontine
  if (!user) return null
  if (!isDashboard && !isMemberPage && !isInTontine) return null

  // ─── Handler paiement (gestionnaire de la tontine) ─────────────────────────
  const handleOpenPaiement = () => {
    close()
    if (!cycleEnCours || membres.length === 0) {
      navigate(`/admin/tontines/${tontineId}`)
      return
    }
    setPickerSearch('')
    setMemberPickerOpen(true)
  }
  const handleSelectMembre = (m: Membre) => {
    setSelectedMembre(m)
    setMemberPickerOpen(false)
    setPaiementModal(true)
  }

  // ─── Construction des actions selon contexte ───────────────────────────────
  let actions: SpeedAction[]

  if (isDashboard) {
    // Dashboard → créer une tontine uniquement
    actions = [
      {
        id: 'tontine',
        label: 'Créer une tontine',
        icon: <BookCopy size={18} />,
        color: 'bg-primary-600 text-white',
        onClick: () => { close(); setCreateTontineModal(true) },
      },
    ]
  } else if (isInTontine && isCreatorOfCurrentTontine) {
    // Dans une tontine dont on est créateur → 3 actions
    actions = [
      { id: 'paiement', label: 'Enregistrer paiement', icon: <CreditCard size={18} />, color: 'bg-primary-600 text-white', onClick: handleOpenPaiement },
      { id: 'membre',   label: 'Ajouter un membre',    icon: <UserPlus size={18} />,   color: 'bg-blue-600 text-white',    onClick: () => { close(); setAddMembreModal(true) } },
      { id: 'tontine',  label: 'Créer une tontine',    icon: <BookCopy size={18} />,   color: 'bg-purple-600 text-white',  onClick: () => { close(); setCreateTontineModal(true) } },
    ]
  } else if (isInTontine || isMemberPage) {
    // Dans une tontine où on est simple membre, ou sur cotisations/tontines → déclarer paiement
    actions = [
      {
        id: 'pay',
        label: 'Déclarer mon paiement',
        icon: <CreditCard size={18} />,
        color: 'bg-primary-600 text-white',
        onClick: () => { close(); setMemberPayModal(true) },
      },
    ]
  } else {
    return null
  }

  const singleAction = actions.length === 1 ? actions[0] : null

  return (
    <>
      {/* Backdrop */}
      {isOpen && !singleAction && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-30 backdrop-blur-[1px]"
          onClick={close}
        />
      )}

      {/* FAB */}
      <div
        ref={fabRef}
        className="md:hidden fixed z-40"
        style={{ bottom: '8px', left: '50%', transform: 'translateX(-50%)' }}
      >
        {/* Speed-dial items */}
        {!singleAction && (
          <div className="flex flex-col items-center gap-3 mb-3">
            {actions.map((action, idx) => (
              <div
                key={action.id}
                className={clsx(
                  'flex items-center gap-3 transition-all duration-200',
                  isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                )}
                style={{
                  transitionDelay: isOpen
                    ? `${idx * 60}ms`
                    : `${(actions.length - 1 - idx) * 40}ms`,
                }}
              >
                <span className="bg-neutral-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
                <button
                  onClick={action.onClick}
                  className={clsx('w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90', action.color)}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bouton principal */}
        <div className="flex justify-center">
          <button
            onClick={singleAction ? singleAction.onClick : () => setIsOpen(!isOpen)}
            className={clsx(
              'w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90',
              isOpen && !singleAction ? 'bg-neutral-800 text-white' : 'bg-primary-600 text-white'
            )}
            aria-label={singleAction ? singleAction.label : isOpen ? 'Fermer' : 'Actions rapides'}
            aria-expanded={singleAction ? undefined : isOpen}
          >
            <span
              className="transition-transform duration-200"
              style={{ transform: isOpen && !singleAction ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              {isOpen && !singleAction ? <X size={22} /> : <Plus size={24} />}
            </span>
          </button>
        </div>
      </div>

      {/* Picker membre — Admin */}
      <Modal
        isOpen={memberPickerOpen}
        onClose={() => setMemberPickerOpen(false)}
        title="Choisir un membre"
        size="sm"
      >
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            autoFocus
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {membresFiltrés.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-400">Aucun membre actif trouvé</p>
          ) : (
            membresFiltrés.map((m: Membre) => (
              <button
                key={m.id}
                onClick={() => handleSelectMembre(m)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary-50 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase">
                  {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="text-xs text-neutral-400">{m.user.phone}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Modal paiement admin */}
      {isCreatorOfCurrentTontine && tontineId && cycleEnCours && selectedMembre && (
        <AdminEnregistrerPaiementModal
          isOpen={paiementModal}
          onClose={() => { setPaiementModal(false); setSelectedMembre(null) }}
          tontineId={tontineId}
          cycleId={cycleEnCours.id}
          membreId={selectedMembre.id}
          membreNom={`${selectedMembre.user.firstName} ${selectedMembre.user.lastName}`}
          montantDefaut={tontine?.montant}
        />
      )}

      {/* Modal ajouter membre */}
      {isCreatorOfCurrentTontine && tontineId && (
        <AddMembreModal
          tontineId={tontineId}
          isOpen={addMembreModal}
          onClose={() => setAddMembreModal(false)}
        />
      )}

      {/* Modal créer tontine */}
      <CreateTontineModal
        isOpen={createTontineModal}
        onClose={() => setCreateTontineModal(false)}
      />

      {/* Modal paiement membre */}
      <MemberPayModal
        isOpen={memberPayModal}
        onClose={() => setMemberPayModal(false)}
        tontineId={tontineId ?? undefined}
      />
    </>
  )
}
