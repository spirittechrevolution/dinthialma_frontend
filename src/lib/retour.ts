/**
 * Page demandée avant la connexion (ex. /q/{token} ouvert par l'appareil photo).
 * Mémorisée par ProtectedRoute, consommée une seule fois après connexion / code secret.
 */
const RETOUR_KEY = 'dinthialma_retour_apres_connexion'

export function memoriserRetour(chemin: string): void {
  if (!chemin.startsWith('/') || chemin.startsWith('//')) return
  try { sessionStorage.setItem(RETOUR_KEY, chemin) } catch { /* stockage indisponible */ }
}

export function consommerRetour(): string | null {
  try {
    const chemin = sessionStorage.getItem(RETOUR_KEY)
    sessionStorage.removeItem(RETOUR_KEY)
    return chemin && chemin.startsWith('/') && !chemin.startsWith('//') ? chemin : null
  } catch {
    return null
  }
}
