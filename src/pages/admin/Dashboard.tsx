import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useMyDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { TontineStats } from '@/types/dashboard'
import { TontineStatut } from '@/types/common'
import { BookCopy, Users, Clock, AlertTriangle, ArrowRight } from 'lucide-react'

const statutVariants: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'default',
  SUSPENDUE: 'warning',
  TERMINEE: 'default',
}

const FREQ_LABELS: Record<string, string> = {
  JOURNALIERE: 'journalière',
  HEBDOMADAIRE: 'hebdomadaire',
  BIMENSUEL: 'bimensuelle',
  MENSUEL: 'mensuelle',
  TRIMESTRIEL: 'trimestrielle',
}

function StatCard({ label, value, sub, icon }: {
  label: string
  value: React.ReactNode
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm text-neutral-500 mb-2">{label}</p>
        <p className="text-3xl font-bold text-neutral-900">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-neutral-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-neutral-500 w-6 text-right">{value}</span>
    </div>
  )
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { data: dashboard, isLoading } = useMyDashboard()

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = dashboard?.tontines || []
  const totalMembres = tontines.reduce((s: number, t: TontineStats) => s + (t.nombreMembres || 0), 0)
  const totalEnAttente = tontines.reduce((s: number, t: TontineStats) => s + t.cotisationsEnAttente, 0)
  const totalEnRetard = tontines.reduce((s: number, t: TontineStats) => s + t.cotisationsEnRetard, 0)
  const totalValide = tontines.reduce((s: number, t: TontineStats) => s + t.montantTotalValide, 0)

  const validees = tontines.reduce(
    (s: number, t: TontineStats) => s + Math.round(t.montantTotalValide / (t.montant || 1)),
    0
  )
  const refusees = 0
  const cycleTotal = validees + totalEnAttente + totalEnRetard + refusees

  const prenom = user?.firstName || 'Admin'
  const nom = user?.lastName || 'Admin'

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bonjour {prenom} {nom}</h1>
        <p className="text-sm text-neutral-500 mt-1">Aperçu de vos tontines et activité récente.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Tontines gérées"
          value={<span className="text-primary-600">{dashboard?.nombreTontinesGerees || 0}</span>}
          icon={<BookCopy size={20} />}
        />
        <StatCard
          label="Membres au total"
          value={totalMembres}
          icon={<Users size={20} />}
        />
        <StatCard
          label="Cotisations en attente"
          value={totalEnAttente}
          sub="à valider"
          icon={<Clock size={20} />}
        />
        <StatCard
          label="En retard"
          value={totalEnRetard}
          sub="à relancer"
          icon={<AlertTriangle size={20} />}
        />
      </div>

      {/* Mes tontines + Cotisations ce cycle */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Mes tontines */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-neutral-900">Mes tontines</h3>
              <p className="text-xs text-neutral-500">Cliquez pour gérer.</p>
            </div>
            <Link to="/admin/tontines" className="text-sm font-medium text-primary-600 flex items-center gap-1 hover:underline">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {tontines.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-6">Aucune tontine gérée</p>
            ) : (
              tontines.slice(0, 5).map((t: TontineStats) => {
                const pct = t.nombreMembres > 0
                  ? Math.round(((t.nombreMembres) / t.nombreMembres) * 100)
                  : 0
                return (
                  <Link key={t.id} to={`/admin/tontines/${t.id}`} className="block p-4 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-neutral-900">{t.nom}</p>
                      <Badge variant={statutVariants[t.statut as TontineStatut]}>
                        {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">
                      {t.montant?.toLocaleString('fr-FR')} FCFA / {FREQ_LABELS[t.frequence || ''] || t.frequence}
                      {' · '}
                      {t.nombreMembres} membres
                      {t.dateDebut && ` · Depuis ${new Date(t.dateDebut).toLocaleDateString('fr-FR')}`}
                    </p>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Cotisations ce cycle */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <h3 className="font-semibold text-neutral-900 mb-1">Cotisations ce cycle</h3>
          <div className="space-y-4 mt-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-700">Validées</span>
                <span className="font-medium">{validees}</span>
              </div>
              <ProgressBar value={validees} max={cycleTotal || 1} color="bg-primary-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-700">En attente</span>
                <span className="font-medium">{totalEnAttente}</span>
              </div>
              <ProgressBar value={totalEnAttente} max={cycleTotal || 1} color="bg-orange-400" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-700">En retard</span>
                <span className="font-medium">{totalEnRetard}</span>
              </div>
              <ProgressBar value={totalEnRetard} max={cycleTotal || 1} color="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-700">Refusées</span>
                <span className="font-medium">{refusees}</span>
              </div>
              <ProgressBar value={refusees} max={cycleTotal || 1} color="bg-neutral-300" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500 mb-1">Montant validé ce mois</p>
            <p className="text-2xl font-bold text-primary-600">
              {totalValide.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
