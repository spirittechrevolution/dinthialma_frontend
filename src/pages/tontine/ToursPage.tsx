/**
 * T6 — Tours d'une tontine : tour en cours épinglé, puis tous les tours.
 * Gestionnaire en mode manuel sans tour en cours : « Démarrer le tour suivant ».
 * Desktop : détail du tour (T7) dans un panneau à droite ; /tontine/:id/tours/:cycleId ouvre cette page avec le panneau.
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Panneau, PanneauVide } from '@/components/layout/Panneau'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { TourPage } from '@/pages/tontine/TourPage'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { ChevronRight, Trophy, RotateCw, RefreshCw } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Modal } from '@/components/ui/Modal'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useCycles, useOpenCycle } from '@/hooks/useCycles'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte } from '@/lib/format'
import { TOUR_STATUT, datesTourSuggerees } from '@/lib/tontineLabels'
import { messageErreur } from '@/lib/apiError'
import { CycleStatut, ModeCycle, TontineStatut } from '@/types/common'
import { TontineType } from '@/types/tontine'
import type { Cycle } from '@/types/cycle'

export function ToursPage() {
  const { id = '', cycleId } = useParams()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const online = useOnline()
  const v = useTontineVue(id)
  const t = v.tontine
  const { data, isLoading, isError, refetch } = useCycles(id, 0, 200)
  const cycles = [...(data?.content ?? [])].sort((a, b) => b.numeroCycle - a.numeroCycle)
  const enCours = cycles.find((c) => c.statut === CycleStatut.EN_COURS)
  const autres = cycles.filter((c) => c.id !== enCours?.id)
  const isEvent = t?.tontineType === TontineType.EVENEMENTIELLE
  const motTour = isEvent ? 'Période' : 'Tour'

  const peutDemarrer = v.vue === 'GERE' && t?.statut === TontineStatut.ACTIVE && t?.modeCycle === ModeCycle.MANUEL && !enCours
  const [demarrerOpen, setDemarrerOpen] = useState(false)

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title={t ? `${isEvent ? 'Périodes' : 'Tours'} · ${t.nom}` : 'Tours'} />
      <main className={clsx('px-4 mx-auto', desktop ? 'pb-10 max-w-[1200px] lg:px-8 grid grid-cols-[minmax(0,1fr)_460px] gap-6 items-start' : 'pb-28 max-w-lg')}>
        <div className="space-y-4 min-w-0">
        {desktop && peutDemarrer && (
          <button
            onClick={() => setDemarrerOpen(true)}
            disabled={!online}
            className="w-full h-12 rounded-full bg-primary-700 text-white font-bold hover:bg-primary-800 disabled:opacity-50"
          >
            {cycles.length ? 'Démarrer le tour suivant' : 'Démarrer le premier tour'}
          </button>
        )}
        {isLoading || v.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-3xl bg-white animate-pulse" />)}
          </div>
        ) : isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger les tours.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
              <RotateCw size={16} /> Réessayer
            </button>
          </section>
        ) : cycles.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><RefreshCw size={26} /></span>
            <p className="mt-3 text-lg font-bold text-neutral-900">Aucun {motTour.toLowerCase()} pour l'instant</p>
            <p className="mt-1 text-sm text-neutral-500">
              {peutDemarrer ? 'Démarrez le premier tour pour commencer à collecter.' : 'Le premier tour sera ouvert par le gestionnaire.'}
            </p>
          </section>
        ) : (
          <>
            {enCours && (
              <section>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-600">En cours</h2>
                <ul className="bg-white rounded-3xl shadow-sm ring-2 ring-primary-600 overflow-hidden"><LigneTour tontineId={id} cycle={enCours} mot={motTour} selected={enCours.id === cycleId} replace={desktop} /></ul>
              </section>
            )}
            {autres.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-600">Tous les {isEvent ? 'périodes' : 'tours'}</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
                  {autres.map((c) => <LigneTour key={c.id} tontineId={id} cycle={c} mot={motTour} selected={c.id === cycleId} replace={desktop} />)}
                </ul>
              </section>
            )}
          </>
        )}
        </div>

        {/* Desktop : détail du tour choisi à droite */}
        {desktop && (
          cycleId ? (
            <Panneau label={`Détail du ${motTour.toLowerCase()}`} onClose={() => navigate(`/tontine/${id}/tours`, { replace: true })}>
              <TourPage />
            </Panneau>
          ) : (
            <PanneauVide
              icon={<RefreshCw size={26} />}
              title={isEvent ? 'Choisissez une période' : 'Choisissez un tour'}
              text="La progression, les paiements et le gagnant s'afficheront ici."
            />
          )
        )}
      </main>

      {peutDemarrer && !desktop && (
        <div className="fixed inset-x-0 bottom-0 lg:left-64 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setDemarrerOpen(true)}
              disabled={!online}
              className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50"
            >
              {cycles.length ? 'Démarrer le tour suivant' : 'Démarrer le premier tour'}
            </button>
          </div>
        </div>
      )}

      {t && <DemarrerTourSheet isOpen={demarrerOpen} onClose={() => setDemarrerOpen(false)} tontineId={id} frequence={t.frequence} />}
    </div>
  )
}

function LigneTour({ tontineId, cycle, mot, selected = false, replace = false }: { tontineId: string; cycle: Cycle; mot: string; selected?: boolean; replace?: boolean }) {
  const st = TOUR_STATUT[cycle.statut]
  const gagnants = (cycle.gagnants ?? []).map((g) => g.firstName).join(', ')
  return (
    <li>
      <Link
        to={`/tontine/${tontineId}/tours/${cycle.id}`}
        replace={replace}
        aria-current={selected ? 'true' : undefined}
        className={clsx('flex items-center gap-3 px-4 py-3 min-h-[64px]', selected ? 'bg-primary-50' : 'hover:bg-neutral-50')}
      >
        <span className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">{cycle.numeroCycle}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">{mot} {cycle.numeroCycle}</span>
            <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.cls)}>{st.label}</span>
          </span>
          <span className="block text-sm text-neutral-500 truncate">
            {formatDateCourte(cycle.dateDebut)} → {formatDateCourte(cycle.dateFin)}
            {gagnants ? ` · ` : ''}
            {gagnants && <><Trophy size={12} className="inline -mt-0.5 text-yellow-700" /> {gagnants}</>}
          </span>
        </span>
        {cycle.montantNet != null && cycle.statut === CycleStatut.TERMINE && (
          <span className="text-sm font-bold tabular-nums">{formatF(cycle.montantNet)}</span>
        )}
        <ChevronRight size={18} className="text-neutral-300" />
      </Link>
    </li>
  )
}

/** Feuille « Démarrer un tour » : dates préremplies selon le rythme */
export function DemarrerTourSheet({ isOpen, onClose, tontineId, frequence }: { isOpen: boolean; onClose: () => void; tontineId: string; frequence: string }) {
  const suggestion = datesTourSuggerees(frequence)
  const [debut, setDebut] = useState(suggestion.debut)
  const [fin, setFin] = useState(suggestion.fin)
  const { mutate: ouvrir, isPending } = useOpenCycle()
  const invalide = !debut || !fin || fin < debut

  const valider = () => ouvrir(
    { tontineId, request: { dateDebut: debut, dateFin: fin } },
    {
      onSuccess: () => { toast.success('Tour démarré'); onClose() },
      onError: (err) => {
        toast.error(messageErreur(err, "Le tour n'a pas pu être démarré."))
      },
    },
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Démarrer un tour" size="sm">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Début</span>
          <input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Fin</span>
          <input type="date" value={fin} min={debut} onChange={(e) => setFin(e.target.value)} className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
        </label>
        {fin && debut && fin < debut && <p className="text-sm text-red-700">La fin doit être après le début.</p>}
        <button
          onClick={valider}
          disabled={invalide || isPending}
          className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50"
        >
          {isPending ? 'Démarrage…' : 'Démarrer'}
        </button>
      </div>
    </Modal>
  )
}
