import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'
import { TontineStatut, CotisationStatut } from '@/types/common'

export function useGlobalDashboard() {
  return useQuery({
    queryKey: ['globalDashboard'],
    queryFn: () => dashboardService.getGlobalDashboard(),
  })
}

export function useMyDashboard(page = 0, size = 20) {
  return useQuery({
    queryKey: ['myDashboard', page, size],
    queryFn: async () => {
      const data = await dashboardService.getMyDashboard(page, size)
      // Normalise tontineId → id pour compatibilité avec le composant Table
      return {
        ...data,
        tontines: {
          ...data.tontines,
          content: data.tontines.content.map((t) => ({ ...t, id: t.tontineId ?? t.id })),
        },
      }
    },
    placeholderData: (prev) => prev,
  })
}

export function useAllTontinesAdmin(page = 0, size = 20, statut: TontineStatut | '' = '') {
  return useQuery({
    queryKey: ['adminAllTontines', page, size, statut],
    queryFn: () => dashboardService.listAllTontines(page, size, statut),
    placeholderData: (prev) => prev,
  })
}

export function useAllContributionsAdmin(
  page = 0,
  size = 20,
  filters: { statut?: CotisationStatut | ''; tontineId?: string } = {}
) {
  return useQuery({
    queryKey: ['adminAllContributions', page, size, filters.statut ?? '', filters.tontineId ?? ''],
    queryFn: () => dashboardService.listAllContributions(page, size, filters),
    placeholderData: (prev) => prev,
  })
}
