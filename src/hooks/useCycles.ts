import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cycleService } from '@/services/cycleService'
import { OpenCycleRequest, DesignerGagnantsRequest } from '@/types/cycle'

export function useCycles(tontineId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['cycles', tontineId, page, size],
    queryFn: () => cycleService.listCycles(tontineId, page, size),
    enabled: !!tontineId,
  })
}

export function useCycle(tontineId: string, cycleId: string) {
  return useQuery({
    queryKey: ['cycle', tontineId, cycleId],
    queryFn: () => cycleService.getCycle(tontineId, cycleId),
    enabled: !!tontineId && !!cycleId,
  })
}

export function useBeneficiairesHistorique(tontineId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['beneficiaires-historique', tontineId, page, size],
    queryFn: () => cycleService.getBeneficiairesHistorique(tontineId, page, size),
    enabled: !!tontineId,
  })
}

export function useOpenCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: OpenCycleRequest }) =>
      cycleService.openCycle(tontineId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', tontineId] })
    },
  })
}

export function useCloturerCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, cycleId }: { tontineId: string; cycleId: string }) =>
      cycleService.cloturerCycle(tontineId, cycleId),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['tontine', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-historique', tontineId] })
    },
  })
}

export function useDesignerGagnants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tontineId,
      cycleId,
      request,
    }: {
      tontineId: string
      cycleId: string
      request: DesignerGagnantsRequest
    }) => cycleService.designerGagnants(tontineId, cycleId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['membres', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-historique', tontineId] })
    },
  })
}
