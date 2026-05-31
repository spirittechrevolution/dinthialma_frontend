import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membreService } from '@/services/membreService'
import { AddMembreRequest, UpdateMembreStatutRequest } from '@/types/membre'

export function useMembres(tontineId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['membres', tontineId, page, size],
    queryFn: () => membreService.listMembres(tontineId, page, size),
    enabled: !!tontineId,
  })
}

export function useAddMembre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, request }: { tontineId: string; request: AddMembreRequest }) =>
      membreService.addMembre(tontineId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['membres', tontineId] })
    },
  })
}

export function useUpdateMembreStatut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tontineId,
      membreId,
      request,
    }: {
      tontineId: string
      membreId: string
      request: UpdateMembreStatutRequest
    }) => membreService.updateStatut(tontineId, membreId, request),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['membres', tontineId] })
    },
  })
}

export function useRemoveMembre() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ tontineId, membreId }: { tontineId: string; membreId: string }) =>
      membreService.removeMembre(tontineId, membreId),
    onSuccess: (_, { tontineId }) => {
      queryClient.invalidateQueries({ queryKey: ['membres', tontineId] })
    },
  })
}
