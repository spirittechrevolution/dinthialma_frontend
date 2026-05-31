import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'

export function useGlobalDashboard() {
  return useQuery({
    queryKey: ['globalDashboard'],
    queryFn: () => dashboardService.getGlobalDashboard(),
  })
}

export function useMyDashboard() {
  return useQuery({
    queryKey: ['myDashboard'],
    queryFn: async () => {
      const data = await dashboardService.getMyDashboard()
      // Normalise tontineId → id pour compatibilité avec le composant Table
      return {
        ...data,
        tontines: data.tontines.map((t) => ({ ...t, id: t.tontineId })),
      }
    },
  })
}
