/**
 * Interprétation des erreurs de l'API — B02 de docs/BESOINS_BACKEND.md.
 *
 * Cible : le backend renvoie un champ `code` stable dans le corps de l'erreur ; on l'utilise tel quel.
 * En attendant, on déduit le code du statut HTTP et du texte du message (heuristiques reprises
 * telles quelles des écrans). Les écrans ne testent plus jamais le texte : ils testent le code.
 * Quand le backend renvoie `code` partout, on supprime simplement `inferCode`.
 */
import { isAxiosError } from 'axios'

export type ApiErrorCode =
  | 'ACCOUNT_PRE_ENROLLED'
  | 'ACCOUNT_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'PIN_INVALID'
  | 'PIN_EXPIRED'
  | 'PIN_TOO_SIMPLE'
  | 'PIN_LOCKED'
  | 'PIN_SESSION_EXPIRED'
  | 'OTP_INVALID'
  | 'PHONE_ALREADY_USED'
  | 'MEMBER_ALREADY_IN_TONTINE'
  | 'JACKPOT_POSITION_TAKEN'
  | 'COTISATION_ALREADY_EXISTS'
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

/** Contexte de l'appel : un même statut HTTP n'a pas le même sens partout */
export type ApiErrorContext = 'login' | 'pin' | 'otp' | 'register' | 'addMembre' | 'cotisation' | 'generic'

export interface ParsedApiError {
  code: ApiErrorCode
  status: number | null
  /** Message renvoyé par le serveur (à n'afficher que s'il n'existe pas de message front) */
  serverMessage: string
}

const has = (msg: string, ...words: string[]) => words.some((w) => msg.includes(w))

function inferCode(status: number | null, msg: string, context: ApiErrorContext): ApiErrorCode {
  const m = msg.toLowerCase()
  if (status === null) return 'NETWORK_ERROR'

  switch (context) {
    case 'login':
      if (status === 403 && has(m, 'gestionnaire', 'pre_enrolled', 'pré-inscrit', 'pas encore inscrit')) return 'ACCOUNT_PRE_ENROLLED'
      if (status === 401 || status === 400 || status === 403) return 'INVALID_CREDENTIALS'
      break
    case 'pin':
      if (status === 401 && has(m, 'session')) return 'PIN_SESSION_EXPIRED'
      if (status === 404) return 'ACCOUNT_NOT_FOUND'
      if (status === 400 && has(m, 'expiré')) return 'PIN_EXPIRED'
      if (status === 400 && has(m, 'simple')) return 'PIN_TOO_SIMPLE'
      if (status === 429) return 'PIN_LOCKED'
      if (status === 400 || status === 401) return 'PIN_INVALID'
      break
    case 'otp':
      if (status === 400 || status === 401 || status === 404) return 'OTP_INVALID'
      break
    case 'register':
      if (status === 409) return 'PHONE_ALREADY_USED'
      break
    case 'addMembre':
      if (status === 409 && has(m, 'position', 'ordre')) return 'JACKPOT_POSITION_TAKEN'
      if (status === 409) return 'MEMBER_ALREADY_IN_TONTINE'
      break
    case 'cotisation':
      if (status === 409) return 'COTISATION_ALREADY_EXISTS'
      break
  }
  if (status === 400) return 'VALIDATION_ERROR'
  if (status === 403) return 'FORBIDDEN'
  return 'UNKNOWN'
}

export function parseApiError(err: unknown, context: ApiErrorContext = 'generic'): ParsedApiError {
  if (!isAxiosError(err)) return { code: 'UNKNOWN', status: null, serverMessage: '' }
  const status = err.response?.status ?? null
  const data = err.response?.data as { code?: unknown; message?: unknown } | undefined
  const serverMessage = typeof data?.message === 'string' ? data.message : ''
  const code = typeof data?.code === 'string' && data.code
    ? (data.code as ApiErrorCode)
    : inferCode(status, serverMessage, context)
  return { code, status, serverMessage }
}
