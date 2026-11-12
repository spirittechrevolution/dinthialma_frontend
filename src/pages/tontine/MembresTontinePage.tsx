/**
 * T3 — Membres d'une tontine, par ordre de passage.
 * Gestionnaire : « + Ajouter », situation de paiement du tour en cours, tap → fiche membre (T4).
 * Membre / lecture : liste en consultation.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { Search, UserPlus, ChevronRight, Trophy, RotateCw, Users } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useMembres } from '@/hooks/useMembres'
import { useCycles } from '@/hooks/useCycles'
import { useRecapCycle } from '@/hooks/useCotisations'
import { AccountStatus, CotisationStatut, CycleStatut, MembreStatut } from '@/types/common'
import type { Membre } from '@/types/membre'

const STATUT_MEMBRE: Record<MembreStatut, { label: string; cls: string } | null> = {
  ACTIF: null,
  SUSPENDU: { label: 'Suspendu', cls: 'bg-amber-50 text-amber-800' },
  SORTI: { label: 'Sorti', cls: 'bg-neutral-100 text-neutral-600' },
}

export function MembresTontinePage() {
  const { id = '' } = useParams()
  const v = useTontineVue(id)
  const gerant = v.vue === 'GERE'
  const { data, isLoading, isError, refetch } = useMembres(id, 0, 200)
  const { data: cyclesData } = useCycles(id, 0, 200)
  const cycleEnCours = cyclesData?.content.find((c) => c.statut === CycleStatut.EN_COURS)
  const recap = useRecapCycle(id, cycleEnCours?.id ?? '', 0, 200, gerant && !!cycleEnCours)
  const [q, setQ] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const situation = (m: Membre) => recap.data?.content.find((l) => l.membreId === m.id)
  const membres = [...(data?.content ?? [])]
    .sort((a, b) => (a.statut === MembreStatut.SORTI ? 1 : 0) - (b.statut === MembreStatut.SORTI ? 1 : 0) || (a.ordreJackpot ?? 0) - (b.ordreJackpot ?? 0))
    .filter((m) => {
      const s = q.trim().toLowerCase()
      return !s || `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(s) || m.user.phone.includes(s.replace(/\s/g, ''))
    })

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader
        title={v.tontine ? `Membres · ${v.tontine.nom}` : 'Membres'}
        right={gerant ? (
          <button onClick={() => setAddOpen(true)} className="h-11 px-4 mr-1 rounded-full bg-primary-700 text-white text-sm font-bold inline-flex items-center gap-1.5">
            <UserPlus size={16} /> Ajouter
          </button>
        ) : undefined}
      />
      <main className="px-4 pb-6 max-w-lg mx-auto space-y-3">
        {(data?.content.length ?? 0) > 6 && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nom ou numéro"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white shadow-sm text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
              aria-label="Chercher un membre"
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger les membres.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          </section>
        ) : (data?.content.length ?? 0) === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><Users size={26} /></span>
            <p className="mt-3 text-lg font-bold text-neutral-900">Aucun membre</p>
            {gerant && (
              <button onClick={() => setAddOpen(true)} className="mt-4 h-12 px-5 rounded-full bg-primary-700 text-white font-bold">Ajouter vos premiers membres</button>
            )}
          </section>
        ) : (
          <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {membres.map((m) => {
              const nom = `${m.user.firstName} ${m.user.lastName}`.trim()
              const st = STATUT_MEMBRE[m.statut]
              const sit = gerant && cycleEnCours && m.statut === MembreStatut.ACTIF ? situation(m) : undefined
              const paye = sit?.statutCotisation === CotisationStatut.VALIDE
              const declare = sit?.statutCotisation === CotisationStatut.EN_ATTENTE
              // REFUSE (dernier refus affiché par le récap) = pas encore payé
              const contenu = (
                <>
                  <span className="w-8 text-center text-sm font-bold text-neutral-400 tabular-nums">{m.ordreJackpot || '—'}</span>
                  <InitialsAvatar name={nom || '?'} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-900 truncate">{nom}</span>
                      {m.aRecuJackpot && <Trophy size={14} className="text-yellow-700 flex-shrink-0" aria-label="A reçu le jackpot" />}
                    </span>
                    <span className="flex flex-wrap gap-1 mt-0.5">
                      {st && <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.cls)}>{st.label}</span>}
                      {m.user.accountStatus === AccountStatus.PRE_ENROLLED && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">Sans compte</span>}
                      {sit && (
                        <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', paye ? 'bg-primary-50 text-primary-800' : declare ? 'bg-amber-50 text-amber-800' : 'bg-neutral-100 text-neutral-600')}>
                          {paye ? 'Payé ✓' : declare ? 'À valider' : 'Pas encore payé'}
                        </span>
                      )}
                    </span>
                  </span>
                  {gerant && <ChevronRight size={18} className="text-neutral-300" />}
                </>
              )
              return (
                <li key={m.id}>
                  {gerant ? (
                    <Link to={`/tontine/${id}/membres/${m.id}`} className="flex items-center gap-3 px-3 py-3 min-h-[64px] hover:bg-neutral-50">{contenu}</Link>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-3 min-h-[64px]">{contenu}</div>
                  )}
                </li>
              )
            })}
            {membres.length === 0 && <li className="px-4 py-6 text-center text-sm text-neutral-500">Aucun membre ne correspond.</li>}
          </ul>
        )}
      </main>
      {gerant && <AddMembreModal tontineId={id} isOpen={addOpen} onClose={() => setAddOpen(false)} />}
    </div>
  )
}
