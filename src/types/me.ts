/**
 * Types de la couche « moi » — alignés sur les réponses du backend (api-docs.json) :
 * TontineResponse.monRole (B01), /me/summary (B04), /admin/my-dashboard (B05),
 * /me/gestion/cotisations (B06), /me/activite (B09), /me/jackpots (B10).
 *
 * Le backend omet les champs `null` : un champ absent est normalisé en `null` par meService.
 */
import type { Tontine } from './tontine'
import type { Cotisation } from './cotisation'
import type { CotisationStatut, MembreStatut, TontineStatut } from './common'

// ─── B01 : mon rôle dans chaque tontine ──────────────────────────────────────
export type MonRole = 'GESTIONNAIRE' | 'MEMBRE' | 'GESTIONNAIRE_ET_MEMBRE' | 'LECTURE'

export interface MaTontine extends Omit<Tontine, 'monRole'> {
  monRole: MonRole
}

export const jeGere = (t: Pick<MaTontine, 'monRole'>) =>
  t.monRole === 'GESTIONNAIRE' || t.monRole === 'GESTIONNAIRE_ET_MEMBRE'

export const jeCotise = (t: Pick<MaTontine, 'monRole'>) =>
  t.monRole === 'MEMBRE' || t.monRole === 'GESTIONNAIRE_ET_MEMBRE'

// ─── B04 : résumé « Je cotise » (/me/summary) ────────────────────────────────
export type StatutCotisationDue = 'A_PAYER' | 'EN_ATTENTE' | 'VALIDE'

export interface CotisationDue {
  /** Tour concerné (repris de cycleEnCours) */
  cycleId: string
  numeroCycle: number
  /** null = montant libre sans plancher (laisser saisir) */
  montant: number | null
  montantLibre: boolean
  montantMinimum: number | null
  dateLimite: string
  statut: StatutCotisationDue
  /** Cotisation active sur ce tour (null si à payer) */
  cotisationId: string | null
  /** Après un refus : statut A_PAYER + motif du dernier refus */
  motifDernierRefus: string | null
}

export interface CotisantTontineSummary {
  tontineId: string
  nom: string
  tontineType: Tontine['tontineType']
  statut: TontineStatut
  frequence: string | null
  monMembreId: string | null
  monStatutMembre: MembreStatut | null
  ordreJackpot: number | null
  aRecuJackpot: boolean
  totalCotiseValide: number
  totalEnAttente: number
  toursPayes: number
  toursTotal: number
  /** Total des jackpots reçus dans cette tontine (déduit de /me/jackpots) */
  totalJackpotsRecus: number
  cycleEnCours: { cycleId: string; numeroCycle: number; dateDebut: string; dateFin: string } | null
  /** null : tontine non active, pas de tour en cours ou membership non actif (rien à payer) */
  cotisationDue: CotisationDue | null
  gestionnaire: { firstName: string; lastName: string; phone: string }
}

export interface CotisantSummary {
  totalCotiseValide: number
  totalEnAttente: number
  totalJackpotsRecus: number
  nombreCotisationsDues: number
  montantDu: number
  /** Cotisations à payer, la plus urgente (date limite la plus proche) en tête */
  aPayer: CotisantTontineSummary[]
  tontines: CotisantTontineSummary[]
}

// ─── B05 : résumé « Je gère » (/admin/my-dashboard) ──────────────────────────
export interface GestionTontineSummary {
  tontineId: string
  nom: string
  tontineType: Tontine['tontineType']
  montant: number | null
  montantLibre: boolean
  cotisationsEnAttente: number
  cotisationsEnRetard: number
  montantTotalValide: number
  /** ROTATIVE à ordre MANUEL avec un tour terminé sans gagnant */
  gagnantsADesigner: boolean
  cycleEnCours: {
    cycleId: string
    numeroCycle: number
    dateFin: string
    /** Cotisations VALIDÉES uniquement */
    montantCollecte: number
    montantEnAttente: number
    /** null si montant libre sans plancher */
    montantAttendu: number | null
    membresAyantPaye: number
    membresEnAttente: number
    membresActifs: number
  } | null
}

export interface GestionSummary {
  nombreTontinesGerees: number
  totalCollecteToursEnCours: number
  totalAttenduToursEnCours: number | null
  totalCotisationsEnAttente: number
  totalCotisationsEnRetard: number
  tontines: GestionTontineSummary[]
}

// ─── B06 : file « À valider » (/me/gestion/cotisations) ──────────────────────
export interface CotisationAValider extends Cotisation {
  tontineNom: string
}

// ─── B09 : fil d'activité (/me/activite) ─────────────────────────────────────
export type ActiviteType =
  | 'COTISATION_DECLAREE'
  | 'COTISATION_VALIDEE'
  | 'COTISATION_ENCAISSEE'
  | 'COTISATION_EN_RETARD'
  | 'COTISATION_REFUSEE'
  | 'JACKPOT_RECU'

export interface ActiviteItem {
  id: string
  type: ActiviteType
  date: string
  montant: number
  /** EPARGNE = cotisation (affichée sans signe), GAIN = jackpot (affiché « + ») */
  sens: 'EPARGNE' | 'GAIN'
  statut: CotisationStatut | null
  tontineId: string
  tontineNom: string
  cycleId: string | null
  numeroCycle: number | null
  cotisationId: string | null
  membreId: string | null
  /** Nom du membre concerné (mode « Je gère ») */
  membreNom: string | null
  libelle: string | null
}

export type ModeAccueil = 'COTISE' | 'GERE'

// ─── B10 : mes jackpots (/me/jackpots) ───────────────────────────────────────
export type ModeAttribution = 'ORDRE' | 'TIRAGE' | 'CHOIX'

export interface JackpotRecu {
  tontineId: string
  tontineNom: string
  cycleId: string
  numeroCycle: number
  dateRemise: string | null
  montantRecu: number
}

export interface JackpotAVenir {
  tontineId: string
  tontineNom: string
  monMembreId: string | null
  /** Rang parmi les non-gagnants (ORDRE uniquement) */
  position: number | null
  numeroCycleEstime: number | null
  /** Fin du tour estimé ; null si TIRAGE / CHOIX ou tour pas encore planifié */
  dateEstimee: string | null
  /** Brut, avant commissions : à libeller « environ » */
  montantEstime: number | null
  modeAttribution: ModeAttribution
}

export interface MesJackpots {
  totalRecu: number
  recus: JackpotRecu[]
  aVenir: JackpotAVenir[]
}
