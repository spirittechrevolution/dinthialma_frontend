import { Badge } from '@/components/ui/Badge'
import { TontineStatus, MemberStatus, ContributionStatus, CycleStatus } from '@/types/common'

interface StatusBadgeProps {
  status: TontineStatus | MemberStatus | ContributionStatus | CycleStatus | string
}

const statusColorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  // Tontine statuses
  EN_ATTENTE: 'warning',
  ACTIVE: 'success',
  ACTIF: 'success',
  EN_PAUSE: 'warning',
  TERMINEE: 'default',
  TERMINE: 'default',
  ANNULEE: 'error',
  ANNULE: 'error',

  // Member statuses
  SUSPENDU: 'warning',
  EXCLU: 'error',

  // Contribution statuses
  VALIDEE: 'success',
  REJETEE: 'error',

  // Cycle statuses
  EN_COURS: 'info',
}

const statusLabelMap: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  ACTIVE: 'Actif',
  ACTIF: 'Actif',
  EN_PAUSE: 'En pause',
  TERMINEE: 'Terminé',
  TERMINE: 'Terminé',
  ANNULEE: 'Annulé',
  ANNULE: 'Annulé',
  SUSPENDU: 'Suspendu',
  EXCLU: 'Exclu',
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
  EN_COURS: 'En cours',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = statusColorMap[status] || 'default'
  const label = statusLabelMap[status] || status

  return <Badge variant={variant}>{label}</Badge>
}
