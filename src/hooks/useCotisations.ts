import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotisationService } from '@/services/cotisationService'
import { CreateCotisationRequest, ValidateCotisationRequest, CotisationFilters } from '@/types/cotisation'

export function useTontineContributions(
  tontineId: string,
  filters?: CotisationFilters,
  page: number = 0,
  size: number = 20
) {
  return useQuery({
    queryKey: ['tontineContributions', tontineId, filters, page, size],
    queryFn: () => cotisationService.getTontineContributions(tontineId, filters, page, size),
    enabled: !!tontineId,
  })
}

export function useMemberContributions(
  tontineId: string,
  memberId: string,
  page: number = 0,
  size: number = 20
) {
  return useQuery({
    queryKey: ['memberContributions', tontineId, memberId, page, size],
    queryFn: () => cotisationService.getMemberContributions(tontineId, memberId, page, size),
    enabled: !!tontineId && !!memberId,
  })
}

export function useMyContributions(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: ['myContributions', page, size],
    queryFn: () => cotisationService.getMyContributions(page, size),
  })
}

export function useContributionById(contributionId: string) {
  return useQuery({
    queryKey: ['contribution', contributionId],
    queryFn: () => cotisationService.getContributionById(contributionId),
    enabled: !!contributionId,
  })
}

export function useCreateContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateCotisationRequest) => cotisationService.createContribution(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContributions'] })
    },
  })
}

export function useValidateContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ValidateCotisationRequest) => cotisationService.validateContribution(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontineContributions'] })
    },
  })
}

export function useRejectContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contributionId, reason }: { contributionId: string; reason?: string }) =>
      cotisationService.rejectContribution(contributionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tontineContributions'] })
    },
  })
}

export function useContributionStatistics(tontineId: string) {
  return useQuery({
    queryKey: ['contributionStatistics', tontineId],
    queryFn: () => cotisationService.getContributionStatistics(tontineId),
    enabled: !!tontineId,
  })
}

export function useContributionsByCycle(
  tontineId: string,
  cycleId: string,
  page: number = 0,
  size: number = 20
) {
  return useQuery({
    queryKey: ['contributionsByCycle', tontineId, cycleId, page, size],
    queryFn: () => cotisationService.getContributionsByCycle(tontineId, cycleId, page, size),
    enabled: !!tontineId && !!cycleId,
  })
}
