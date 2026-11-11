import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/Section'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { formatFCFA, formatMontant } from '@/lib/format'
import { Trophy, ChevronRight, PartyPopper, Wallet } from 'lucide-react'

const PAGE_SIZE = 10

const STATUT_CONFIG: Record<TontineStatut, { label: string; pill: string }> = {
  ACTIVE:    { label: 'Active',    pill: 'bg-primary-50 text-primary-700' },
  BROUILLON: { label: 'Brouillon', pill: 'bg-neutral-100 text-neutral-600' },
  SUSPENDUE: { label: 'Suspendue', pill: 'bg-amber-50 text-amber-700'     },
  TERMINEE:  { label: 'Terminée',  pill: 'bg-neutral-100 text-neutral-500' },
}

export function MesTontinesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(0)
  const { data: tontinesData, isLoading } = useTontines(page, PAGE_SIZE)
  const tontines = tontinesData?.content || []
  const total = tontinesData?.totalElements ?? tontines.length

  const locationState = location.state as { welcomeActivated?: boolean } | null
  const isActivated = locationState?.welcomeActivated

  return (
    <AppLayout>
      {/* Bandeau PRE_ENROLLED */}
      {isActivated && (
        <div className="flex items-start gap-3 p-4 mb-5 bg-primary-50 border border-primary-100 rounded-2xl">
          <PartyPopper size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary-800">Votre compte est activé !</p>
            <p className="text-sm text-primary-700 mt-0.5">Vous êtes déjà membre d'une tontine.</p>
          </div>
        </div>
      )}

      <PageHeader title="Mes tontines" description={`${total} tontine${total > 1 ? 's' : ''}`} />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : tontines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100">
          <EmptyState
            icon={<Wallet size={26} />}
            title="Aucune tontine"
            description="Vous ne participez à aucune tontine pour le moment."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <ul>
            {tontines.map((t: Tontine) => {
              const pct = t.nombreMembres > 0 ? Math.round((t.nombreMembresActuels / t.nombreMembres) * 100) : 0
              const jackpot = t.montant * t.nombreMembres
              const cfg = STATUT_CONFIG[t.statut]
              return (
                <li key={t.id} className="border-b border-neutral-100 last:border-0">
                  <button
                    onClick={() => navigate(`/tontine/${t.id}`)}
                    className="w-full text-left flex items-center gap-3 px-4 py-4 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
                  >
                    <InitialsAvatar name={t.nom} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-900 truncate">{t.nom}</p>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pill}`}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-neutral-500 mt-0.5 truncate">
                        {formatFCFA(t.montant)} / {t.frequence.toLowerCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-neutral-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${t.statut === TontineStatut.ACTIVE ? 'bg-primary-500' : 'bg-neutral-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 tabular flex-shrink-0">
                          {t.nombreMembresActuels}/{t.nombreMembres}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Trophy size={13} /> {formatMontant(jackpot)}
                      </span>
                      <ChevronRight size={18} className="text-neutral-300" />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          {(tontinesData?.totalPages ?? 1) > 1 && (
            <div className="border-t border-neutral-100">
              <Pagination
                page={page}
                totalPages={tontinesData?.totalPages ?? 1}
                totalElements={tontinesData?.totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </AppLayout>
  )
}
