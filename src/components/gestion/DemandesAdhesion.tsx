/**
 * Demandes d'adhésion à traiter (gestionnaire, B17) — affichées en tête de la file « À valider ».
 * Accepter = ajout de membre classique ; Refuser avec un motif facultatif.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { useDemandesGestion } from '@/hooks/useQr'
import { qrService, type DemandeAdhesion } from '@/services/qrService'
import { formatDateHeure } from '@/lib/format'
import { formatPhoneLocal } from '@/lib/phone'
import { messageErreur } from '@/lib/apiError'

export function DemandesAdhesion({ tontineId, online }: { tontineId?: string; online: boolean }) {
  const qc = useQueryClient()
  const { data } = useDemandesGestion(tontineId)
  const [aRefuser, setARefuser] = useState<DemandeAdhesion | null>(null)
  const [motif, setMotif] = useState('')

  const rafraichir = (d: DemandeAdhesion) => {
    qc.invalidateQueries({ queryKey: ['membres', d.tontineId] })
    qc.invalidateQueries({ queryKey: ['tontine', d.tontineId] })
  }
  const accepter = useMutation({
    mutationFn: (d: DemandeAdhesion) => qrService.accepterDemande(d.tontineId, d.id),
    onSuccess: (_, d) => { rafraichir(d); toast.success(`${d.firstName} a rejoint ${d.tontineNom}`) },
    onError: (err) => toast.error(messageErreur(err, "L'acceptation a échoué.")),
  })
  const refuser = useMutation({
    mutationFn: ({ d, m }: { d: DemandeAdhesion; m: string }) => qrService.refuserDemande(d.tontineId, d.id, m || undefined),
    onSuccess: (_, { d }) => { toast.success(`Demande de ${d.firstName} refusée`); setARefuser(null); setMotif('') },
    onError: (err) => toast.error(messageErreur(err, 'Le refus a échoué.')),
  })

  const demandes = data ?? []
  if (demandes.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-600">
        Demandes d'adhésion ({demandes.length})
      </h2>
      <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
        {demandes.map((d) => {
          const nom = `${d.firstName} ${d.lastName}`.trim()
          const occupe = (accepter.isPending && accepter.variables?.id === d.id) || (refuser.isPending && refuser.variables?.d.id === d.id)
          return (
            <li key={d.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={nom || '?'} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-900 truncate">{nom}</p>
                  <p className="text-sm text-neutral-500 truncate">
                    {d.tontineNom}{d.phone ? ` · ${formatPhoneLocal(d.phone)}` : ''}
                  </p>
                  {d.message && <p className="mt-1 text-sm text-neutral-700">« {d.message} »</p>}
                  <p className="text-xs text-neutral-400">{formatDateHeure(d.createdAt)}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setARefuser(d)} disabled={!online || occupe} className="h-10 px-4 rounded-full text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  Refuser
                </button>
                <button onClick={() => accepter.mutate(d)} disabled={!online || occupe} className="h-10 px-4 rounded-full bg-primary-700 text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                  <UserPlus size={16} /> Accepter
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <Modal isOpen={!!aRefuser} onClose={() => { setARefuser(null); setMotif('') }} title={`Refuser la demande de ${aRefuser?.firstName ?? ''} ?`} size="sm">
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Motif (facultatif) : tontine complète, inconnu…"
          className="w-full px-4 py-3 rounded-2xl bg-neutral-100 text-[16px] resize-none outline-none focus:ring-2 focus:ring-primary-600"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => { setARefuser(null); setMotif('') }} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button onClick={() => aRefuser && refuser.mutate({ d: aRefuser, m: motif.trim() })} disabled={refuser.isPending} className="h-12 rounded-full bg-red-600 text-white font-bold disabled:opacity-50">
            {refuser.isPending ? '…' : 'Refuser'}
          </button>
        </div>
      </Modal>
    </section>
  )
}
