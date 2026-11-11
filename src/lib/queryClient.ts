import { MutationCache, QueryClient } from '@tanstack/react-query'

/**
 * Toute mutation réussie (paiement, validation, clôture, ajout de membre…) rend obsolètes
 * les résumés de la couche « moi » (clés ['me', …]) : accueil, À valider, activité, jackpots.
 */
const mutationCache = new MutationCache({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['me'] })
  },
})

export const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
