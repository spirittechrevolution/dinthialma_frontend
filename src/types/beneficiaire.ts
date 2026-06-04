// ─── Historique bénéficiaires jackpot (multi-gagnants) ───────────────────────

export interface GagnantHistoriqueInfo {
  membreId: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  ordreJackpot: number | null
  /** Montant réellement reçu par ce gagnant */
  montantRecu: number | null
  dateJackpot: string | null
}

export interface BeneficiaireHistoriqueItem {
  cycleId: string
  numeroCycle: number
  dateRemise: string
  /** BigDecimal JSON → parser en nombre avant affichage */
  montantJackpot: number | string
  /** BigDecimal JSON — peut être 0 ou null */
  montantCommission: number | string | null
  /** BigDecimal JSON → total net remis sur le cycle */
  montantNet: number | string
  /** montantNet / nombreGagnants */
  montantParGagnant: number | string | null
  /** Liste des gagnants du cycle */
  gagnants: GagnantHistoriqueInfo[]
}
