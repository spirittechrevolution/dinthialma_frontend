import { isAxiosError } from 'axios'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

/** true si l'erreur est un 403 (accès interdit) */
export function isForbidden(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403
}

/** Affichage propre d'une erreur de requête (403 ou autre). */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (isForbidden(error)) {
    return (
      <EmptyState
        icon={<ShieldAlert size={26} />}
        title="Accès refusé"
        description="Cet écran est réservé aux super-administrateurs."
      />
    )
  }
  return (
    <EmptyState
      icon={<AlertTriangle size={26} />}
      title="Impossible de charger les données"
      description="Vérifiez votre connexion puis réessayez."
      action={
        onRetry && (
          <button onClick={onRetry} className="text-sm font-semibold text-primary-700 hover:underline">
            Réessayer
          </button>
        )
      }
    />
  )
}
