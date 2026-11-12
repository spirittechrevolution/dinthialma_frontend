/**
 * Interprétation des erreurs de l'API (B02, §2 de docs/PROMPT_ALIGNEMENT_FRONT.md).
 *
 * Toute erreur du backend porte un `code` stable dans l'enveloppe
 * `{ status, statusCode, code, message, data }`. Les écrans testent UNIQUEMENT ce code ;
 * `message` n'est jamais analysé, seulement affiché quand aucun texte front n'existe.
 */
import { isAxiosError } from 'axios'

export type ApiErrorCode =
  // Génériques
  | 'BAD_REQUEST' | 'VALIDATION_ERROR' | 'INVALID_PARAMETER' | 'MALFORMED_REQUEST'
  | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'METHOD_NOT_ALLOWED' | 'CONFLICT'
  | 'TOO_MANY_REQUESTS' | 'INTERNAL_ERROR' | 'UPSTREAM_ERROR'
  // Authentification / compte
  | 'INVALID_CREDENTIALS' | 'ACCOUNT_PRE_ENROLLED' | 'ACCOUNT_DISABLED' | 'SESSION_EXPIRED'
  | 'PHONE_ALREADY_USED' | 'EMAIL_ALREADY_USED' | 'PHONE_UNCHANGED'
  | 'CURRENT_PASSWORD_INVALID' | 'PASSWORD_UNCHANGED'
  // Code secret
  | 'PIN_INVALID' | 'PIN_INVALID_FORMAT' | 'PIN_TOO_SIMPLE' | 'PIN_MISMATCH' | 'PIN_NOT_CONFIGURED'
  | 'PIN_EXPIRED' | 'PIN_LOCKED' | 'PIN_SESSION_EXPIRED'
  // Codes SMS
  | 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_NOT_VERIFIED' | 'OTP_RATE_LIMITED'
  // Tontines / membres / adhésions
  | 'MEMBER_ALREADY_IN_TONTINE' | 'JACKPOT_POSITION_TAKEN' | 'MEMBER_NAME_REQUIRED' | 'MEMBER_IDENTIFIER_REQUIRED'
  | 'TONTINE_FULL' | 'TONTINE_NOT_OPEN' | 'DEMANDE_DEJA_EN_ATTENTE' | 'DEMANDE_NOT_PENDING'
  // Cotisations / tours
  | 'COTISATION_ALREADY_EXISTS' | 'NO_CYCLE_IN_PROGRESS' | 'AMOUNT_BELOW_MINIMUM' | 'AMOUNT_MISMATCH'
  | 'COTISATION_NOT_EDITABLE' | 'COTISATION_NOT_PENDING' | 'CYCLE_ALREADY_IN_PROGRESS'
  // Console
  | 'CODE_LIST_SYSTEM_VALUE'
  // Côté front
  | 'NETWORK_ERROR' | 'UNKNOWN'

export interface ParsedApiError {
  code: ApiErrorCode
  status: number | null
  /** Message lisible renvoyé par le serveur (affiché tel quel si le code n'a pas de texte front) */
  serverMessage: string
  /** PIN_LOCKED : secondes avant de pouvoir réessayer (data.retryAfterSeconds) */
  retryAfterSeconds: number | null
}

export function parseApiError(err: unknown): ParsedApiError {
  if (!isAxiosError(err)) return { code: 'UNKNOWN', status: null, serverMessage: '', retryAfterSeconds: null }
  if (!err.response) return { code: 'NETWORK_ERROR', status: null, serverMessage: '', retryAfterSeconds: null }
  const body = err.response.data as { code?: unknown; message?: unknown; data?: { retryAfterSeconds?: unknown } } | undefined
  const retry = Number(body?.data?.retryAfterSeconds)
  return {
    code: typeof body?.code === 'string' && body.code ? (body.code as ApiErrorCode) : 'UNKNOWN',
    status: err.response.status,
    serverMessage: typeof body?.message === 'string' ? body.message : '',
    retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? retry : null,
  }
}

/** Textes front par défaut ; un code absent d'ici affiche le message du serveur. */
const TEXTES: Partial<Record<ApiErrorCode, string>> = {
  NETWORK_ERROR: 'Pas de connexion. Vérifiez votre réseau et réessayez.',
  INTERNAL_ERROR: 'Service momentanément indisponible, réessayez.',
  UPSTREAM_ERROR: 'Service momentanément indisponible, réessayez.',
  FORBIDDEN: 'Accès refusé.',
  NOT_FOUND: 'Introuvable : la ressource a peut-être été supprimée.',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques instants.',
  INVALID_CREDENTIALS: 'Numéro ou mot de passe incorrect.',
  ACCOUNT_DISABLED: 'Votre compte est désactivé. Contactez le support.',
  SESSION_EXPIRED: 'Votre session a expiré. Reconnectez-vous.',
  PHONE_ALREADY_USED: 'Ce numéro a déjà un compte.',
  EMAIL_ALREADY_USED: 'Cet email est déjà utilisé.',
  PHONE_UNCHANGED: "C'est déjà votre numéro.",
  CURRENT_PASSWORD_INVALID: 'Mot de passe actuel incorrect.',
  PASSWORD_UNCHANGED: "Le nouveau mot de passe doit être différent de l'ancien.",
  PIN_INVALID: 'Code secret incorrect.',
  PIN_INVALID_FORMAT: 'Le code secret doit comporter 6 chiffres.',
  PIN_TOO_SIMPLE: 'Code trop simple. Évitez 123456 ou 000000.',
  PIN_MISMATCH: 'Les deux codes ne correspondent pas.',
  PIN_EXPIRED: 'Votre code secret a expiré. Choisissez-en un nouveau.',
  PIN_SESSION_EXPIRED: 'Reconnectez-vous avec votre mot de passe.',
  OTP_INVALID: 'Code incorrect.',
  OTP_EXPIRED: 'Code expiré. Demandez-en un nouveau.',
  OTP_NOT_VERIFIED: 'Vérifiez d’abord le code reçu par SMS.',
  MEMBER_ALREADY_IN_TONTINE: 'Déjà membre de cette tontine.',
  JACKPOT_POSITION_TAKEN: 'Cette position est déjà prise. Choisissez-en une autre.',
  MEMBER_IDENTIFIER_REQUIRED: 'Ajout impossible : identifiant du membre manquant.',
  MEMBER_NAME_REQUIRED: 'Numéro inconnu : indiquez le prénom et le nom.',
  TONTINE_FULL: 'La tontine est complète.',
  TONTINE_NOT_OPEN: "Cette tontine n'accepte pas de nouveaux membres pour le moment.",
  DEMANDE_DEJA_EN_ATTENTE: 'Vous avez déjà envoyé une demande.',
  DEMANDE_NOT_PENDING: 'Cette demande a déjà été traitée.',
  COTISATION_ALREADY_EXISTS: 'Un paiement existe déjà pour ce tour.',
  NO_CYCLE_IN_PROGRESS: "Le tour n'est pas en cours.",
  AMOUNT_BELOW_MINIMUM: 'Montant inférieur au minimum.',
  AMOUNT_MISMATCH: 'Le montant doit être égal au montant fixé.',
  COTISATION_NOT_EDITABLE: "Ce paiement ne peut plus être modifié.",
  COTISATION_NOT_PENDING: 'Ce paiement a déjà été traité.',
  CYCLE_ALREADY_IN_PROGRESS: "Un tour est déjà en cours : clôturez-le d'abord.",
  CODE_LIST_SYSTEM_VALUE: 'Valeur système : suppression impossible.',
}

/** Texte à afficher pour une erreur ; `repli` si ni texte front ni message serveur. */
export function messageErreur(err: unknown, repli = 'Une erreur est survenue. Réessayez.'): string {
  const { code, serverMessage } = parseApiError(err)
  return TEXTES[code] ?? (serverMessage || repli)
}
