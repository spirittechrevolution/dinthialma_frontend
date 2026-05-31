import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tontineService } from '@/services/tontineService'
import { CreateTontineRequest, UpdateTontineRequest, CreateCommissionRequest, UpdateCommissionRequest } from '@/types/tontine'

// ─── Tontines ─────────────────────────────────────────────────────────────────

export function useTontines(page = 0, size = 20) {
  return useQuery({
    queryKey: ['tontines', page, size],
    queryFn: () => tontineService.listTontines(page, size),
  })
}

export function useTontine(id: string) {
  return useQuery({
    queryKey: ['tontine', id],
    queryFn: () => tontineService.getTontine(id),
    enabled: !!id,
  })
}

export function useCreateTontine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateTontineRequest) => tontineService.createTontine(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
    },
  })
}

export function useUpdateTontine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTontineRequest }) =>
      tontineService.updateTontine(id, request),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
      queryClient.invalidateQueries({ queryKey: ['tontine', id] })
    },
  })
}

export function useDeleteTontine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tontineService.deleteTontine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
    },
  })
}

export function useActiverTontine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tontineService.activerTontine(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
      queryClient.invalidateQueries({ queryKey: ['tontine', id] })
    },
  })
}

export function useSuspendreTontine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tontineService.suspendreTontine(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tontines'] })
      queryClient.invalidateQueries({ queryKey: ['tontine', id] })
    },
  })
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export function useCommissions(tontineId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['commissions', tontineId, page, size],
    queryFn: () => tontineService.listCommissions(tontineId, page, size),
    enabled: !!tontineId,
  })
}

export function useCreateCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: CreateCommissionRequest }) =>
      tontineService.createCommission(tontineId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['commissions', tontineId] })
    },
  })
}

export function useUpdateCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tontineId,
      commissionId,
      request,
    }: {
      tontineId: string
      commissionId: string
      request: UpdateCommissionRequest
    }) => tontineService.updateCommission(tontineId, commissionId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['commissions', tontineId] })
    },
  })
}

export function useDeleteCommission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, commissionId }: { tontineId: string; commissionId: string }) =>
      tontineService.deleteCommission(tontineId, commissionId),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['commissions', tontineId] })
    },
  })
}
