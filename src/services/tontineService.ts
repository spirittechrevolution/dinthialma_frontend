import api from './api'
import { Tontine, CreateTontineRequest, UpdateTontineRequest, Commission, CreateCommissionRequest, UpdateCommissionRequest } from '@/types/tontine'
import { PageResponse, CustomResponse } from '@/types/common'

export const tontineService = {
  // ─── Lister les tontines (SUPER_ADMIN = toutes, autres = les siennes) ────────
  listTontines: async (page = 0, size = 20, sort = 'createdAt,desc'): Promise<PageResponse<Tontine>> => {
    const response = await api.get<CustomResponse<PageResponse<Tontine>>>('/v1/tontines', {
      params: { page, size, sort },
    })
    return response.data.data
  },

  // ─── Récupérer une tontine par ID ────────────────────────────────────────────
  getTontine: async (id: string): Promise<Tontine> => {
    const response = await api.get<CustomResponse<Tontine>>(`/v1/tontines/${id}`)
    return response.data.data
  },

  // ─── Créer une tontine ───────────────────────────────────────────────────────
  createTontine: async (request: CreateTontineRequest): Promise<Tontine> => {
    const response = await api.post<CustomResponse<Tontine>>('/v1/tontines', request)
    return response.data.data
  },

  // ─── Mettre à jour une tontine (BROUILLON uniquement) ────────────────────────
  updateTontine: async (id: string, request: UpdateTontineRequest): Promise<Tontine> => {
    const response = await api.put<CustomResponse<Tontine>>(`/v1/tontines/${id}`, request)
    return response.data.data
  },

  // ─── Supprimer une tontine (soft delete, BROUILLON uniquement) ───────────────
  deleteTontine: async (id: string): Promise<void> => {
    await api.delete(`/v1/tontines/${id}`)
  },

  // ─── Activer une tontine (BROUILLON ou SUSPENDUE → ACTIVE) ───────────────────
  activerTontine: async (id: string): Promise<Tontine> => {
    const response = await api.put<CustomResponse<Tontine>>(`/v1/tontines/${id}/activer`)
    return response.data.data
  },

  // ─── Suspendre une tontine (ACTIVE → SUSPENDUE) ──────────────────────────────
  suspendreTontine: async (id: string): Promise<Tontine> => {
    const response = await api.put<CustomResponse<Tontine>>(`/v1/tontines/${id}/suspendre`)
    return response.data.data
  },

  // ─── Commissions ─────────────────────────────────────────────────────────────

  listCommissions: async (tontineId: string, page = 0, size = 20): Promise<PageResponse<Commission>> => {
    const response = await api.get<CustomResponse<PageResponse<Commission>>>(
      `/v1/tontines/${tontineId}/commissions`,
      { params: { page, size } }
    )
    return response.data.data
  },

  createCommission: async (tontineId: string, request: CreateCommissionRequest): Promise<Commission> => {
    const response = await api.post<CustomResponse<Commission>>(
      `/v1/tontines/${tontineId}/commissions`,
      request
    )
    return response.data.data
  },

  updateCommission: async (
    tontineId: string,
    commissionId: string,
    request: UpdateCommissionRequest
  ): Promise<Commission> => {
    const response = await api.put<CustomResponse<Commission>>(
      `/v1/tontines/${tontineId}/commissions/${commissionId}`,
      request
    )
    return response.data.data
  },

  deleteCommission: async (tontineId: string, commissionId: string): Promise<void> => {
    await api.delete(`/v1/tontines/${tontineId}/commissions/${commissionId}`)
  },
}
