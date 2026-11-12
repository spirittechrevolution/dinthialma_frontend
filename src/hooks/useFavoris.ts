import { useCallback, useEffect, useState } from 'react'
import { safeGet, safeSet } from '@/lib/format'
import { PREF_KEYS, PREFERENCES_EVENT, synchroniserPreferences } from '@/lib/preferences'

function lire(): string[] {
  try {
    const v = JSON.parse(safeGet(PREF_KEYS.favoris) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Tontines épinglées en favori (≤ 50), synchronisées avec le serveur (B22), cache local hors ligne. */
export function useFavoris() {
  const [ids, setIds] = useState<string[]>(lire)

  useEffect(() => {
    const maj = () => setIds(lire())
    window.addEventListener(PREFERENCES_EVENT, maj)
    return () => window.removeEventListener(PREFERENCES_EVENT, maj)
  }, [])

  const basculer = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-50)
      safeSet(PREF_KEYS.favoris, JSON.stringify(next))
      synchroniserPreferences()
      return next
    })
  }, [])
  return { favoris: ids, estFavori: (id: string) => ids.includes(id), basculer }
}
