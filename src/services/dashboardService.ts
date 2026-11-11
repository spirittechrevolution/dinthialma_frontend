import api from './api'
import { CustomResponse, PageResponse, RawPage, toPage, TontineStatut, CotisationStatut } from '@/types/common'
import { GlobalDashboardResponse, MyDashboardResponse, TontineStats } from '@/types/dashboard'
import { Tontine } from '@/types/tontine'
import { Cotisation } from '@/types/cotisation'

export const dashboardService = {
  // ─── Dashboard global (SUPER_ADMIN) ──────────────────────────────────────────
  getGlobalDashboard: async (): Promise<GlobalDashboardResponse> => {
    const response = await api.get<CustomResponse<GlobalDashboardResponse>>('/v1/admin/dashboard')
    return response.data.data
  },

  // ─── Dashboard personnel (ADMIN de tontines) ─────────────────────────────────
  // `tontines` est paginé (tri backend : createdAt DESC).
  // `nombreTontinesGerees` reste le total global.
  getMyDashboard: async (page = 0, size = 20): Promise<MyDashboardResponse> => {
    const response = await api.get<
      CustomResponse<Omit<MyDashboardResponse, 'tontines'> & { tontines: RawPage<TontineStats> }>
    >('/v1/admin/my-dashboard', { params: { page, size } })
    const raw = response.data.data
    return {
      nombreTontinesGerees: Number(raw.nombreTontinesGerees ?? 0),
      montantTotalValide: Number(raw.montantTotalValide ?? 0),
      totalMembres: Number(raw.totalMembres ?? 0),
      totalCotisationsEnAttente: Number(raw.totalCotisationsEnAttente ?? 0),
      totalCotisationsEnRetard: Number(raw.totalCotisationsEnRetard ?? 0),
      totalCollecteToursEnCours: Number(raw.totalCollecteToursEnCours ?? 0),
      totalAttenduToursEnCours: raw.totalAttenduToursEnCours == null ? null : Number(raw.totalAttenduToursEnCours),
      tontines: toPage(raw.tontines),
    }
  },

  // ─── Toutes les tontines de la plateforme (SUPER_ADMIN) ──────────────────────
  listAllTontines: async (page = 0, size = 20, statut?: TontineStatut | ''): Promise<PageResponse<Tontine>> => {
    const response = await api.get<CustomResponse<RawPage<Tontine>>>('/v1/admin/dashboard/tontines', {
      params: { page, size, ...(statut ? { statut } : {}) },
    })
    return toPage(response.data.data)
  },

  // ─── Toutes les cotisations de la plateforme (SUPER_ADMIN) ───────────────────
  listAllContributions: async (
    page = 0,
    size = 20,
    filters: { statut?: CotisationStatut | ''; tontineId?: string } = {}
  ): Promise<PageResponse<Cotisation>> => {
    const response = await api.get<CustomResponse<RawPage<Cotisation>>>('/v1/admin/dashboard/contributions', {
      params: {
        page,
        size,
        ...(filters.statut ? { statut: filters.statut } : {}),
        ...(filters.tontineId ? { tontineId: filters.tontineId } : {}),
      },
    })
    return toPage(response.data.data)
  },
}
