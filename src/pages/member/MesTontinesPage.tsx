import { useNavigate, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Users, Calendar, Trophy, ArrowRight, PartyPopper } from 'lucide-react'

const STATUT_STYLES: Record<TontineStatut, string> = {
  ACTIVE: 'bg-primary-100 text-primary-700',
  BROUILLON: 'bg-neutral-100 text-neutral-600',
  SUSPENDUE: 'bg-orange-100 text-orange-700',
  TERMINEE: 'bg-neutral-100 text-neutral-500',
}

export function MesTontinesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: tontinesData, isLoading } = useTontines(0, 50)
  const tontines = tontinesData?.content || []

  const locationState = location.state as { welcomeActivated?: boolean } | null
  const isActivated = locationState?.welcomeActivated

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      {/* Bandeau bienvenue pour les PRE_ENROLLED nouvellement activés */}
      {isActivated && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-primary-50 border border-primary-200 rounded-2xl">
          <PartyPopper size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary-800">Votre compte est activé !</p>
            <p className="text-sm text-primary-700 mt-0.5">Vous êtes déjà membre d'une tontine. Consultez vos tontines ci-dessous.</p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mes tontines</h1>
        <p className="text-sm text-neutral-500 mt-1">Les tontines auxquelles vous participez.</p>
      </div>

      {tontines.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-lg mb-2">Aucune tontine</p>
          <p className="text-sm">Vous ne participez à aucune tontine pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tontines.map((t: Tontine) => {
            const pct = t.nombreMembres > 0
              ? Math.round((t.nombreMembresActuels / t.nombreMembres) * 100)
              : 0
            const jackpot = t.montant * t.nombreMembres
            const statusLabel = {
              ACTIVE: 'Active',
              BROUILLON: 'Brouillon',
              SUSPENDUE: 'Suspendue',
              TERMINEE: 'Terminee',
            }[t.statut]

            return (
              <div
                key={t.id}
                onClick={() => navigate(`/member/tontines/${t.id}`)}
                className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-neutral-900">{t.nom}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUT_STYLES[t.statut]}`}>
                      {statusLabel}
                    </span>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mb-4">par {t.creePar.firstName} {t.creePar.lastName}</p>

                {/* Valeurs */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Cotisation</p>
                    <p className="font-bold text-neutral-900 text-sm">{t.montant.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-neutral-400">FCFA</p>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
                      <Trophy size={10} /> Mon tour
                    </p>
                    <p className="font-bold text-neutral-900 text-sm">#—</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-primary-500 uppercase tracking-wide mb-1">Jackpot</p>
                    <p className="font-bold text-primary-600 text-sm">{(jackpot / 1000).toFixed(0)} 000</p>
                    <p className="text-xs text-primary-400">FCFA</p>
                  </div>
                </div>

                {/* Membres */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span className="flex items-center gap-1"><Users size={11} /> {t.nombreMembresActuels}/{t.nombreMembres} membres</span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar size={11} />
                  <span>Démarrée le {new Date(t.dateDebut).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
