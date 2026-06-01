import api from './api'
import { CustomResponse, CodeListItem, PageResponse } from '@/types/common'

export type CodeListType =
  | 'FREQUENCE_TONTINE'
  | 'METHODE_PAIEMENT'
  | 'STATUT_COTISATION'
  | 'ORDRE_BENEFICIAIRE'
  | 'ROLE_INTERNE'

export interface CodeListRequest {
  type: string
  value: string
  description: string
}

export const codeListService = {
  // ─── Endpoint public (aucun token requis) ─────────────────────────────────────
  getByType: async (type: CodeListType): Promise<CodeListItem[]> => {
    const response = await api.get<CustomResponse<CodeListItem[]>>(
      `/v1/code-list/type/${type}`
    )
    return response.data.data
  },

  // ─── Endpoint admin (ADMIN ou SUPER_ADMIN) ────────────────────────────────────
  getByTypeAdmin: async (type: string): Promise<CodeListItem[]> => {
    const response = await api.get<CustomResponse<CodeListItem[]>>(
      `/v1/code-list/admin/type/${type}`
    )
    return response.data.data
  },

  getById: async (id: string): Promise<CodeListItem> => {
    const response = await api.get<CustomResponse<CodeListItem>>(`/v1/code-list/${id}`)
    return response.data.data
  },

  // ─── Gestion des référentiels (SUPER_ADMIN) ───────────────────────────────────
  list: async (page = 0, size = 100): Promise<PageResponse<CodeListItem>> => {
    const response = await api.get<CustomResponse<PageResponse<CodeListItem>>>(
      '/v1/code-list',
      { params: { page, size, sort: 'type,asc' } }
    )
    return response.data.data
  },

  create: async (request: CodeListRequest): Promise<CodeListItem> => {
    const response = await api.post<CustomResponse<CodeListItem>>('/v1/code-list', request)
    return response.data.data
  },

  update: async (id: string, request: Partial<CodeListRequest>): Promise<CodeListItem> => {
    const response = await api.put<CustomResponse<CodeListItem>>(`/v1/code-list/${id}`, request)
    return response.data.data
  },
}
