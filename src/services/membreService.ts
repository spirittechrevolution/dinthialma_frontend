import api from './api'
import { Membre, AddMembreRequest, UpdateMembreStatutRequest } from '@/types/membre'
import { PageResponse, CustomResponse } from '@/types/common'

export const membreService = {
  // ─── Lister les membres d'une tontine ────────────────────────────────────────
  listMembres: async (tontineId: string, page = 0, size = 20): Promise<PageResponse<Membre>> => {
    const response = await api.get<CustomResponse<PageResponse<Membre>>>(
      `/v1/tontines/${tontineId}/membres`,
      { params: { page, size, sort: 'ordreJackpot,asc' } }
    )
    return response.data.data
  },

  // ─── Ajouter un membre ───────────────────────────────────────────────────────
  addMembre: async (tontineId: string, request: AddMembreRequest): Promise<Membre> => {
    const response = await api.post<CustomResponse<Membre>>(
      `/v1/tontines/${tontineId}/membres`,
      request
    )
    return response.data.data
  },

  // ─── Modifier le statut d'un membre ─────────────────────────────────────────
  updateStatut: async (
    tontineId: string,
    membreId: string,
    request: UpdateMembreStatutRequest
  ): Promise<Membre> => {
    const response = await api.patch<CustomResponse<Membre>>(
      `/v1/tontines/${tontineId}/membres/${membreId}/statut`,
      request
    )
    return response.data.data
  },

  // ─── Retirer un membre (soft delete) ─────────────────────────────────────────
  removeMembre: async (tontineId: string, membreId: string): Promise<void> => {
    await api.delete(`/v1/tontines/${tontineId}/membres/${membreId}`)
  },
}
