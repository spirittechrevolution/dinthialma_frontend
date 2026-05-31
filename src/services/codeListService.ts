import api from './api'
import { CustomResponse, CodeListItem } from '@/types/common'

export type CodeListType =
  | 'FREQUENCE_TONTINE'
  | 'METHODE_PAIEMENT'
  | 'STATUT_COTISATION'
  | 'ORDRE_BENEFICIAIRE'

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
}
