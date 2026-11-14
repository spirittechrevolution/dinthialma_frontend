import { useEffect, useState } from 'react'

/** Suit une media query CSS (ex. '(min-width: 1024px)'). */
export function useMediaQuery(query: string): boolean {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
  const [matches, setMatches] = useState(get)

  useEffect(() => {
    const mql = window.matchMedia?.(query)
    if (!mql) return
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/**
 * Desktop = même seuil que la barre latérale (Tailwind `lg`, 1024 px).
 * À utiliser seulement quand la disposition change de structure (ex. liste + formulaire côte à côte) ;
 * pour le reste, préférer les classes `lg:`.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
