import api from './api'
import { AdminUserResponse, UserProfile, UpdateProfileRequest, PhoneChangeRequest, PhoneChangeVerifyRequest, UpdateUserRolesRequest, UserSearchResult } from '@/types/user'
import { PageResponse, CustomResponse } from '@/types/common'

export const userService = {
  // ─── Recherche utilisateur par numéro de téléphone ───────────────────────────
  searchByPhone: async (phone: string): Promise<UserSearchResult> => {
    const response = await api.get<CustomResponse<UserSearchResult>>('/v1/users/search', {
      params: { phone },
    })
    return response.data.data
  },

  // ─── Profil de l'utilisateur connecté ────────────────────────────────────────
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<CustomResponse<UserProfile>>('/v1/profile')
    return response.data.data
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<CustomResponse<UserProfile>>('/v1/profile', request)
    return response.data.data
  },

  // ─── Changement de numéro (2 étapes OTP) ─────────────────────────────────────
  requestPhoneChange: async (request: PhoneChangeRequest): Promise<void> => {
    await api.post('/v1/profile/phone/request-change', request)
  },

  verifyPhoneChange: async (request: PhoneChangeVerifyRequest): Promise<void> => {
    await api.post('/v1/profile/phone/verify', request)
  },

  // ─── Administration SUPER_ADMIN ───────────────────────────────────────────────

  listUsers: async (page = 0, size = 20): Promise<PageResponse<AdminUserResponse>> => {
    const response = await api.get<CustomResponse<PageResponse<AdminUserResponse>>>(
      '/v1/admin/dashboard/users',
      { params: { page, size, sort: 'createdAt,desc' } }
    )
    return response.data.data
  },

  getUserDetail: async (userId: string): Promise<AdminUserResponse> => {
    const response = await api.get<CustomResponse<AdminUserResponse>>(
      `/v1/admin/dashboard/users/${userId}`
    )
    return response.data.data
  },

  updateUserRoles: async (userId: string, request: UpdateUserRolesRequest): Promise<AdminUserResponse> => {
    const response = await api.put<CustomResponse<AdminUserResponse>>(
      `/v1/admin/dashboard/users/${userId}/roles`,
      request
    )
    return response.data.data
  },

  enableUser: async (userId: string): Promise<AdminUserResponse> => {
    const response = await api.post<CustomResponse<AdminUserResponse>>(
      `/v1/admin/dashboard/users/${userId}/enable`
    )
    return response.data.data
  },

  disableUser: async (userId: string): Promise<AdminUserResponse> => {
    const response = await api.post<CustomResponse<AdminUserResponse>>(
      `/v1/admin/dashboard/users/${userId}/disable`
    )
    return response.data.data
  },
}
