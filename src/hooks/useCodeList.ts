import { useQuery } from '@tanstack/react-query'
import { codeListService, CodeListType } from '@/services/codeListService'

export function useCodeList(type: CodeListType) {
  return useQuery({
    queryKey: ['codeList', type],
    queryFn: () => codeListService.getByType(type),
    staleTime: 1000 * 60 * 60, // 1 heure — les référentiels changent rarement
  })
}

export function useCodeListAdmin(type: string) {
  return useQuery({
    queryKey: ['codeListAdmin', type],
    queryFn: () => codeListService.getByTypeAdmin(type),
    staleTime: 1000 * 60 * 60,
  })
}
