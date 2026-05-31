import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cycleService } from '@/services/cycleService'
import { CreateCycleRequest, UpdateCycleRequest } from '@/types/cycle'

export function useTontineCycles(tontineId: string, page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['tontineCycles', tontineId, page, size],
    queryFn: () => cycleService.getTontineCycles(tontineId, page, size),
    enabled: !!tontineId,
  })
}

export function useCycleById(tontineId: string, cycleId: string) {
  return useQuery({
    queryKey: ['cycle', tontineId, cycleId],
    queryFn: () => cycleService.getCycleById(tontineId, cycleId),
    enabled: !!tontineId && !!cycleId,
  })
}

export function useCreateCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: CreateCycleRequest }) =>
      cycleService.createCycle(tontineId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tontineCycles', variables.tontineId] })
    },
  })
}

export function useUpdateCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tontineId,
      cycleId,
      request,
    }: {
      tontineId: string
      cycleId: string
      request: UpdateCycleRequest
    }) => cycleService.updateCycle(tontineId, cycleId, request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tontineCycles', variables.tontineId] })
      queryClient.invalidateQueries({ queryKey: ['cycle', variables.tontineId, variables.cycleId] })
    },
  })
}

export function useFinishCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tontineId, cycleId }: { tontineId: string; cycleId: string }) =>
      cycleService.finishCycle(tontineId, cycleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tontineCycles', variables.tontineId] })
    },
  })
}

export function useStartNextCycle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tontineId: string) => cycleService.startNextCycle(tontineId),
    onSuccess: (_, tontineId) => {
      queryClient.invalidateQueries({ queryKey: ['tontineCycles', tontineId] })
    },
  })
}

export function useCycleStatistics(tontineId: string, cycleId: string) {
  return useQuery({
    queryKey: ['cycleStatistics', tontineId, cycleId],
    queryFn: () => cycleService.getCycleStatistics(tontineId, cycleId),
    enabled: !!tontineId && !!cycleId,
  })
}
