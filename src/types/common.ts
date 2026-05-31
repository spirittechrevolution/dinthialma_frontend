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
}

// ─── Statuts membre ───────────────────────────────────────────────────────────
export enum MembreStatut {
  ACTIF = 'ACTIF',
  SUSPENDU = 'SUSPENDU',
  SORTI = 'SORTI',
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
