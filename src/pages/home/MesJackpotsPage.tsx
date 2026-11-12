/**
 * G1 — Mes jackpots (gabarit « Gains » de Wave) : total reçu, prochain tour, à venir, reçus.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Info, Trophy, CalendarClock, RotateCw } from 'lucide-react'
import { useMesJackpots } from '@/hooks/useMe'
import { InitialsAvatar } from '@/components/ui/Section'
import { formatF, formatDateCourte } from '@/lib/format'
import type { JackpotAVenir } from '@/types/me'

function quandAVenir(j: JackpotAVenir): string {
  if (j.modeAttribution === 'TIRAGE') return 'Tirage au sort'
  if (j.modeAttribution === 'CHOIX') return 'Choisi par le gestionnaire'
  if (j.dateEstimee) return `Vers le ${formatDateCourte(j.dateEstimee)}`
  if (j.numeroCycleEstime) return `Tour ${j.numeroCycleEstime}`
  return 'Date à venir'
}

export function MesJackpotsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMesJackpots()
  const prochain = data?.aVenir[0]

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
            <p className="mt-1 text-[44px] leading-none font-extrabold tabular-nums text-neutral-900">{formatF(data?.totalRecu)}</p>
          )}
        </div>
      </header>

      <main className="px-4 -mt-8 space-y-4 max-w-2xl mx-auto">
        {isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger vos jackpots.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2">
              <RotateCw size={16} /> Réessayer
            </button>
          </section>
        ) : (
          <>
            {prochain && (
              <div role="status" className="rounded-3xl bg-amber-100 p-4 flex gap-3">
                <Info size={22} className="text-amber-800 flex-shrink-0 mt-0.5" />
                <p className="text-amber-900">
                  <b>Votre prochain tour : {quandAVenir(prochain).toLowerCase()}</b>
                  <br />
                  {prochain.tontineNom}{prochain.montantEstime ? ` · environ ${formatF(prochain.montantEstime)}` : ''}
                </p>
              </div>
            )}

            <section className="bg-white rounded-3xl shadow-sm">
              <h2 className="px-4 pt-4 pb-1 text-[17px] font-semibold text-neutral-900">À venir</h2>
              {isLoading ? (
                <div className="px-4 py-6"><span className="block h-12 rounded-2xl bg-neutral-100 animate-pulse" /></div>
              ) : !data?.aVenir.length ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Aucun tour à venir pour l'instant.</p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {data.aVenir.map((j) => (
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
              )}
            </section>

            <section className="bg-white rounded-3xl shadow-sm">
              <h2 className="px-4 pt-4 pb-1 text-[17px] font-semibold text-neutral-900">Reçus</h2>
              {isLoading ? (
                <div className="px-4 py-6"><span className="block h-12 rounded-2xl bg-neutral-100 animate-pulse" /></div>
              ) : !data?.recus.length ? (
                <p className="px-4 py-6 text-sm text-neutral-500">Pas encore de jackpot.</p>
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
