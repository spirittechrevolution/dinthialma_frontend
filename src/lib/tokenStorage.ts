import type { AuthUser } from '@/types/user'

const ACCESS_TOKEN_KEY = 'dinthialma_access_token'
const REFRESH_TOKEN_KEY = 'dinthialma_refresh_token'

interface JwtPayload {
  exp?: number
  roles?: string[]
  sub?: string
  email?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  phone?: string
}

const base64UrlDecode = (value: string): string => {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=')
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
}

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

export function parseJwt<T = JwtPayload>(token?: string): T | null {
  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')
    if (!payload) {
      return null
    }

    const decoded = base64UrlDecode(payload)
    return JSON.parse(decoded) as T
  } catch {
    return null
  }
}

export function isTokenExpired(token?: string): boolean {
  const payload = parseJwt(token)
  if (!payload?.exp) {
    return true
  }

  return Date.now() / 1000 >= payload.exp
}

export function getAuthUser(token?: string): AuthUser | null {
  const payload = parseJwt<JwtPayload>(token)
  if (!payload || !payload.sub) {
    return null
  }

  return {
    sub: payload.sub,
    email: payload.email ?? '',
    firstName: payload.given_name ?? payload.preferred_username ?? '',
    lastName: payload.family_name ?? '',
    phone: payload.phone ?? '',
    roles: (payload.roles ?? []) as AuthUser['roles'],
  }
}
