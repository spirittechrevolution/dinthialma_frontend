// ─── Réponse enveloppe API ────────────────────────────────────────────────────
export interface CustomResponse<T> {
  status: string
  statusCode: number
  message: string
  data: T
}

// ─── Pagination Spring Data ───────────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * Format brut renvoyé par le backend.
 * Spring Data est configuré en `PageSerializationMode.VIA_DTO` :
 *   { content: [...], page: { size, number, totalElements, totalPages } }
 * L'ancien format « à plat » (totalPages à la racine) est aussi accepté.
 */
export interface RawPage<T> {
  content?: T[]
  page?: { size: number; number: number; totalElements: number; totalPages: number }
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
}

/** Convertit n'importe quelle page backend en `PageResponse<T>` (format utilisé par le front). */
export function toPage<T>(raw: RawPage<T> | null | undefined): PageResponse<T> {
  const content = raw?.content ?? []
  const meta = raw?.page
  const number = meta?.number ?? raw?.number ?? 0
  const size = meta?.size ?? raw?.size ?? content.length
  const totalElements = meta?.totalElements ?? raw?.totalElements ?? content.length
  const totalPages = Math.max(1, meta?.totalPages ?? raw?.totalPages ?? 1)
  return {
    content,
    totalElements,
    totalPages,
    size,
    number,
    first: number <= 0,
    last: number >= totalPages - 1,
  }
}

// ─── Erreur API ───────────────────────────────────────────────────────────────
export interface ApiError {
  status: string
  statusCode: number
  message: string
  timestamp?: string
  details?: Record<string, string>
}

// ─── Rôles ────────────────────────────────────────────────────────────────────
export enum UserRole {
  USER = 'USER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// ─── Statuts tontine ──────────────────────────────────────────────────────────
export enum TontineStatut {
  BROUILLON = 'BROUILLON',
  ACTIVE = 'ACTIVE',
  SUSPENDUE = 'SUSPENDUE',
  TERMINEE = 'TERMINEE',
}

// ─── Statuts cycle ────────────────────────────────────────────────────────────
export enum CycleStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
}

// ─── Mode cycle ───────────────────────────────────────────────────────────────
export enum ModeCycle {
  AUTOMATIQUE = 'AUTOMATIQUE',
  MANUEL = 'MANUEL',
}

// ─── Statuts cotisation ───────────────────────────────────────────────────────
export enum CotisationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  VALIDE = 'VALIDE',
  EN_RETARD = 'EN_RETARD',
  /** Refusée par le gestionnaire (motifRefus) — finale, hors totaux, ne bloque pas une nouvelle déclaration */
  REFUSE = 'REFUSE',
}

// ─── Statuts membre ───────────────────────────────────────────────────────────
export enum MembreStatut {
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  SORTI = 'SORTI',
}

// ─── Statut compte utilisateur ────────────────────────────────────────────────
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PRE_ENROLLED = 'PRE_ENROLLED',
}

// ─── Types de commission ──────────────────────────────────────────────────────
export enum CommissionType {
  POURCENTAGE_JACKPOT = 'POURCENTAGE_JACKPOT',
  FRAIS_FIXES_PAR_CYCLE = 'FRAIS_FIXES_PAR_CYCLE',
  FRAIS_ADHESION = 'FRAIS_ADHESION',
}

// ─── Type client ──────────────────────────────────────────────────────────────
export enum ClientType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

// ─── Code List ────────────────────────────────────────────────────────────────
export interface CodeListItem {
  id: string
  type: string
  value: string
  description: string
  systemAssign: boolean
}

// ─── Infos résumées ───────────────────────────────────────────────────────────
export interface CreateurInfo {
  id: string
  firstName: string
  lastName: string
  phone: string
}

export interface UserInfo {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  accountStatus?: AccountStatus
}

export interface MembreInfo {
  membreId: string
  userId: string
  firstName: string
  lastName: string
  phone: string
}

export interface ValideurInfo {
  id: string
  firstName: string
  lastName: string
}

export interface BeneficiaireInfo {
  membreId: string
  userId: string
  firstName: string
  lastName: string
  phone: string
  ordreJackpot: number
}
