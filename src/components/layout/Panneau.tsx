import { createContext, ReactNode, useContext } from 'react'
import { X } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'

/**
 * Panneau de détail desktop (« liste à gauche, détail à droite »).
 *
 * Un écran de détail (fiche membre, tour…) reste un seul composant :
 * - en plein écran (mobile / PWA, ou ouverture directe) : en-tête avec retour, barre d'action fixée en bas ;
 * - dans un panneau (desktop, à côté de sa liste) : en-tête compact avec « Fermer », barre d'action collée en bas du panneau.
 * L'écran n'a qu'à utiliser `EcranDetail` et `BarreAction` à la place de son propre gabarit.
 */
interface PanneauValue {
  onClose: () => void
}

const PanneauContext = createContext<PanneauValue | null>(null)

/** true si l'écran est affiché dans un panneau desktop */
export function useDansPanneau(): boolean {
  return useContext(PanneauContext) !== null
}

/** Conteneur du panneau (colonne de droite de la page liste) : collé en haut, défile seul */
export function Panneau({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  return (
    <PanneauContext.Provider value={{ onClose }}>
      <aside
        aria-label={label}
        className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-3xl bg-[#e9ebee] ring-1 ring-neutral-200"
      >
        {children}
      </aside>
    </PanneauContext.Provider>
  )
}

/** Gabarit d'un écran de détail : plein écran ou panneau selon le contexte */
export function EcranDetail({ title, children }: { title: string; children: ReactNode }) {
  const panneau = useContext(PanneauContext)
  if (!panneau) {
    return (
      <div className="min-h-[100dvh] bg-[#f2f3f5]">
        <ScreenHeader title={title} />
        <main className="px-4 pb-6 max-w-lg mx-auto">{children}</main>
      </div>
    )
  }
  return (
    <div>
      <header className="sticky top-0 z-10 bg-[#e9ebee]/95 backdrop-blur px-4 pt-3 pb-2 flex items-center gap-2">
        <h2 className="flex-1 text-[17px] font-bold text-neutral-900 truncate">{title}</h2>
        <button
          onClick={panneau.onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:bg-black/5"
          aria-label="Fermer le détail"
          title="Fermer"
        >
          <X size={20} />
        </button>
      </header>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

/** Barre de l'action principale : fixée en bas de l'écran, ou collée en bas du panneau */
export function BarreAction({ children }: { children: ReactNode }) {
  const panneau = useContext(PanneauContext)
  if (panneau) {
    return (
      <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-3 pb-4 bg-[#e9ebee]/95 backdrop-blur">
        {children}
      </div>
    )
  }
  return (
    <div className="fixed inset-x-0 bottom-0 lg:left-64 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto">{children}</div>
    </div>
  )
}

/** Panneau vide (rien de sélectionné) */
export function PanneauVide({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="sticky top-20 rounded-3xl border-2 border-dashed border-neutral-200 p-8 text-center">
      <span className="mx-auto w-14 h-14 rounded-full bg-white text-neutral-500 flex items-center justify-center shadow-sm">{icon}</span>
      <p className="mt-3 font-bold text-neutral-900">{title}</p>
      <p className="mt-1 text-sm text-neutral-500">{text}</p>
    </div>
  )
}
