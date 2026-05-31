import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { useTontines } from '@/hooks/useTontines'
import { useCotisations } from '@/hooks/useCotisations'
import { Tontine } from '@/types/tontine'
import { TontineStatut, CotisationStatut } from '@/types/common'
import { Cotisation } from '@/types/cotisation'
import { BookCopy, Clock, Trophy, ArrowRight, Calendar } from 'lucide-react'

function StatCard({ label, value, sub, icon, subGreen }: {
  label: string
  value: React.ReactNode
  sub?: string
  icon: React.ReactNode
  subGreen?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm text-neutral-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-neutral-900">{value}</p>
        {sub && <p className={`text-xs mt-1 ${subGreen ? 'text-primary-600' : 'text-neutral-400'}`}>{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

export function MemberDashboard() {
  const { user } = useAuth()
  const { data: tontinesData, isLoading } = useTontines(0, 20)
  const tontines = tontinesData?.content || []

  const activeTontine = tontines.find((t: Tontine) => t.statut === TontineStatut.ACTIVE)
  const { data: cotisationsData } = useCotisations(activeTontine?.id || '', undefined, 0, 50)
  const cotisations = cotisationsData?.content || []

  const actives = tontines.filter((t: Tontine) => t.statut === TontineStatut.ACTIVE).length
  const enRetard = cotisations.filter((c: Cotisation) => c.statut === CotisationStatut.EN_RETARD).length
  const totalValide = cotisations
    .filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE)
    .reduce((s: number, c: Cotisation) => s + c.montant, 0)

  const prenom = user?.firstName || 'Membre'

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bienvenue {prenom} 👋</h1>
        <p className="text-sm text-neutral-500 mt-1">Votre situation en un coup d'œil.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Mes tontines actives"
          value={<span className="text-primary-600">{actives}</span>}
          icon={<BookCopy size={20} />}
        />
        <StatCard
          label="Cotisations en retard"
          value={enRetard}
          sub={enRetard > 0 ? 'à régulariser' : undefined}
          icon={<Clock size={20} />}
        />
        <StatCard
          label="Total cotisé ce mois"
          value={`${totalValide.toLocaleString('fr-FR')} FCFA`}
          sub="+5% vs mois dernier"
          subGreen
          icon={<Trophy size={20} />}
        />
      </div>

      {/* Mes tontines */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900">Mes tontines</h3>
          <Link to="/member/tontines" className="text-sm font-medium text-primary-600 flex items-center gap-1 hover:underline">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>
        {tontines.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">Vous ne participez à aucune tontine</p>
        ) : (
          <div className="space-y-3">
            {tontines.slice(0, 4).map((t: Tontine) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0">
                <div>
                  <p className="font-semibold text-neutral-900">{t.nom}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                    <Calendar size={11} />
                    <span>{t.montant.toLocaleString('fr-FR')} FCFA / {t.frequence.toLowerCase()}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary-600">
                  {(t.montant * t.nombreMembres).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
