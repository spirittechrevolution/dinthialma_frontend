import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotisationService } from '@/services/cotisationService'
import { RecordCotisationRequest, AdminRecordCotisationRequest } from '@/types/cotisation'

export function useCotisations(tontineId: string, cycleId?: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['cotisations', tontineId, cycleId, page, size],
    queryFn: () => cotisationService.listCotisations(tontineId, cycleId, page, size),
    enabled: !!tontineId,
  })
}

export function useCotisation(tontineId: string, cotisationId: string) {
  return useQuery({
    queryKey: ['cotisation', tontineId, cotisationId],
    queryFn: () => cotisationService.getCotisation(tontineId, cotisationId),
    enabled: !!tontineId && !!cotisationId,
  })
}

export function useRecordCotisation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: RecordCotisationRequest }) =>
      cotisationService.recordCotisation(tontineId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cotisations', tontineId] })
    },
  })
}

export function useValiderCotisation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, cotisationId }: { tontineId: string; cotisationId: string }) =>
      cotisationService.validerCotisation(tontineId, cotisationId),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cotisations', tontineId] })
    },
  })
}

export function useAdminRecordCotisation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: AdminRecordCotisationRequest }) =>
      cotisationService.adminRecordCotisation(tontineId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cotisations', tontineId] })
    },
  })
}
