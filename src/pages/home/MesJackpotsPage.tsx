/**
 * G1 — Mes jackpots (gabarit « Gains » de Wave) : total reçu, prochain jackpot mis en avant,
 * autres jackpots à venir (sans répéter le prochain), jackpots reçus.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, CalendarClock, RotateCw, ChevronRight } from 'lucide-react'
import { useMesJackpots } from '@/hooks/useMe'
import { InitialsAvatar } from '@/components/ui/Section'
import { formatF, formatDateCourte } from '@/lib/format'
import type { JackpotAVenir } from '@/types/me'

/** Quand / comment le jackpot arrive, en clair */
function quandAVenir(j: JackpotAVenir): string {
  if (j.modeAttribution === 'TIRAGE') return 'Gagnant tiré au sort à chaque tour'
  if (j.modeAttribution === 'CHOIX') return 'Le gestionnaire désigne le gagnant'
  const tour = j.numeroCycleEstime ? `Tour ${j.numeroCycleEstime}` : null
  const date = j.dateEstimee ? `vers le ${formatDateCourte(j.dateEstimee)}` : null
  if (tour && date) return `${tour} · ${date}`
  if (tour) return tour
  if (date) return date.charAt(0).toUpperCase() + date.slice(1)
  return 'Date à venir'
}

export function MesJackpotsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMesJackpots()
  const prochain = data?.aVenir[0]
  const autres = data?.aVenir.slice(1) ?? []
  const nbRecus = data?.recus.length ?? 0

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="bg-yellow-50 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-14 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 -ml-2 rounded-full flex items-center justify-center text-neutral-800 hover:bg-black/5"
          aria-label="Retour"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center -mt-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-yellow-800 uppercase">Jackpots reçus</p>
          {isLoading ? (
            <span className="mt-2 inline-block h-11 w-44 rounded-xl bg-yellow-100 animate-pulse" />
          ) : (
            <>
              <p className="mt-1 text-[44px] leading-none font-extrabold tabular-nums text-neutral-900">{formatF(data?.totalRecu)}</p>
              <p className="mt-2 text-sm text-yellow-900/80">
                {nbRecus ? `${nbRecus} jackpot${nbRecus > 1 ? 's' : ''} reçu${nbRecus > 1 ? 's' : ''}` : 'Aucun jackpot reçu pour le moment'}
              </p>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
        {isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger vos jackpots.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
              <RotateCw size={16} /> Réessayer
            </button>
          </section>
        ) : (
          <>
            {isLoading ? (
              <section className="bg-white rounded-3xl shadow-sm p-4" aria-busy="true">
                <span className="block h-24 rounded-2xl bg-neutral-100 animate-pulse" />
              </section>
            ) : prochain ? (
              <button
                onClick={() => navigate(`/tontine/${prochain.tontineId}`)}
                className="w-full bg-white rounded-3xl shadow-sm p-4 text-left flex items-center gap-4 hover:bg-neutral-50"
              >
                <span className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0">
                  <Trophy size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-neutral-500">Prochain jackpot</span>
                  <span className="block mt-0.5 font-bold text-neutral-900 truncate">{prochain.tontineNom}</span>
                  <span className="block text-sm text-neutral-500">
                    {prochain.position ? `Position ${prochain.position} · ` : ''}{quandAVenir(prochain)}
                  </span>
                </span>
                <span className="text-right flex-shrink-0">
                  {prochain.montantEstime ? (
                    <>
                      <span className="block text-[11px] text-neutral-500">environ</span>
                      <span className="block text-lg font-extrabold tabular-nums text-neutral-900">{formatF(prochain.montantEstime)}</span>
                    </>
                  ) : (
                    <ChevronRight size={20} className="text-neutral-400" />
                  )}
                </span>
              </button>
            ) : (
              <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-4">
                <span className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
                  <CalendarClock size={26} />
                </span>
                <p className="text-sm text-neutral-600">Aucun jackpot à venir pour l'instant. Rejoignez ou créez une tontine pour en recevoir.</p>
              </section>
            )}

            {autres.length > 0 && (
            <section className="bg-white rounded-3xl shadow-sm">
              <h2 className="px-4 pt-4 pb-1 text-[17px] font-semibold text-neutral-900">Ensuite</h2>
                <ul className="divide-y divide-neutral-100">
                  {autres.map((j) => (
                    <li key={j.tontineId}>
                      <button onClick={() => navigate(`/tontine/${j.tontineId}`)} className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-neutral-50">
                        <InitialsAvatar name={j.tontineNom} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-neutral-900 truncate">{j.tontineNom}</span>
                          <span className="block text-sm text-neutral-500">
                            {j.position ? `Position ${j.position} · ` : ''}{quandAVenir(j)}
                          </span>
                        </span>
                        <span className="text-right">
                          <CalendarClock size={18} className="inline text-neutral-400" />
                          {j.montantEstime && <span className="block text-sm font-semibold tabular-nums">≈ {formatF(j.montantEstime)}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
            </section>
            )}

            <section className="bg-white rounded-3xl shadow-sm">
              <h2 className="px-4 pt-4 pb-1 text-[17px] font-semibold text-neutral-900">Reçus</h2>
              {isLoading ? (
                <div className="px-4 py-6"><span className="block h-12 rounded-2xl bg-neutral-100 animate-pulse" /></div>
              ) : !data?.recus.length ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Vos jackpots apparaîtront ici dès que vous en recevrez un.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 p-4">
                  {data.recus.map((r) => (
                    <li key={`${r.tontineId}-${r.nature}-${r.cycleId ?? ''}`}>
                      <button
                        onClick={() => navigate(`/tontine/${r.tontineId}`)}
                        className="w-full h-full rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-left"
                      >
                        <Trophy size={20} className="text-yellow-700" />
                        <span className="mt-2 block font-bold text-primary-700 tabular-nums">+{formatF(r.montantRecu)}</span>
                        <span className="block text-sm font-semibold text-neutral-900 truncate">{r.tontineNom}</span>
                        <span className="block text-xs text-neutral-500">
                          {r.nature === 'DISTRIBUTION_FINALE' ? 'Distribution finale' : `Tour ${r.numeroCycle ?? '—'}`}{r.dateRemise ? ` · ${formatDateCourte(r.dateRemise)}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
