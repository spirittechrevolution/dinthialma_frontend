import type { AuthUser } from '@/types/user'
import { UserRole } from '@/types/common'

const ACCESS_TOKEN_KEY = 'dinthialma_access_token'
const REFRESH_TOKEN_KEY = 'dinthialma_refresh_token'

// ─── Structure du JWT Keycloak ────────────────────────────────────────────────
interface JwtPayload {
  exp?: number
  sub?: string
  email?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  // Rôles Keycloak : realm_access.roles contient ex. ["DINTHIALMA_SUPER_ADMIN", "DINTHIALMA_USER", ...]
  realm_access?: { roles: string[] }
  // Certains backends injectent aussi un champ roles direct
  roles?: string[]
}

// ─── Helpers base64url ────────────────────────────────────────────────────────
const base64UrlDecode = (value: string): string => {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=')
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
}

// ─── Token storage ────────────────────────────────────────────────────────────
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

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
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

// ─── Extraction des rôles depuis le JWT Keycloak ──────────────────────────────
// Les rôles sont dans realm_access.roles sous la forme "DINTHIALMA_SUPER_ADMIN"
// On les normalise en retirant le préfixe "DINTHIALMA_" pour obtenir "SUPER_ADMIN"
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
    // Sans préfixe (au cas où le backend les envoie déjà normalisés)
    SUPER_ADMIN: UserRole.SUPER_ADMIN,
    ADMIN: UserRole.ADMIN,
    MEMBER: UserRole.MEMBER,
    USER: UserRole.USER,
  }

  const roles = rawRoles
    .map((r) => roleMap[r])
    .filter((r): r is UserRole => r !== undefined)

  // Déduplique
  return [...new Set(roles)]
}

// ─── Construction de l'AuthUser depuis le JWT ─────────────────────────────────
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
