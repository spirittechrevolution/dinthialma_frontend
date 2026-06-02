import api from './api'
import { Cycle, OpenCycleRequest } from '@/types/cycle'
import { PageResponse, CustomResponse } from '@/types/common'

export const cycleService = {
  // ─── Lister les cycles d'une tontine ─────────────────────────────────────────
  listCycles: async (tontineId: string, page = 0, size = 20): Promise<PageResponse<Cycle>> => {
    const response = await api.get<CustomResponse<PageResponse<Cycle>>>(
      `/v1/tontines/${tontineId}/cycles`,
      { params: { page, size, sort: 'numeroCycle,asc' } }
    )
    return response.data.data
  },

  // ─── Récupérer un cycle ───────────────────────────────────────────────────────
  getCycle: async (tontineId: string, cycleId: string): Promise<Cycle> => {
    const response = await api.get<CustomResponse<Cycle>>(
      `/v1/tontines/${tontineId}/cycles/${cycleId}`
    )
    return response.data.data
  },

  // ─── Ouvrir un cycle manuellement (mode MANUEL uniquement) ───────────────────
  openCycle: async (tontineId: string, request: OpenCycleRequest): Promise<Cycle> => {
    const response = await api.post<CustomResponse<Cycle>>(
      `/v1/tontines/${tontineId}/cycles`,
      request
    )
    return response.data.data
  },

  // ─── Clôturer un cycle (EN_COURS → TERMINÉ) ──────────────────────────────────
  cloturerCycle: async (tontineId: string, cycleId: string): Promise<Cycle> => {
    const response = await api.put<CustomResponse<Cycle>>(
      `/v1/tontines/${tontineId}/cycles/${cycleId}/cloturer`
    )
    return response.data.data
  },

  // ─── Désigner le bénéficiaire du jackpot (mode MANUEL, cycle TERMINÉ) ────────
  // membreId absent = sélection aléatoire
  designerBeneficiaire: async (tontineId: string, cycleId: string, membreId?: string): Promise<Cycle> => {
    const response = await api.patch<CustomResponse<Cycle>>(
      `/v1/tontines/${tontineId}/cycles/${cycleId}/beneficiaire`,
      membreId ? { membreId } : {}
    )
    return response.data.data
  },
}
