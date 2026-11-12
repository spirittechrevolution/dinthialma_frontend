/**
 * B4 — À valider : file des paiements déclarés dans toutes mes tontines gérées (ou une seule).
 *
 * « Valider » en 1 tap, sans fenêtre : la ligne disparaît, un toast propose « Annuler » pendant 5 s,
 * puis la validation est envoyée. Balayer une ligne vers la droite valide aussi.
 * « Tout valider » demande une confirmation (validation groupée, bilan par paiement).
 * « Refuser » demande un motif (le membre peut déclarer à nouveau).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, PartyPopper, RotateCw, WifiOff } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { RefusSheet } from '@/components/pay/RefusSheet'
import { DemandesAdhesion } from '@/components/gestion/DemandesAdhesion'
import { useCotisationsAValider } from '@/hooks/useMe'
import { useOnline } from '@/hooks/useOnline'
import { validationService } from '@/services/validationService'
import { formatF, formatDateHeure } from '@/lib/format'
import { paymentMethodLabel } from '@/lib/paymentMethods'
import { messageErreur } from '@/lib/apiError'
import type { CotisationAValider } from '@/types/me'

const UNDO_MS = 5000

export function AValiderPage() {
  const navigate = useNavigate()
  const online = useOnline()
  const [params] = useSearchParams()
  const tontineId = params.get('tontine') ?? undefined
  const { data, isLoading, isError, refetch } = useCotisationsAValider(tontineId)

  /** Lignes masquées : validées localement (en attente d'envoi ou envoyées) */
  const [masquees, setMasquees] = useState<Set<string>>(new Set())
  const timers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; cot: CotisationAValider }>())
  const [confirmAll, setConfirmAll] = useState(false)
  const [bulk, setBulk] = useState<{ running: boolean; done: number | null; echecs: number; dejaTraites: number }>({ running: false, done: null, echecs: 0, dejaTraites: 0 })
  const [aRefuser, setARefuser] = useState<CotisationAValider | null>(null)
  const [refusEnCours, setRefusEnCours] = useState(false)

  const visibles = useMemo(() => (data ?? []).filter((c) => !masquees.has(c.id)), [data, masquees])
  const total = visibles.reduce((s, c) => s + c.montant, 0)
  const groupes = useMemo(() => {
    const map = new Map<string, { nom: string; items: CotisationAValider[] }>()
    for (const c of visibles) {
      const g = map.get(c.tontineId) ?? { nom: c.tontineNom, items: [] }
      g.items.push(c)
      map.set(c.tontineId, g)
    }
    return [...map.entries()]
  }, [visibles])

  // En quittant l'écran, les validations encore « annulables » partent tout de suite
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(({ timer, cot }) => {
        clearTimeout(timer)
        validationService.valider({ tontineId: cot.tontineId, cotisationId: cot.id }).catch(() => {})
      })
      pending.clear()
    }
  }, [])

  const restaurer = (id: string) => setMasquees((s) => { const n = new Set(s); n.delete(id); return n })

  const envoyer = async (cot: CotisationAValider) => {
    timers.current.delete(cot.id)
    try {
      await validationService.valider({ tontineId: cot.tontineId, cotisationId: cot.id })
    } catch {
      restaurer(cot.id)
      toast.error(`La validation du paiement de ${cot.membre.firstName} a échoué.`)
    }
  }

  const valider = (cot: CotisationAValider) => {
    if (!online) { toast.error('Connexion requise pour valider'); return }
    setMasquees((s) => new Set(s).add(cot.id))
    const timer = setTimeout(() => envoyer(cot), UNDO_MS)
    timers.current.set(cot.id, { timer, cot })
    toast.success(`Paiement de ${cot.membre.firstName} validé`, {
      duration: UNDO_MS,
      action: {
        label: 'Annuler',
        onClick: () => {
          const t = timers.current.get(cot.id)
          if (t) { clearTimeout(t.timer); timers.current.delete(cot.id) }
          restaurer(cot.id)
        },
      },
    })
  }

  const toutValider = async () => {
    setConfirmAll(false)
    const cibles = visibles.map((c) => ({ tontineId: c.tontineId, cotisationId: c.id }))
    setBulk({ running: true, done: null, echecs: 0, dejaTraites: 0 })
    setMasquees((s) => new Set([...s, ...cibles.map((c) => c.cotisationId)]))
    try {
      const bilan = await validationService.validerPlusieurs(cibles)
      const echecs = bilan.resultats.filter((r) => !r.succes)
      // Un paiement « déjà traité » disparaît de la file au rafraîchissement ; les autres échecs restent
      echecs.filter((r) => r.code !== 'COTISATION_NOT_PENDING').forEach((r) => restaurer(r.cotisationId))
      setBulk({
        running: false,
        done: bilan.validees,
        echecs: echecs.filter((r) => r.code !== 'COTISATION_NOT_PENDING').length,
        dejaTraites: echecs.filter((r) => r.code === 'COTISATION_NOT_PENDING').length,
      })
    } catch (err) {
      cibles.forEach((c) => restaurer(c.cotisationId))
      setBulk({ running: false, done: null, echecs: 0, dejaTraites: 0 })
      toast.error(messageErreur(err, 'La validation groupée a échoué. Réessayez.'))
    }
  }

  const refuser = async (motif: string) => {
    if (!aRefuser) return
    setRefusEnCours(true)
    try {
      await validationService.refuser({ tontineId: aRefuser.tontineId, cotisationId: aRefuser.id }, motif)
      setMasquees((s) => new Set(s).add(aRefuser.id))
      toast.success(`Paiement de ${aRefuser.membre.firstName} refusé`)
      setARefuser(null)
    } catch (err) {
      toast.error(messageErreur(err, 'Le refus a échoué. Réessayez.'))
    } finally {
      setRefusEnCours(false)
    }
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────
  if (bulk.done !== null) {
    return (
      <Shell>
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <span className="mx-auto w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center animate-pop">
            <CheckCircle2 size={40} />
          </span>
          <p className="mt-3 text-xl font-bold text-neutral-900">
            {bulk.done} paiement{bulk.done > 1 ? 's' : ''} validé{bulk.done > 1 ? 's' : ''}
          </p>
          {bulk.dejaTraites > 0 && (
            <p className="mt-1 text-sm text-neutral-600">{bulk.dejaTraites} déjà traité{bulk.dejaTraites > 1 ? 's' : ''} entre-temps.</p>
          )}
          {bulk.echecs > 0 && (
            <p className="mt-1 text-sm text-red-700">{bulk.echecs} n'ont pas pu être validés. Ils restent dans la liste.</p>
          )}
          <button
            onClick={() => (bulk.echecs > 0 ? setBulk({ running: false, done: null, echecs: 0, dejaTraites: 0 }) : navigate('/accueil'))}
            className="mt-6 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold"
          >
            {bulk.echecs > 0 ? 'Revoir la liste' : 'Terminé'}
          </button>
        </section>
      </Shell>
    )
  }

  return (
    <Shell>
      {!online && (
        <p role="status" className="mb-3 rounded-2xl bg-neutral-900 text-white text-sm px-4 py-2 flex items-center gap-2">
          <WifiOff size={16} /> Hors connexion · validation impossible
        </p>
      )}

      <DemandesAdhesion tontineId={tontineId} online={online} />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-3xl bg-white animate-pulse" />)}
        </div>
      ) : isError ? (
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-sm text-neutral-600">Impossible de charger les paiements.</p>
          <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
            <RotateCw size={16} /> Réessayer
          </button>
        </section>
      ) : visibles.length === 0 ? (
        <section className="bg-white rounded-3xl shadow-sm p-8 text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
            <PartyPopper size={30} />
          </span>
          <p className="mt-3 text-lg font-bold text-neutral-900">Rien à valider ✓</p>
          <p className="mt-1 text-sm text-neutral-500">Tous les paiements déclarés sont traités.</p>
        </section>
      ) : (
        <div className="space-y-4 pb-28">
          <p className="px-1 text-sm font-semibold text-neutral-600">
            {visibles.length} paiement{visibles.length > 1 ? 's' : ''} · {formatF(total)}
          </p>
          {groupes.map(([id, g]) => (
            <section key={id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {groupes.length > 1 && <h2 className="px-4 pt-3 text-sm font-semibold text-neutral-500">{g.nom}</h2>}
              <ul className="divide-y divide-neutral-100">
                {g.items.map((c) => (
                  <Ligne key={c.id} cot={c} disabled={!online || bulk.running} onValider={() => valider(c)} onRefuser={() => setARefuser(c)} onOpen={() => navigate(`/recu/${c.tontineId}/${c.id}`)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {visibles.length > 1 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setConfirmAll(true)}
              disabled={!online || bulk.running}
              className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50"
            >
              {bulk.running ? 'Validation…' : `Tout valider (${visibles.length})`}
            </button>
          </div>
        </div>
      )}

      {aRefuser && (
        <RefusSheet
          isOpen
          onClose={() => setARefuser(null)}
          membreNom={aRefuser.membre.firstName}
          montant={formatF(aRefuser.montant)}
          enCours={refusEnCours}
          onConfirmer={refuser}
        />
      )}

      <Modal isOpen={confirmAll} onClose={() => setConfirmAll(false)} title={`Valider ${visibles.length} paiements ?`} size="sm">
        <p className="text-neutral-600">
          {formatF(total)} seront marqués comme reçus et les membres seront prévenus.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setConfirmAll(false)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button onClick={toutValider} className="h-12 rounded-full bg-primary-700 text-white font-bold">Tout valider</button>
        </div>
      </Modal>
    </Shell>
  )
}

/** Ligne de la file ; balayage vers la droite (> 96 px) = valider */
function Ligne({ cot, disabled, onValider, onRefuser, onOpen }: { cot: CotisationAValider; disabled: boolean; onValider: () => void; onRefuser: () => void; onOpen: () => void }) {
  const startX = useRef<number | null>(null)
  const [dx, setDx] = useState(0)
  const nom = [cot.membre.firstName, cot.membre.lastName].filter(Boolean).join(' ')

  return (
    <li
      className="relative bg-primary-600"
      onTouchStart={(e) => { if (!disabled) startX.current = e.touches[0].clientX }}
      onTouchMove={(e) => { if (startX.current !== null) setDx(Math.max(0, e.touches[0].clientX - startX.current)) }}
      onTouchEnd={() => { if (dx > 96) onValider(); startX.current = null; setDx(0) }}
    >
      <span className="absolute inset-y-0 left-4 flex items-center text-white font-semibold gap-2" aria-hidden="true">
        <CheckCircle2 size={20} /> Valider
      </span>
      <div
        className="relative bg-white flex items-center gap-3 px-4 py-3 min-h-[72px]"
        style={{ transform: `translateX(${dx}px)`, transition: dx ? 'none' : 'transform 150ms ease-out' }}
      >
        <button onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <InitialsAvatar name={nom || '?'} />
          <span className="min-w-0">
            <span className="block font-semibold text-neutral-900 truncate">{nom}</span>
            <span className="block text-sm text-neutral-500 truncate">
              {formatF(cot.montant)} · {paymentMethodLabel(cot.methodePaiement)}
              {cot.referenceTransaction ? ` · ${cot.referenceTransaction}` : ''}
            </span>
            <span className="block text-xs text-neutral-400">{formatDateHeure(cot.createdAt)}</span>
          </span>
        </button>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={onValider}
            disabled={disabled}
            className="h-11 px-5 rounded-full bg-primary-700 text-white font-bold active:scale-[0.97] transition disabled:opacity-50"
          >
            Valider
          </button>
          <button onClick={onRefuser} disabled={disabled} className="h-8 px-3 rounded-full text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            Refuser
          </button>
        </div>
      </div>
    </li>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="À valider" />
      <main className="px-4 pb-6 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
