import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalDashboard } from '@/hooks/useDashboard'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import {
  Users, BookCopy, TrendingUp, AlertTriangle,
  UserPlus, Activity, PauseCircle,
} from 'lucide-react'

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'default',
  SUSPENDUE: 'warning',
  TERMINEE: 'default',
}

function StatCard({
  label, value, sub, icon, subGreen,
}: {
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
        {sub && (
          <p className={`text-xs mt-1 ${subGreen ? 'text-primary-600' : 'text-neutral-500'}`}>
            {sub}
          </p>
        )}
      </div>
      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
        {icon}
      </div>
    </div>
  )
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-neutral-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function SuperAdminDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useGlobalDashboard()
  const { data: tontinesData, isLoading: tontinesLoading } = useTontines(0, 5)

  if (dashLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = tontinesData?.content || []
  const t = dashboard?.tontines
  const u = dashboard?.utilisateurs
  const f = dashboard?.finances
  const a = dashboard?.activiteRecente

  const totalTontines = (t?.actives ?? 0) + (t?.brouillon ?? 0) + (t?.suspendues ?? 0) + (t?.terminees ?? 0)
  const pct = (n: number) => totalTontines > 0 ? Math.round((n / totalTontines) * 100) : 0

  const repartition = [
    { label: 'Actives', value: t?.actives ?? 0, color: 'bg-primary-500' },
    { label: 'Brouillon', value: t?.brouillon ?? 0, color: 'bg-neutral-300' },
    { label: 'Suspendues', value: t?.suspendues ?? 0, color: 'bg-orange-400' },
    { label: 'Terminées', value: t?.terminees ?? 0, color: 'bg-neutral-400' },
  ]

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Vue d'ensemble</h1>
        <p className="text-sm text-neutral-500 mt-1">Indicateurs clés de la plateforme Dinthialma — temps réel.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Utilisateurs"
          value={u?.total ?? 0}
          sub={u?.nouveauxCeMois ? `+${u.nouveauxCeMois} ce mois · ${u.actifs ?? 0} actifs` : u?.actifs != null ? `${u.actifs} actifs` : undefined}
          subGreen
          icon={<Users size={20} />}
        />
        <StatCard
          label="Tontines actives"
          value={<span className="text-primary-600">{t?.actives ?? 0}</span>}
          sub={totalTontines ? `${totalTontines} au total · ${t?.terminees ?? 0} terminées` : undefined}
          icon={<BookCopy size={20} />}
        />
        <StatCard
          label="Validé ce mois"
          value={`${(f?.montantValideСeMois ?? 0).toLocaleString('fr-FR')} FCFA`}
          sub={f?.variationMoisPrecedent != null ? `+${f.variationMoisPrecedent}% vs mois dernier` : undefined}
          subGreen
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="En retard"
          value={f?.cotisationsEnRetard ?? 0}
          sub={f?.cotisationsEnAttente != null ? `${f.cotisationsEnAttente} en attente` : undefined}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      {/* Répartition + Activité 24h */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Répartition */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-neutral-900">Répartition des tontines</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Par statut, sur les {totalTontines} tontines.</p>
            </div>
          </div>
          <div className="space-y-4">
            {repartition.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-700">{r.label}</span>
                  <span className="text-sm text-neutral-500">{r.value} ({pct(r.value)}%)</span>
                </div>
                <ProgressBar value={pct(r.value)} color={r.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Activité 24h */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
          <h3 className="font-semibold text-neutral-900 mb-1">Activité 24h</h3>
          <p className="text-xs text-neutral-500 mb-5">Évènements récents.</p>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                <UserPlus size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{a?.nouveauxInscrits ?? 0}</p>
                <p className="text-xs text-neutral-500">Nouveaux inscrits</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{a?.cotisationsEnregistrees ?? 0}</p>
                <p className="text-xs text-neutral-500">Cotisations enregistrées</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                <PauseCircle size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-neutral-900">{a?.tontinesSuspendues ?? 0}</p>
                <p className="text-xs text-neutral-500">Tontines suspendues</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dernières tontines */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900">Dernières tontines</h3>
          <p className="text-xs text-neutral-500 mt-0.5">5 plus récentes, tous statuts.</p>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-neutral-50">
          {tontinesLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : tontines.length === 0 ? (
            <p className="text-center py-6 text-neutral-400 text-sm">Aucune tontine</p>
          ) : (
            tontines.map((t: Tontine) => (
              <div key={t.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 truncate">{t.nom}</p>
                    <p className="text-xs text-primary-600 font-medium">{t.creePar.firstName} {t.creePar.lastName}</p>
                  </div>
                  <Badge variant={statutVariants[t.statut]}>
                    {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                  <span>{t.montant.toLocaleString('fr-FR')} FCFA</span>
                  <span>{t.nombreMembresActuels}/{t.nombreMembres} membres</span>
                  <span>{new Date(t.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Nom', 'Créateur', 'Montant', 'Membres', 'Créée le', 'Statut'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tontinesLoading ? (
                <tr><td colSpan={6} className="text-center py-8"><Spinner /></td></tr>
              ) : tontines.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Aucune tontine</td></tr>
              ) : (
                tontines.map((t: Tontine) => (
                  <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-neutral-900">{t.nom}</td>
                    <td className="px-6 py-4 text-primary-600 font-medium">
                      {t.creePar.firstName} {t.creePar.lastName}
                    </td>
                    <td className="px-6 py-4">{t.montant.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-6 py-4">{t.nombreMembresActuels}/{t.nombreMembres}</td>
                    <td className="px-6 py-4 text-neutral-500">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statutVariants[t.statut]}>
                        {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
