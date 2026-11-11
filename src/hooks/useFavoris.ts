import { useCallback, useState } from 'react'
import { safeGet, safeSet } from '@/lib/format'

const KEY = 'dinthialma_tontines_favorites'

function lire(): string[] {
  try {
    const v = JSON.parse(safeGet(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Tontines épinglées en favori — mémorisées sur l'appareil (synchronisation serveur : B22). */
export function useFavoris() {
  const [ids, setIds] = useState<string[]>(lire)
  const basculer = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      safeSet(KEY, JSON.stringify(next))
      return next
    })
  }, [])
  return { favoris: ids, estFavori: (id: string) => ids.includes(id), basculer }
}
