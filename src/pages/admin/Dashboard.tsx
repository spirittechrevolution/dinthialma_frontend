import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useMyDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { TontineStats } from '@/types/dashboard'
import { TontineStatut } from '@/types/common'
import { BookCopy, Users, Clock, AlertTriangle, ArrowRight, Bell, TrendingUp, ChevronRight, UserCheck, CalendarHeart, RotateCcw } from 'lucide-react'

const statutVariants: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success', BROUILLON: 'default', SUSPENDUE: 'warning', TERMINEE: 'default',
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent = false, to }: {
  label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; accent?: boolean; to?: string
}) {
  const baseClass = `rounded-2xl border p-4 flex items-start justify-between shadow-sm ${
    accent ? 'bg-primary-600 border-primary-500' : 'bg-white border-neutral-100'
  } ${to ? 'hover:shadow-md hover:-translate-y-px transition-all' : ''}`

  const inner = (
    <>
      <div>
        <p className={`text-xs mb-1.5 ${accent ? 'text-primary-200' : 'text-neutral-500'}`}>{label}</p>
        <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-neutral-900'}`}>{value}</p>
        {sub && <p className={`text-xs mt-1 ${accent ? 'text-primary-200' : 'text-neutral-400'}`}>{sub}</p>}
      </div>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-600'}`}>
        {icon}
      </div>
    </>
  )

  if (to) return <Link to={to} className={baseClass}>{inner}</Link>
  return <div className={baseClass}>{inner}</div>
}

// ─── Données bar chart (mockées — à connecter au vrai endpoint stats) ─────────
const MONTHLY_DATA = [
  { month: 'Jan', montant: 180000 },
  { month: 'Fév', montant: 240000 },
  { month: 'Mar', montant: 195000 },
  { month: 'Avr', montant: 310000 },
  { month: 'Mai', montant: 285000 },
  { month: 'Jun', montant: 420000 },
]

// ─── Tooltip custom ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-neutral-100 px-3 py-2 text-xs">
        <p className="text-neutral-500 mb-0.5">{label}</p>
        <p className="font-bold text-primary-600">{payload[0].value.toLocaleString('fr-FR')} FCFA</p>
      </div>
    )
  }
  return null
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { data: dashboard, isLoading } = useMyDashboard()

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = dashboard?.tontines || []
  const totalMembres  = tontines.reduce((s: number, t: TontineStats) => s + (t.nombreMembres || 0), 0)
  const totalEnAttente = tontines.reduce((s: number, t: TontineStats) => s + t.cotisationsEnAttente, 0)
  const totalEnRetard  = tontines.reduce((s: number, t: TontineStats) => s + t.cotisationsEnRetard, 0)
  const totalValide    = tontines.reduce((s: number, t: TontineStats) => s + t.montantTotalValide, 0)
  const prenom = user?.firstName || 'Admin'
  const nom    = user?.lastName  || ''

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Bonjour {prenom} {nom} 👋</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Aperçu de vos tontines.</p>
        </div>
        <Link to="/notifications"
          className="relative w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors">
          <Bell size={18} />
          {totalEnAttente > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {totalEnAttente > 9 ? '9+' : totalEnAttente}
            </span>
          )}
        </Link>
      </div>

      {/* KPIs — grille 2×2 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <KpiCard
          label="Tontines gérées"
          value={<span className="text-primary-600">{dashboard?.nombreTontinesGerees || 0}</span>}
          icon={<BookCopy size={18} />}
        />
        <KpiCard
          label="Membres total"
          value={totalMembres}
          icon={<Users size={18} />}
        />
        <KpiCard
          label="À valider"
          value={totalEnAttente}
          sub="cotisations"
          icon={<Clock size={18} />}
          to="/admin/cotisations"
        />
        <KpiCard
          label="En retard"
          value={totalEnRetard}
          sub="à relancer"
          icon={<AlertTriangle size={18} />}
          to="/admin/cotisations"
        />
      </div>

      {/* Montant validé — card accent */}
      <div className="mb-4">
        <KpiCard
          accent
          label="Montant validé ce mois"
          value={`${totalValide.toLocaleString('fr-FR')} FCFA`}
          sub="Toutes tontines"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Bar chart volume mensuel */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Volume collecté</p>
            <p className="text-xs text-neutral-400">6 derniers mois</p>
          </div>
          <TrendingUp size={16} className="text-primary-500" />
        </div>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={24}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 6 }} />
              <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                {MONTHLY_DATA.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === MONTHLY_DATA.length - 1 ? '#16a34a' : '#bbf7d0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-1.5 mt-2 px-1 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <span className="text-amber-500 text-xs">⚠</span>
          <p className="text-xs text-amber-700 font-medium">Données illustratives — le vrai graphique sera connecté prochainement</p>
        </div>
      </div>

      {/* Mes participations (vue membre) */}
      <Link
        to="/member/dashboard"
        className="flex items-center gap-4 bg-white border border-neutral-100 shadow-sm rounded-2xl p-4 mb-4 hover:border-primary-200 hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <UserCheck size={20} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-900">Mes participations</p>
          <p className="text-xs text-neutral-400 mt-0.5">Voir votre vue en tant que membre</p>
        </div>
        <ChevronRight size={16} className="text-neutral-300 flex-shrink-0" />
      </Link>

      {/* Liste tontines */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900">Mes tontines</h3>
          <Link to="/admin/tontines" className="text-xs font-medium text-primary-600 flex items-center gap-0.5 hover:underline">
            Voir tout <ArrowRight size={12} />
          </Link>
        </div>
        <div className="space-y-1">
          {tontines.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-4">Aucune tontine gérée</p>
          ) : (
            tontines.slice(0, 4).map((t: TontineStats) => {
              const isEvent = t.tontineType === 'EVENEMENTIELLE'
              const jours = t.dateEcheance
                ? Math.ceil((new Date(t.dateEcheance).getTime() - Date.now()) / 86400000)
                : null
              return (
                <Link key={t.id} to={`/admin/tontines/${t.id}`}
                  className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 rounded-xl px-1 -mx-1 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-neutral-900 text-sm truncate">{t.nom}</p>
                      <Badge variant={statutVariants[t.statut as TontineStatut]} className="text-[10px] px-1.5 py-0.5">
                        {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                      </Badge>
                      {isEvent ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-purple-600">
                          <CalendarHeart size={9} /> Évén.
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-500">
                          <RotateCcw size={9} /> Rot.
                        </span>
                      )}
                    </div>
                    {isEvent ? (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t.nombreMembresCotise != null ? `${t.nombreMembresCotise} cotisants` : `${t.nombreMembres} membres`}
                        {jours != null && (
                          <span className={`ml-2 font-semibold ${jours > 0 ? 'text-purple-500' : 'text-red-500'}`}>
                            {jours > 0 ? `J-${jours}` : jours === 0 ? "Aujourd'hui" : `J+${Math.abs(jours)}`}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t.montant?.toLocaleString('fr-FR')} FCFA · {t.nombreMembres} membres
                        {t.cycleEnCours && (
                          <span className="ml-2">· Cycle {t.cycleEnCours.numeroCycle}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-neutral-300 flex-shrink-0 ml-2" />
                </Link>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}
