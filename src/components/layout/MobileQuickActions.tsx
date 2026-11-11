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
import { Plus, X, CreditCard, UserPlus, BookCopy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useTontine } from '@/hooks/useTontines'

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
  const [addMembreModal, setAddMembreModal] = useState(false)
  const [createTontineModal, setCreateTontineModal] = useState(false)

  // Données tontine courante (si on est dans une tontine)
  const { data: tontine } = useTontine(tontineId || '')

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
    navigate(`/encaisser/${tontineId}`)
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
        onClick: () => { close(); navigate(tontineId ? `/payer/${tontineId}` : '/payer') },
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
        style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)' }}
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

    </>
  )
}
