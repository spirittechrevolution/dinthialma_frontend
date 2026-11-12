import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Demande d'adhésion ciblée par une alerte (`?demande=`) : défilement jusqu'à elle une fois la liste affichée. */
export function useDemandeCiblee(pret: boolean): string | null {
  const [params] = useSearchParams()
  const cible = params.get('demande')
  useEffect(() => {
    if (!pret || !cible) return
    document.getElementById(`demande-${cible}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [pret, cible])
  return cible
}
