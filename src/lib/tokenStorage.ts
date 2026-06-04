import type { AuthUser } from '@/types/user'
import { UserRole } from '@/types/common'

const ACCESS_TOKEN_KEY  = 'dinthialma_access_token'
const REFRESH_TOKEN_KEY = 'dinthialma_refresh_token'
const USER_PHONE_KEY    = 'dinthialma_user_phone'
const PIN_CONFIGURED_KEY = 'dinthialma_pin_configured'

// ─── Structure du JWT Keycloak ────────────────────────────────────────────────
interface JwtPayload {
  exp?: number
  sub?: string
  email?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  realm_access?: { roles: string[] }
  roles?: string[]
}

const base64UrlDecode = (value: string): string => {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=')
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}
export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// ─── Phone (persisté pour le login PIN) ──────────────────────────────────────
export function getUserPhone(): string | null {
  return localStorage.getItem(USER_PHONE_KEY)
}
export function setUserPhone(phone: string): void {
  localStorage.setItem(USER_PHONE_KEY, phone)
}
export function clearUserPhone(): void {
  localStorage.removeItem(USER_PHONE_KEY)
}

// ─── PIN configuré ────────────────────────────────────────────────────────────
// null  = clé absente (statut inconnu, ex. première connexion sur cet appareil)
// false = backend a confirmé que le PIN n'est pas configuré
// true  = backend a confirmé que le PIN est configuré
export function getPinConfigured(): boolean | null {
  const val = localStorage.getItem(PIN_CONFIGURED_KEY)
  if (val === 'true') return true
  if (val === 'false') return false
  return null
}
export function setPinConfigured(value: boolean): void {
  localStorage.setItem(PIN_CONFIGURED_KEY, value ? 'true' : 'false')
}

// ─── Clear complet (logout) ────────────────────────────────────────────────────
export function clearAll(): void {
  clearTokens()
  clearUserPhone()
  localStorage.removeItem(PIN_CONFIGURED_KEY)
}

// ─── Parsing JWT ──────────────────────────────────────────────────────────────
export function parseJwt<T = JwtPayload>(token?: string): T | null {
  if (!token) return null
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(base64UrlDecode(payload)) as T
  } catch {
    return null
  }
}

export function isTokenExpired(token?: string): boolean {
  const payload = parseJwt(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 >= payload.exp
}

function extractRoles(payload: JwtPayload): UserRole[] {
  const rawRoles: string[] = [
    ...(payload.realm_access?.roles ?? []),
    ...(payload.roles ?? []),
  ]
  const roleMap: Record<string, UserRole> = {
    DINTHIALMA_SUPER_ADMIN: UserRole.SUPER_ADMIN,
    DINTHIALMA_ADMIN: UserRole.ADMIN,
    DINTHIALMA_MEMBER: UserRole.MEMBER,
    DINTHIALMA_USER: UserRole.USER,
    SUPER_ADMIN: UserRole.SUPER_ADMIN,
    ADMIN: UserRole.ADMIN,
    MEMBER: UserRole.MEMBER,
    USER: UserRole.USER,
  }
  const roles = rawRoles.map((r) => roleMap[r]).filter((r): r is UserRole => r !== undefined)
  return [...new Set(roles)]
}

export function getAuthUser(token?: string): AuthUser | null {
  const payload = parseJwt<JwtPayload>(token)
  if (!payload?.sub) return null
  return {
    sub: payload.sub,
    email: payload.email ?? '',
    firstName: payload.given_name ?? payload.preferred_username ?? '',
    lastName: payload.family_name ?? '',
    phone: payload.preferred_username ?? '',
    roles: extractRoles(payload),
  }
}
