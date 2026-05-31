import api from './api'
import { CustomResponse } from '@/types/common'
import {
  LoginRequest,
  LoginResponse,
  PinLoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  SendOtpRequest,
  VerifyOtpRequest,
  RegisterCompleteRequest,
  RegisterCompleteResponse,
  ResetPasswordRequest,
  PinSetupRequest,
  PinResetRequest,
} from '@/types/user'

export const authService = {
  // ─── Connexion mot de passe ─────────────────────────────────────────────────
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<CustomResponse<LoginResponse>>('/v1/auth/login', request)
    return response.data.data
  },

  // ─── Connexion PIN ──────────────────────────────────────────────────────────
  loginWithPin: async (request: PinLoginRequest): Promise<LoginResponse> => {
    const response = await api.post<CustomResponse<LoginResponse>>('/v1/auth/login-pin', request)
    return response.data.data
  },

  // ─── Déconnexion ────────────────────────────────────────────────────────────
  logout: async (request: LogoutRequest): Promise<void> => {
    await api.post('/v1/auth/logout', request)
  },

  // ─── Refresh token ──────────────────────────────────────────────────────────
  refreshToken: async (request: RefreshTokenRequest): Promise<LoginResponse> => {
    const response = await api.post<CustomResponse<LoginResponse>>('/v1/auth/refresh', request)
    return response.data.data
  },  // ─── Inscription étape 1/3 : envoi OTP ─────────────────────────────────────
  sendRegisterOtp: async (request: SendOtpRequest): Promise<void> => {
    await api.post('/v1/auth/register/send-otp', request)
  },

  // ─── Inscription étape 2/3 : vérification OTP ──────────────────────────────
  verifyRegisterOtp: async (request: VerifyOtpRequest): Promise<void> => {
    await api.post('/v1/auth/register/verify-otp', request)
  },

  // ─── Inscription étape 3/3 : création du compte ────────────────────────────
  registerComplete: async (request: RegisterCompleteRequest): Promise<RegisterCompleteResponse> => {
    const response = await api.post<CustomResponse<RegisterCompleteResponse>>(
      '/v1/auth/register/complete',
      request
    )
    return response.data.data
  },

  // ─── Reset mot de passe 1/3 : envoi OTP ────────────────────────────────────
  sendForgotPasswordOtp: async (request: SendOtpRequest): Promise<void> => {
    await api.post('/v1/auth/forgot-password/send-otp', request)
  },

  // ─── Reset mot de passe 2/3 : vérification OTP ─────────────────────────────
  verifyForgotPasswordOtp: async (request: VerifyOtpRequest): Promise<void> => {
    await api.post('/v1/auth/forgot-password/verify-otp', request)
  },

  // ─── Reset mot de passe 3/3 : nouveau mot de passe ─────────────────────────
  resetPassword: async (request: ResetPasswordRequest): Promise<void> => {
    await api.post('/v1/auth/forgot-password/reset', request)
  },

  // ─── Configuration PIN ──────────────────────────────────────────────────────
  setupPin: async (request: PinSetupRequest): Promise<void> => {
    await api.post('/v1/auth/pin/setup', request)
  },

  // ─── Reset PIN 1/3 : envoi OTP ─────────────────────────────────────────────
  sendPinResetOtp: async (request: SendOtpRequest): Promise<void> => {
    await api.post('/v1/auth/pin/reset/send-otp', request)
  },

  // ─── Reset PIN 2/3 : vérification OTP ──────────────────────────────────────
  verifyPinResetOtp: async (request: VerifyOtpRequest): Promise<void> => {
    await api.post('/v1/auth/pin/reset/verify-otp', request)
  },

  // ─── Reset PIN 3/3 : nouveau PIN ───────────────────────────────────────────
  resetPin: async (request: PinResetRequest): Promise<void> => {
    await api.post('/v1/auth/pin/reset', request)
  },
}
