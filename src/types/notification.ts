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
  COTISATION_REFUSEE    = 'COTISATION_REFUSEE',
  DEMANDE_ADHESION      = 'DEMANDE_ADHESION',
  ADHESION_REFUSEE      = 'ADHESION_REFUSEE',
  /** Gestionnaire : des membres n'ont pas encore payé le tour (veille et jour de l'échéance) — B26 / B31 */
  COTISATIONS_MANQUANTES = 'COTISATIONS_MANQUANTES',
}

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  /** Champs absents du JSON quand non pertinents (backend non_null) */
  tontineId?: string | null
  cycleId?: string | null
  cotisationId?: string | null
  membreId?: string | null
  /** DEMANDE_ADHESION / ADHESION_REFUSEE uniquement (absent sur les notifications antérieures) */
  demandeId?: string | null
  createdAt: string
}
