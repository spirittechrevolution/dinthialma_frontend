import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/** En-tête des écrans plein écran : retour (48 px) + titre court + action optionnelle à droite. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  const navigate = useNavigate()
  const back = onBack ?? (() => (window.history.length > 1 ? navigate(-1) : navigate('/accueil')))
  return (
    <header className="sticky top-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 flex items-center gap-1">
      <button onClick={back} className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-900 hover:bg-black/5" aria-label="Retour">
        <ArrowLeft size={24} />
      </button>
      <h1 className="flex-1 text-[20px] font-bold text-neutral-900 truncate">{title}</h1>
      {right}
    </header>
  )
}
