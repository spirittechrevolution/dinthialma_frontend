import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotisationService } from '@/services/cotisationService'
import { RecordCotisationRequest, AdminRecordCotisationRequest, UpdateCotisationRequest } from '@/types/cotisation'

export function useCotisations(
  tontineId: string,
  cycleId?: string,
  page = 0,
  size = 20,
  membreId?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['cotisations', tontineId, cycleId, page, size, membreId],
    queryFn: () => cotisationService.listCotisations(tontineId, cycleId, page, size, membreId),
    enabled: !!tontineId && enabled,
  })
}

export function useRecapCycle(tontineId: string, cycleId: string, page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: ['recapCycle', tontineId, cycleId, page, size],
    queryFn: () => cotisationService.getRecapCycle(tontineId, cycleId, page, size),
    enabled: enabled && !!tontineId && !!cycleId,
    placeholderData: (prev) => prev,
  })
}

export function useRecapTotal(tontineId: string, page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: ['recapTotal', tontineId, page, size],
    queryFn: () => cotisationService.getRecapTotal(tontineId, page, size),
    enabled: enabled && !!tontineId,
    placeholderData: (prev) => prev,
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
      queryClient.invalidateQueries({ queryKey: ['recapCycle', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['recapTotal', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['cotisationsRecapTotal', tontineId] })
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
      queryClient.invalidateQueries({ queryKey: ['recapCycle', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['recapTotal', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['cotisationsRecapTotal', tontineId] })
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
      queryClient.invalidateQueries({ queryKey: ['recapCycle', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['recapTotal', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['cotisationsRecapTotal', tontineId] })
    },
  })
}

export function useUpdateCotisation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tontineId,
      cotisationId,
      request,
    }: {
      tontineId: string
      cotisationId: string
      request: UpdateCotisationRequest
    }) => cotisationService.updateCotisation(tontineId, cotisationId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['cotisations', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['recapCycle', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['recapTotal', tontineId] })
      queryClient.invalidateQueries({ queryKey: ['cotisationsRecapTotal', tontineId] })
    },
  })
}

export function useCotisationsRecapTotal(tontineId: string, enabled = true) {
  return useQuery({
    queryKey: ['cotisationsRecapTotal', tontineId],
    queryFn: () => cotisationService.getCotisationsRecapTotal(tontineId),
    enabled: !!tontineId && enabled,
  })
}
