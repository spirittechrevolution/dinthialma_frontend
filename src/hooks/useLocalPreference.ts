import { useCallback, useState } from 'react'
import { safeGet, safeSet } from '@/lib/format'

/**
 * Préférence mémorisée sur l'appareil (mode de l'accueil, montant masqué…).
 * Synchronisation serveur prévue plus tard (B22 de docs/BESOINS_BACKEND.md).
 */
export function useLocalPreference<T extends string>(key: string, fallback: T, allowed?: readonly T[]) {
  const [value, setValue] = useState<T>(() => {
    const stored = safeGet(key) as T | null
    return stored !== null && (!allowed || allowed.includes(stored)) ? stored : fallback
  })
  const update = useCallback((next: T) => {
    setValue(next)
    safeSet(key, next)
  }, [key])
  return [value, update] as const
}
