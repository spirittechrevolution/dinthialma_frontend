import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cycleService } from '@/services/cycleService'
import { OpenCycleRequest } from '@/types/cycle'

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
    },
  })
}

export function useDesignerBeneficiaire() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, cycleId, membreId }: { tontineId: string; cycleId: string; membreId?: string }) =>
      cycleService.designerBeneficiaire(tontineId, cycleId, membreId),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cycles', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['membres', tontineId] })
    },
  })
}
