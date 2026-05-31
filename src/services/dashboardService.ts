import api from './api'
import { CustomResponse } from '@/types/common'
import { GlobalDashboardResponse, MyDashboardResponse } from '@/types/dashboard'

export const dashboardService = {
  // ─── Dashboard global (SUPER_ADMIN) ──────────────────────────────────────────
  getGlobalDashboard: async (): Promise<GlobalDashboardResponse> => {
    const response = await api.get<CustomResponse<GlobalDashboardResponse>>('/v1/admin/dashboard')
    return response.data.data
  },

  // ─── Dashboard personnel (ADMIN de tontines) ─────────────────────────────────
  getMyDashboard: async (): Promise<MyDashboardResponse> => {
    const response = await api.get<CustomResponse<MyDashboardResponse>>('/v1/admin/my-dashboard')
    return response.data.data
  },
}
