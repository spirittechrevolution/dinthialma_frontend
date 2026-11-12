import type { PageResponse } from './common'

// ─── Dashboard SUPER_ADMIN (GET /v1/admin/dashboard) ─────────────────────────
// Noms alignés sur GlobalDashboardResponse (backend / api-docs.json)
export interface GlobalDashboardResponse {
  users: UsersStats
  tontines: TontinesStats
  finances: FinancesStats
  activite24h: ActiviteRecente
}

export interface UsersStats {
  total: number
  actifs: number
  desactives: number
  nouveauxCeMois: number
}

export interface TontinesStats {
  total: number
  brouillon: number
  actives: number
  suspendues: number
  terminees: number
}

export interface FinancesStats {
  cotisationsEnAttente: number
  cotisationsEnRetard: number
  /** Somme des cotisations VALIDÉES depuis le 1er du mois (FCFA) */
  montantCotisationsCeMois: number
}

/** Activité des dernières 24 heures */
export interface ActiviteRecente {
  nouveauxInscrits: number
  cotisationsEnregistrees: number
}

// ─── Dashboard ADMIN (personnel) ─────────────────────────────────────────────
export interface MyDashboardResponse {
  /** Total global (toutes pages confondues) */
  nombreTontinesGerees: number
  // ─── Agrégats globaux (calculés en base, indépendants de la pagination) ─────
  /** Somme des cotisations VALIDÉES sur toutes les tontines gérées (FCFA) */
  montantTotalValide: number
  /** Membres (non supprimés) sur toutes les tontines gérées */
  totalMembres: number
  totalCotisationsEnAttente: number
  totalCotisationsEnRetard: number
  /** Demandes d'adhésion EN_ATTENTE (toujours présent, 0 si aucune) */
  totalDemandesEnAttente?: number
  /** Somme des cotisations VALIDÉES des tours en cours */
  totalCollecteToursEnCours: number
  /** Absent si aucun montant attendu calculable (montants libres) */
  totalAttenduToursEnCours: number | null
  /** Paginé côté backend : ?page=&size=&sort= */
  tontines: PageResponse<TontineStats>
}

export interface TontineStats {
  id: string
  tontineId: string
  nom: string
  statut: string
  nombreMembres: number
  cotisationsEnAttente: number
  cotisationsEnRetard: number
  demandesEnAttente?: number
  montantTotalValide: number
  tontineType: 'ROTATIVE' | 'EVENEMENTIELLE'
  /** null si événementielle à montant libre */
  montant: number | null
  frequence: string
  dateDebut: string
  cycleEnCours?: CycleEnCoursInfo | null
  // Champs EVENEMENTIELLE (null pour une ROTATIVE)
  dateEcheance: string | null
  nomEvenement: string | null
  montantLibre: boolean | null
  /** Membres ayant au moins une cotisation VALIDÉE */
  nombreMembresCotise: number | null
  /** ROTATIVE à ordre MANUEL avec un tour terminé sans gagnant */
  gagnantsADesigner?: boolean
}

export interface CycleEnCoursInfo {
  cycleId: string
  numeroCycle: number
  dateDebut: string
  dateFin: string
  beneficiaireNom?: string
  beneficiaireUserId?: string
  /** Cotisations VALIDÉES du tour */
  montantCollecte?: number
  montantEnAttente?: number
  /** Absent si montant libre sans plancher */
  montantAttendu?: number
  membresAyantPaye?: number
  membresEnAttente?: number
  membresActifs?: number
}
