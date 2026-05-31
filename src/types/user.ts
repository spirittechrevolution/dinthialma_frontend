import { UserRole } from './common'

// ─── Utilisateur authentifié (extrait du JWT) ─────────────────────────────────
export interface AuthUser {
  sub: string
  email: string
  firstName: string
  lastName: string
  phone: string
  roles: UserRole[]
}

// ─── Réponse admin utilisateur (SUPER_ADMIN) ─────────────────────────────────
export interface AdminUserResponse {
  id: string
  keycloakId: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  avatarUrl?: string
  active: boolean
  pinConfigured: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

// ─── Profil utilisateur connecté ─────────────────────────────────────────────
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  avatarUrl?: string
  active: boolean
  pinConfigured: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

// ─── Requêtes Auth ────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string
  password: string
  clientType: 'WEB' | 'MOBILE'
  deviceInfo?: string
}

// ─── Réponse login (Keycloak snake_case) ─────────────────────────────────────
export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  session_state: string
  scope: string
}

export interface PinLoginRequest {
  phone: string
  pin: string
  clientType: 'WEB' | 'MOBILE'
  deviceInfo?: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// ─── Inscription (3 étapes OTP) ───────────────────────────────────────────────
export interface SendOtpRequest {
  phone: string
}

export interface VerifyOtpRequest {
  phone: string
  code: string
}

export interface RegisterCompleteRequest {
  phone: string
  firstName: string
  lastName: string
  password: string
  email?: string
}

// ─── Reset mot de passe ───────────────────────────────────────────────────────
export interface ResetPasswordRequest {
  phone: string
  code: string
  newPassword: string
}

// ─── PIN ──────────────────────────────────────────────────────────────────────
export interface PinSetupRequest {
  pin: string
  confirmPin: string
}

export interface PinResetRequest {
  phone: string
  otp: string
  newPin: string
  confirmPin: string
}

// ─── Profil ───────────────────────────────────────────────────────────────────
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  email?: string
}

export interface PhoneChangeRequest {
  newPhone: string
}

export interface PhoneChangeVerifyRequest {
  newPhone: string
  code: string
}

// ─── Gestion des rôles (SUPER_ADMIN) ─────────────────────────────────────────
export interface UpdateUserRolesRequest {
  roles: string[]
}

// ─── Contexte Auth ────────────────────────────────────────────────────────────
export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<AuthUser | null>
  logout: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isMember: () => boolean
}
