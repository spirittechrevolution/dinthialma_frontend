// ─── Dashboard SUPER_ADMIN ────────────────────────────────────────────────────
export interface GlobalDashboardResponse {
  utilisateurs: UtilisateursStats
  tontines: TontinesStats
  finances: FinancesStats
  activiteRecente: ActiviteRecente
}

export interface UtilisateursStats {
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
  montantValideСeMois: number
}

export interface ActiviteRecente {
  nouveauxInscrits: number
  cotisationsEnregistrees: number
}

// ─── Dashboard ADMIN (personnel) ─────────────────────────────────────────────
export interface MyDashboardResponse {
  nombreTontinesGerees: number
  tontines: TontineStats[]
}

export interface TontineStats {
  tontineId: string
  nom: string
  statut: string
  nombreMembres: number
  cotisationsEnAttente: number
  cotisationsEnRetard: number
  montantTotalValide: number
  cycleEnCours?: CycleEnCoursInfo
}

export interface CycleEnCoursInfo {
  cycleId: string
  numeroCycle: number
  dateDebut: string
  dateFin: string
  beneficiaireNom?: string
  beneficiaireUserId?: string
}
