import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qrService } from '@/services/qrService'

/** Mon QR membre (jeton opaque stable, sans numéro de téléphone) */
export function useMonQr(enabled = true) {
  return useQuery({ queryKey: ['me', 'qr'], queryFn: () => qrService.getMonQr(), enabled, staleTime: Infinity })
}

export function useRegenererMonQr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => qrService.regenererMonQr(),
    onSuccess: (qr) => qc.setQueryData(['me', 'qr'], qr),
  })
}

/** Invitation d'une tontine (gestionnaire) : code stable, créé à la première demande */
export function useInvitationTontine(tontineId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['invitation', tontineId],
    queryFn: () => qrService.obtenirInvitation(tontineId!),
    enabled: enabled && !!tontineId,
    staleTime: Infinity,
    retry: false,
  })
}

export function useRegenererInvitation(tontineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => qrService.obtenirInvitation(tontineId, true),
    onSuccess: (inv) => qc.setQueryData(['invitation', tontineId], inv),
  })
}

export function useRevoquerInvitation(tontineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => qrService.revoquerInvitation(tontineId),
    onSuccess: () => qc.removeQueries({ queryKey: ['invitation', tontineId] }),
  })
}

/** Demandes d'adhésion à traiter (gestionnaire) */
export function useDemandesGestion(tontineId?: string, enabled = true) {
  return useQuery({
    queryKey: ['me', 'demandes-gestion', tontineId ?? 'toutes'],
    queryFn: async () => (await qrService.listDemandesGestion({ statut: 'EN_ATTENTE', tontineId })).content,
    enabled,
    staleTime: 60_000,
  })
}

/** Mes demandes d'adhésion envoyées */
export function useMesDemandes(enabled = true) {
  return useQuery({
    queryKey: ['me', 'demandes'],
    queryFn: async () => (await qrService.listMesDemandes()).content,
    enabled,
    staleTime: 60_000,
  })
}
