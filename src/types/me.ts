/**
 * Types de la couche « moi » (données centrées sur l'utilisateur connecté).
 *
 * Ils reprennent les contrats proposés dans docs/BESOINS_BACKEND.md (B01, B04, B05, B06,
 * B09, B10). Tant que le backend ne les fournit pas, `meService` les reconstruit à partir
 * des endpoints existants ; les écrans ne dépendent que de ces types.
 */
import type { Tontine } from './tontine'
import type { Cotisation } from './cotisation'
import type { CotisationStatut, MembreStatut } from './common'

// ─── B01 : mon rôle dans chaque tontine ──────────────────────────────────────
export type MonRole = 'GESTIONNAIRE' | 'MEMBRE' | 'GESTIONNAIRE_ET_MEMBRE' | 'LECTURE'

export interface MaTontine extends Omit<Tontine, 'monRole' | 'monMembreId' | 'monStatutMembre'> {
  monRole: MonRole
  /** Mon identifiant de membre dans cette tontine (null si je n'y cotise pas) */
  monMembreId: string | null
  monStatutMembre: MembreStatut | null
  /** Ma position dans l'ordre de passage (null si je n'y cotise pas) */
  monOrdreJackpot: number | null
  /** true si j'ai déjà reçu le jackpot dans cette tontine */
  aRecuJackpot: boolean
}

export const jeGere = (t: Pick<MaTontine, 'monRole'>) =>
  t.monRole === 'GESTIONNAIRE' || t.monRole === 'GESTIONNAIRE_ET_MEMBRE'

export const jeCotise = (t: Pick<MaTontine, 'monRole'>) =>
  t.monRole === 'MEMBRE' || t.monRole === 'GESTIONNAIRE_ET_MEMBRE'

// ─── B04 : résumé « Je cotise » ──────────────────────────────────────────────
export type StatutCotisationDue = 'A_PAYER' | 'EN_ATTENTE' | 'VALIDE'

export interface CotisationDue {
  cycleId: string
  numeroCycle: number
  /** Montant fixe ; pour un montant libre, le minimum (ou null s'il n'y en a pas) */
  montant: number | null
  montantLibre: boolean
  montantMinimum: number | null
  dateLimite: string
  statut: StatutCotisationDue
  /** Cotisation déjà déclarée sur ce tour (null si à payer) */
  cotisationId: string | null
}

export interface CotisantTontineSummary {
  tontineId: string
  nom: string
  tontineType: Tontine['tontineType']
  monMembreId: string | null
  totalCotiseValide: number
  totalEnAttente: number
  toursPayes: number
  toursTotal: number
  totalJackpotsRecus: number
  cycleEnCours: { cycleId: string; numeroCycle: number; dateFin: string } | null
  /** null s'il n'y a pas de tour en cours ou si je ne suis pas actif */
  cotisationDue: CotisationDue | null
  gestionnaire: { firstName: string; lastName: string; phone: string }
}

export interface CotisantSummary {
  totalCotiseValide: number
  totalEnAttente: number
  totalJackpotsRecus: number
  /** Cotisations à payer maintenant, la plus urgente (date limite la plus proche) en tête */
  aPayer: CotisantTontineSummary[]
  tontines: CotisantTontineSummary[]
}

// ─── B05 : résumé « Je gère » ────────────────────────────────────────────────
export interface GestionTontineSummary {
  tontineId: string
  nom: string
  tontineType: Tontine['tontineType']
  montant: number | null
  montantLibre: boolean
  cotisationsEnAttente: number
  cotisationsEnRetard: number
  montantTotalValide: number
  cycleEnCours: {
    cycleId: string
    numeroCycle: number
    dateFin: string
    /** Somme des cotisations VALIDÉES du tour */
    montantCollecte: number
    /** montant × membres actifs ; null pour un montant libre */
    montantAttendu: number | null
    membresAyantPaye: number
    membresAyantDeclare: number
    membresActifs: number
  } | null
}

export interface GestionSummary {
  totalCollecteToursEnCours: number
  totalAttenduToursEnCours: number | null
  totalCotisationsEnAttente: number
  totalCotisationsEnRetard: number
  tontines: GestionTontineSummary[]
}

// ─── B06 : file « À valider » ────────────────────────────────────────────────
export interface CotisationAValider extends Cotisation {
  tontineNom: string
}

// ─── B09 : fil d'activité ────────────────────────────────────────────────────
export type ActiviteType =
  | 'COTISATION_DECLAREE'
  | 'COTISATION_VALIDEE'
  | 'COTISATION_ENCAISSEE'
  | 'COTISATION_EN_RETARD'
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
  cotisationId: string | null
  /** Nom du membre concerné (utile en mode « Je gère ») */
  membreNom: string | null
}

export type ModeAccueil = 'COTISE' | 'GERE'

// ─── B10 : mes jackpots ──────────────────────────────────────────────────────
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
  position: number | null
  numeroCycleEstime: number | null
  /** Fin du tour estimé ; null si l'ordre est tiré au sort / choisi ou si le tour n'existe pas encore */
  dateEstimee: string | null
  /** Estimation brute : montant × membres / gagnants par tour (commissions non déduites) */
  montantEstime: number | null
  modeAttribution: ModeAttribution
}

export interface MesJackpots {
  totalRecu: number
  recus: JackpotRecu[]
  aVenir: JackpotAVenir[]
}
