import { useCallback, useEffect, useState } from 'react'
import { safeGet, safeSet } from '@/lib/format'
import { PREFERENCES_EVENT, estPreferenceSynchronisee, synchroniserPreferences } from '@/lib/preferences'

/**
 * Préférence mémorisée sur l'appareil (mode de l'accueil, montant masqué…).
 * Les préférences listées dans lib/preferences sont synchronisées avec le serveur (B22) :
 * relues quand le serveur les met à jour, envoyées à chaque changement.
 */
export function useLocalPreference<T extends string>(key: string, fallback: T, allowed?: readonly T[]) {
  const lire = useCallback((): T => {
    const stored = safeGet(key) as T | null
    return stored !== null && (!allowed || allowed.includes(stored)) ? stored : fallback
  }, [key, fallback, allowed])

  const [value, setValue] = useState<T>(lire)

  useEffect(() => {
    const maj = () => setValue(lire())
    window.addEventListener(PREFERENCES_EVENT, maj)
    return () => window.removeEventListener(PREFERENCES_EVENT, maj)
  }, [lire])

  const update = useCallback((next: T) => {
    setValue(next)
    safeSet(key, next)
    if (estPreferenceSynchronisee(key)) synchroniserPreferences()
  }, [key])
  return [value, update] as const
}
