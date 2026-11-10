import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { QuickAction } from '@/components/ui/QuickAction'
import { Section, ListItem, InitialsAvatar } from '@/components/ui/Section'
import { BalanceCard } from '@/components/shared/BalanceCard'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useMyDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'
import { TontineStats } from '@/types/dashboard'
import { formatFCFA } from '@/lib/format'
import { Plus, CreditCard, Users, RefreshCw, AlertTriangle, ChevronRight, UserCheck, CheckCircle2 } from 'lucide-react'

// ─── Données bar chart (mockées — à connecter au vrai endpoint stats) ─────────
const MONTHLY_DATA = [
  { month: 'Jan', montant: 180000 },
  { month: 'Fév', montant: 240000 },
  { month: 'Mar', montant: 195000 },
  { month: 'Avr', montant: 310000 },
  { month: 'Mai', montant: 285000 },
  { month: 'Jun', montant: 420000 },
]

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

const LIST_SIZE = 5

const STATUT_PILL: Record<string, string> = {
  ACTIVE: 'bg-primary-50 text-primary-700',
  BROUILLON: 'bg-neutral-100 text-neutral-600',
  SUSPENDUE: 'bg-amber-50 text-amber-700',
  TERMINEE: 'bg-neutral-100 text-neutral-500',
}

export function AdminDashboard() {
  const { user } = useAuth()
  // Les totaux viennent des agrégats calculés en base : on ne charge que les tontines affichées
  const { data: dashboard, isLoading } = useMyDashboard(0, LIST_SIZE)
  const [createOpen, setCreateOpen] = useState(false)

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const tontines = dashboard?.tontines.content || []
  const totalMembres   = dashboard?.totalMembres ?? 0
  const totalEnAttente = dashboard?.totalCotisationsEnAttente ?? 0
  const totalEnRetard  = dashboard?.totalCotisationsEnRetard ?? 0
  const totalValide    = dashboard?.montantTotalValide ?? 0
  const nbTontines     = dashboard?.nombreTontinesGerees || 0
  const prenom = user?.firstName || 'Admin'

  return (
    <AppLayout>
      {/* Salutation */}
      <div className="mb-4 px-1">
        <p className="text-sm text-neutral-500">Bonjour,</p>
        <h1 className="text-2xl font-bold text-neutral-900">{prenom} 👋</h1>
      </div>

      <div className="md:grid md:grid-cols-5 md:gap-6">
        {/* Colonne principale */}
        <div className="md:col-span-3">
          <BalanceCard
            label="Montant validé"
            amount={totalValide}
            eyebrow={
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {nbTontines} tontine{nbTontines > 1 ? 's' : ''} · {totalMembres} membre{totalMembres > 1 ? 's' : ''}
              </span>
            }
            footer="Toutes tontines confondues"
            action={
              <Link
                to="/admin/cotisations"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-primary-700 font-bold text-[15px] active:scale-[0.98] transition"
              >
                <CheckCircle2 size={18} />
                {totalEnAttente > 0 ? `Valider ${totalEnAttente} paiement${totalEnAttente > 1 ? 's' : ''}` : 'Voir les paiements'}
              </Link>
            }
          />

          {/* Actions rapides */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <QuickAction icon={<Plus size={22} />} label="Créer" onClick={() => setCreateOpen(true)} tone="primary" />
            <QuickAction icon={<CreditCard size={22} />} label="Paiements" to="/admin/cotisations" tone="blue" badge={totalEnAttente} />
            <QuickAction icon={<Users size={22} />} label="Membres" to="/admin/membres" tone="purple" />
            <QuickAction icon={<RefreshCw size={22} />} label="Cycles" to="/admin/cycles" tone="amber" />
          </div>

          {/* À traiter */}
          {totalEnRetard > 0 && (
            <Link
              to="/admin/cotisations"
              className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 mb-5 active:scale-[0.99] transition"
            >
              <span className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-red-800">
                  {totalEnRetard} cotisation{totalEnRetard > 1 ? 's' : ''} en retard
                </span>
                <span className="block text-xs text-red-700/80">Pensez à relancer les membres concernés</span>
              </span>
              <ChevronRight size={18} className="text-red-300" />
            </Link>
          )}

          {/* Mes tontines */}
          <Section title="Mes tontines" to="/admin/tontines">
            {tontines.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-neutral-500 mb-3">Aucune tontine gérée</p>
                <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                  <Plus size={16} /> Créer ma première tontine
                </button>
              </div>
            ) : (
              tontines.map((t: TontineStats) => {
                const isEvent = t.tontineType === 'EVENEMENTIELLE'
                const jours = t.dateEcheance
                  ? Math.ceil((new Date(t.dateEcheance).getTime() - Date.now()) / 86400000)
                  : null
                const subtitle = isEvent
                  ? `${t.nombreMembresCotise != null ? `${t.nombreMembresCotise} cotisants` : `${t.nombreMembres} membres`}${jours != null ? ` · ${jours > 0 ? `J-${jours}` : jours === 0 ? "Aujourd'hui" : `J+${Math.abs(jours)}`}` : ''}`
                  // `montant` vaut null pour une événementielle à montant libre
                  : [
                      t.montant != null ? formatFCFA(t.montant) : null,
                      `${t.nombreMembres} membre${t.nombreMembres > 1 ? 's' : ''}`,
                      t.cycleEnCours ? `Cycle ${t.cycleEnCours.numeroCycle}` : null,
                    ].filter(Boolean).join(' · ')
                return (
                  <ListItem
                    key={t.id}
                    to={`/admin/tontines/${t.id}`}
                    leading={<InitialsAvatar name={t.nom} />}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="truncate">{t.nom}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_PILL[t.statut] || STATUT_PILL.TERMINEE}`}>
                          {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                        </span>
                      </span>
                    }
                    subtitle={subtitle}
                    trailing={
                      t.cotisationsEnAttente > 0 ? (
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 rounded-full px-2 py-1">
                          {t.cotisationsEnAttente} à valider
                        </span>
                      ) : (
                        <ChevronRight size={18} className="text-neutral-300" />
                      )
                    }
                  />
                )
              })
            )}
          </Section>
        </div>

        {/* Colonne secondaire (desktop) */}
        <div className="md:col-span-2">
          <Section title="Mon espace membre" card>
            <ListItem
              to="/member/dashboard"
              leading={<span className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center"><UserCheck size={18} /></span>}
              title="Mes participations"
              subtitle="Vos tontines en tant que membre"
              trailing={<ChevronRight size={18} className="text-neutral-300" />}
            />
          </Section>

          {/* Graphique (desktop uniquement — données illustratives) */}
          <Section title="Volume collecté" className="hidden md:block">
            <div className="p-4">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={22}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', radius: 6 }} />
                    <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                      {MONTHLY_DATA.map((_, i) => (
                        <Cell key={i} fill={i === MONTHLY_DATA.length - 1 ? '#16a34a' : '#bbf7d0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 text-right">* Données illustratives (6 derniers mois)</p>
            </div>
          </Section>
        </div>
      </div>

      <CreateTontineModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  )
}
