import { useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Users, Calendar, Trophy, ChevronRight, PartyPopper, Plus } from 'lucide-react'

// ─── Avatar tontine (initiales colorées) ─────────────────────────────────────
function TontineAvatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors = ['from-primary-600 to-primary-500', 'from-blue-600 to-blue-500', 'from-purple-600 to-purple-500', 'from-teal-600 to-teal-500', 'from-orange-600 to-orange-500']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
      {initials}
    </div>
  )
}

const STATUT_CONFIG: Record<TontineStatut, { label: string; pill: string }> = {
  ACTIVE:    { label: 'Active',    pill: 'bg-primary-100 text-primary-700' },
  BROUILLON: { label: 'Brouillon', pill: 'bg-neutral-100 text-neutral-600' },
  SUSPENDUE: { label: 'Suspendue', pill: 'bg-orange-100 text-orange-700'   },
  TERMINEE:  { label: 'Terminée', pill: 'bg-neutral-100 text-neutral-500'  },
}

export function MesTontinesPage() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { data: tontinesData, isLoading } = useTontines(0, 50)
  const tontines   = tontinesData?.content || []

  const locationState = location.state as { welcomeActivated?: boolean } | null
  const isActivated   = locationState?.welcomeActivated

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const actives = tontines.filter((t: Tontine) => t.statut === TontineStatut.ACTIVE)

  return (
    <AppLayout>
      {/* Bandeau PRE_ENROLLED */}
      {isActivated && (
        <div className="flex items-start gap-3 p-4 mb-5 bg-primary-50 border border-primary-200 rounded-2xl">
          <PartyPopper size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary-800">Votre compte est activé !</p>
            <p className="text-sm text-primary-700 mt-0.5">Vous êtes déjà membre d'une tontine.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Mes tontines</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{actives.length} active{actives.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {tontines.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
            <Plus size={24} className="text-neutral-300" />
          </div>
          <div className="text-center">
            <p className="font-medium text-neutral-500 mb-1">Aucune tontine</p>
            <p className="text-sm">Vous ne participez à aucune tontine pour le moment.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tontines.map((t: Tontine) => {
            const pct = t.nombreMembres > 0 ? Math.round((t.nombreMembresActuels / t.nombreMembres) * 100) : 0
            const jackpot = t.montant * t.nombreMembres
            const cfg = STATUT_CONFIG[t.statut]

            return (
              <div
                key={t.id}
                onClick={() => navigate(`/member/tontines/${t.id}`)}
                className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-all hover:shadow-md hover:border-primary-200"
              >
                {/* Header card */}
                <div className="flex items-start gap-3 mb-3">
                  <TontineAvatar name={t.nom} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-neutral-900 truncate pr-2">{t.nom}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.pill}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">par {t.creePar.firstName} {t.creePar.lastName}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-300 flex-shrink-0 mt-1" />
                </div>

                {/* Valeurs 3 colonnes */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-neutral-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-neutral-400 mb-1">Cotisation</p>
                    <p className="font-bold text-neutral-900 text-xs">{t.montant.toLocaleString('fr-FR')}</p>
                    <p className="text-[10px] text-neutral-400">FCFA</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-neutral-400 mb-1 flex items-center justify-center gap-0.5">
                      <Users size={9} /> Membres
                    </p>
                    <p className="font-bold text-neutral-900 text-xs">{t.nombreMembresActuels}</p>
                    <p className="text-[10px] text-neutral-400">/ {t.nombreMembres}</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-primary-500 mb-1 flex items-center justify-center gap-0.5">
                      <Trophy size={9} /> Jackpot
                    </p>
                    <p className="font-bold text-primary-600 text-xs">{jackpot.toLocaleString('fr-FR')}</p>
                    <p className="text-[10px] text-primary-400">FCFA</p>
                  </div>
                </div>

                {/* Barre progression + infos */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={9} />
                      <span>Démarré le {new Date(t.dateDebut).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${t.statut === TontineStatut.ACTIVE ? 'bg-primary-500' : 'bg-neutral-300'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
