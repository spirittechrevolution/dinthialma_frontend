export enum NotificationType {
  PAIEMENT_RECU         = 'PAIEMENT_RECU',
  COTISATION_SOUMISE    = 'COTISATION_SOUMISE',
  COTISATION_VALIDEE    = 'COTISATION_VALIDEE',
  JACKPOT_DISTRIBUE     = 'JACKPOT_DISTRIBUE',
  DISTRIBUTION_FINALE   = 'DISTRIBUTION_FINALE',
  PAIEMENT_EN_RETARD    = 'PAIEMENT_EN_RETARD',
  RAPPEL_COTISATION     = 'RAPPEL_COTISATION',
  TOUR_PROCHE           = 'TOUR_PROCHE',
  CYCLE_BIENTOT_CLOTURE = 'CYCLE_BIENTOT_CLOTURE',
  CYCLE_OUVERT          = 'CYCLE_OUVERT',
  INVITATION_TONTINE    = 'INVITATION_TONTINE',
  STATUT_MEMBRE         = 'STATUT_MEMBRE',
}

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  tontineId: string | null
  createdAt: string
}
