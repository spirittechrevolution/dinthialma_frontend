import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { QuickAction } from '@/components/ui/QuickAction'
import { Section, ListItem, InitialsAvatar } from '@/components/ui/Section'
import { BalanceCard } from '@/components/shared/BalanceCard'
import { useGlobalDashboard } from '@/hooks/useDashboard'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { formatFCFA, formatDateCourte } from '@/lib/format'
import {
  Users, Wallet, CreditCard, List, UserPlus, Activity, PauseCircle, AlertTriangle, ChevronRight, Clock,
} from 'lucide-react'

const STATUT_PILL: Record<TontineStatut, string> = {
  ACTIVE: 'bg-primary-50 text-primary-700',
  BROUILLON: 'bg-neutral-100 text-neutral-600',
  SUSPENDUE: 'bg-amber-50 text-amber-700',
  TERMINEE: 'bg-neutral-100 text-neutral-500',
}

function MiniStat({ label, value, icon, tone }: { label: string; value: React.ReactNode; icon: React.ReactNode; tone: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-3">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xl font-bold text-neutral-900 tabular leading-tight">{value}</p>
        <p className="text-xs text-neutral-500 truncate">{label}</p>
      </div>
    </div>
  )
}

export function SuperAdminDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useGlobalDashboard()
  const { data: tontinesData, isLoading: tontinesLoading } = useTontines(0, 5)

  if (dashLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = tontinesData?.content || []
  const t = dashboard?.tontines
  const u = dashboard?.users
  const f = dashboard?.finances
  const a = dashboard?.activite24h

  const totalTontines = t?.total ?? ((t?.actives ?? 0) + (t?.brouillon ?? 0) + (t?.suspendues ?? 0) + (t?.terminees ?? 0))
  const pct = (n: number) => (totalTontines > 0 ? Math.round((n / totalTontines) * 100) : 0)
  const enAttente = f?.cotisationsEnAttente ?? 0
  const enRetard = f?.cotisationsEnRetard ?? 0

  const repartition = [
    { label: 'Actives', value: t?.actives ?? 0, color: 'bg-primary-500' },
    { label: 'Brouillons', value: t?.brouillon ?? 0, color: 'bg-neutral-300' },
    { label: 'Suspendues', value: t?.suspendues ?? 0, color: 'bg-amber-400' },
    { label: 'Terminées', value: t?.terminees ?? 0, color: 'bg-neutral-400' },
  ]

  return (
    <AppLayout>
      <div className="mb-4 px-1">
        <p className="text-sm text-neutral-500">Vue d'ensemble</p>
        <h1 className="text-2xl font-bold text-neutral-900">Plateforme Dinthialma</h1>
      </div>

      <div className="md:grid md:grid-cols-5 md:gap-6">
        {/* Colonne principale */}
        <div className="md:col-span-3">
          <BalanceCard
            label="Cotisations validées ce mois"
            amount={f?.montantCotisationsCeMois ?? 0}
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {u?.total ?? 0} utilisateurs · {t?.actives ?? 0} tontines actives
              </span>
            }
            footer="Depuis le 1er du mois, toutes tontines confondues"
            action={
              <Link
                to="/superadmin/cotisations"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-primary-700 font-bold text-[15px] active:scale-[0.98] transition"
              >
                <CreditCard size={18} />
                {enAttente > 0 ? `${enAttente} cotisation${enAttente > 1 ? 's' : ''} en attente` : 'Voir les cotisations'}
              </Link>
            }
          />

          {/* Actions rapides (Réglages remplace l'entrée retirée de la barre du bas mobile) */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <QuickAction icon={<Wallet size={22} />} label="Tontines" to="/superadmin/tontines" tone="primary" />
            <QuickAction icon={<CreditCard size={22} />} label="Paiements" to="/superadmin/cotisations" tone="blue" badge={enAttente} />
            <QuickAction icon={<Users size={22} />} label="Utilisateurs" to="/superadmin/users" tone="purple" />
            <QuickAction icon={<List size={22} />} label="Réglages" to="/superadmin/code-list" tone="neutral" />
          </div>

          {/* Alerte retard */}
          {enRetard > 0 && (
            <Link
              to="/superadmin/cotisations"
              className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 mb-5 active:scale-[0.99] transition"
            >
              <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-red-800">
                  {enRetard} cotisation{enRetard > 1 ? 's' : ''} en retard
                </span>
                <span className="block text-xs text-red-700/80">Sur l'ensemble de la plateforme</span>
              </span>
              <ChevronRight size={18} className="text-red-300" />
            </Link>
          )}

          {/* Dernières tontines */}
          <Section title="Dernières tontines" to="/superadmin/tontines">
            {tontinesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : tontines.length === 0 ? (
              <p className="text-center py-8 text-sm text-neutral-500">Aucune tontine</p>
            ) : (
              tontines.map((tt: Tontine) => (
                <ListItem
                  key={tt.id}
                  to={`/tontine/${tt.id}`}
                  leading={<InitialsAvatar name={tt.nom} />}
                  title={
                    <span className="flex items-center gap-2">
                      <span className="truncate">{tt.nom}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_PILL[tt.statut]}`}>
                        {tt.statut.charAt(0) + tt.statut.slice(1).toLowerCase()}
                      </span>
                    </span>
                  }
                  subtitle={`${tt.creePar.firstName} ${tt.creePar.lastName} · ${formatFCFA(tt.montant)} · ${formatDateCourte(tt.createdAt)}`}
                  trailing={<ChevronRight size={18} className="text-neutral-300" />}
                />
              ))
            )}
          </Section>
        </div>

        {/* Colonne secondaire */}
        <div className="md:col-span-2">
          <Section title="Activité récente" card={false}>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
              <MiniStat label="Inscrits (24 h)" value={a?.nouveauxInscrits ?? 0} icon={<UserPlus size={18} />} tone="bg-primary-50 text-primary-700" />
              <MiniStat label="Cotisations (24 h)" value={a?.cotisationsEnregistrees ?? 0} icon={<Activity size={18} />} tone="bg-sky-50 text-sky-700" />
              <MiniStat label="Tontines suspendues" value={t?.suspendues ?? 0} icon={<PauseCircle size={18} />} tone="bg-amber-50 text-amber-700" />
              <MiniStat label="Inscrits ce mois" value={u?.nouveauxCeMois ?? 0} icon={<Clock size={18} />} tone="bg-violet-50 text-violet-700" />
            </div>
          </Section>

          <Section title="Répartition des tontines">
            <div className="p-4 space-y-3.5">
              {repartition.map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-700">{r.label}</span>
                    <span className="text-sm text-neutral-500 tabular">{r.value} · {pct(r.value)}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${r.color}`} style={{ width: `${pct(r.value)}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-xs text-neutral-400 pt-1">{totalTontines} tontines au total</p>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  )
}
