import api from './api'
import { Cotisation, RecordCotisationRequest, AdminRecordCotisationRequest, UpdateCotisationRequest, CotisationRecapItem } from '@/types/cotisation'
import { PageResponse, CustomResponse } from '@/types/common'

export const cotisationService = {
  // ─── Lister les cotisations d'une tontine ────────────────────────────────────
  // SUPER_ADMIN et créateur voient tout, MEMBER voit les siennes uniquement
  listCotisations: async (
    tontineId: string,
    cycleId?: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Cotisation>> => {
    const response = await api.get<CustomResponse<PageResponse<Cotisation>>>(
      `/v1/tontines/${tontineId}/cotisations`,
      { params: { page, size, sort: 'createdAt,desc', ...(cycleId ? { cycleId } : {}) } }
    )
    return response.data.data
  },

  // ─── Récupérer une cotisation ─────────────────────────────────────────────────
  getCotisation: async (tontineId: string, cotisationId: string): Promise<Cotisation> => {
    const response = await api.get<CustomResponse<Cotisation>>(
      `/v1/tontines/${tontineId}/cotisations/${cotisationId}`
    )
    return response.data.data
  },

  // ─── Enregistrer une cotisation (par le membre) ───────────────────────────────
  recordCotisation: async (tontineId: string, request: RecordCotisationRequest): Promise<Cotisation> => {
    const response = await api.post<CustomResponse<Cotisation>>(
      `/v1/tontines/${tontineId}/cotisations`,
      request
    )
    return response.data.data
  },

  // ─── Valider une cotisation (par l'admin) ─────────────────────────────────────
  validerCotisation: async (tontineId: string, cotisationId: string): Promise<Cotisation> => {
    const response = await api.put<CustomResponse<Cotisation>>(
      `/v1/tontines/${tontineId}/cotisations/${cotisationId}/valider`
    )
    return response.data.data
  },

  // ─── Enregistrement admin d'une cotisation (directement VALIDÉE) ──────────────
  adminRecordCotisation: async (tontineId: string, request: AdminRecordCotisationRequest): Promise<Cotisation> => {
    const response = await api.post<CustomResponse<Cotisation>>(
      `/v1/tontines/${tontineId}/cotisations/admin`,
      request
    )
    return response.data.data
  },

  // ─── Modifier une cotisation (PATCH — seuls les champs fournis sont mis à jour) ──
  updateCotisation: async (
    tontineId: string,
    cotisationId: string,
    request: UpdateCotisationRequest
  ): Promise<Cotisation> => {
    const response = await api.patch<CustomResponse<Cotisation>>(
      `/v1/tontines/${tontineId}/cotisations/${cotisationId}`,
      request
    )
    return response.data.data
  },

  // ─── Récapitulatif cotisations d'un cycle par membre ─────────────────────────
  getCotisationRecap: async (tontineId: string, cycleId: string): Promise<CotisationRecapItem[]> => {
    const response = await api.get<CustomResponse<CotisationRecapItem[]>>(
      `/v1/tontines/${tontineId}/cotisations/recap/${cycleId}`
    )
    return response.data.data
  },
}
