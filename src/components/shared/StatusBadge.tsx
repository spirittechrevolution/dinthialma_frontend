import { Badge } from '@/components/ui/Badge'
import { TontineStatut, MembreStatut, CotisationStatut, CycleStatut } from '@/types/common'

interface StatusBadgeProps {
  status: TontineStatut | MembreStatut | CotisationStatut | CycleStatut | string
}

const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  // Tontine
  BROUILLON: 'warning',
  ACTIVE: 'success',
  SUSPENDUE: 'info',
  TERMINEE: 'default',
  // Membre
  ACTIF: 'success',
  SUSPENDU: 'warning',
  SORTI: 'error',
  // Cotisation
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  EN_RETARD: 'error',
  // Cycle
  EN_COURS: 'info',
  TERMINE: 'default',
}

const statusLabelMap: Record<string, string> = {
  BROUILLON: 'Brouillon',
  ACTIVE: 'Active',
  SUSPENDUE: 'Suspendue',
  TERMINEE: 'Terminée',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  SORTI: 'Sorti',
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  EN_RETARD: 'En retard',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusColorMap[status] ?? 'default'
  const label = statusLabelMap[status] ?? status
  return <Badge variant={variant}>{label}</Badge>
}
