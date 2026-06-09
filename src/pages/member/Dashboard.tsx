import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useAuth } from '@/hooks/useAuth'
import { useTontines } from '@/hooks/useTontines'
import { useCotisations } from '@/hooks/useCotisations'
import { useCycles } from '@/hooks/useCycles'
import { Tontine } from '@/types/tontine'
import { TontineStatut, CotisationStatut, CycleStatut } from '@/types/common'
import { Cotisation } from '@/types/cotisation'
import { Cycle } from '@/types/cycle'
import { Bell, ChevronRight, Calendar, Plus, Trophy, Users } from 'lucide-react'

// ─── Donut cycle ──────────────────────────────────────────────────────────────
function CycleDonut({ pct }: { pct: number }) {
  const data = [{ value: pct }, { value: 100 - pct }]
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={22} outerRadius={30}
            startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill="#16a34a" />
            <Cell fill="rgba(255,255,255,0.2)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-extrabold text-white">{pct}%</span>
      </div>
    </div>
  )
}

// ─── Avatar initiales ─────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-primary-600', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500']
  const idx = name.charCodeAt(0) % colors.length
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} ${colors[idx]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export function MemberDashboard() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const { data: tontinesData, isLoading } = useTontines(0, 20)
  const tontines = tontinesData?.content || []

  const activeTontine = tontines.find((t: Tontine) => t.statut === TontineStatut.ACTIVE)
  const { data: cotisationsData } = useCotisations(activeTontine?.id || '', undefined, 0, 50)
  const { data: cyclesData } = useCycles(activeTontine?.id || '', 0, 10)
  const cotisations = cotisationsData?.content || []
  const cycles = cyclesData?.content || []

  const totalValide = cotisations
    .filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE)
    .reduce((s: number, c: Cotisation) => s + c.montant, 0)

  const cycleEnCours = cycles.find((c: Cycle) => c.statut === CycleStatut.EN_COURS)
  const cotisationsCycle = cotisations.filter((c: Cotisation) => cycleEnCours && c.cycleId === cycleEnCours.id)
  const cotiseesCount = cotisationsCycle.filter((c: Cotisation) => c.statut === CotisationStatut.VALIDE).length
  const totalMembres = activeTontine?.nombreMembres || 0
  const cyclePct = totalMembres > 0 ? Math.round((cotiseesCount / totalMembres) * 100) : 0
  const jackpotEstime = activeTontine ? activeTontine.montant * activeTontine.nombreMembres : 0
  const prochaineCotisation = activeTontine?.montant || 0
  const actives = tontines.filter((t: Tontine) => t.statut === TontineStatut.ACTIVE).length

  const prenom = user?.firstName || 'Membre'

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-neutral-500">Bonjour</p>
          <h1 className="text-lg font-extrabold text-neutral-900">{prenom} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm hover:bg-primary-700 transition-colors"
            title="Créer une tontine"
          >
            <Plus size={17} />
          </button>
          <Link to="/notifications"
            className="relative w-9 h-9 rounded-xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center text-neutral-500">
            <Bell size={17} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
          </Link>
        </div>
      </div>

      {/* ── Hero card — solde + prochaine cotisation ─────────────── */}
      <div className="bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600 rounded-3xl p-5 mb-4 shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10">
          <p className="text-white/60 text-xs mb-1">Solde disponible</p>
          <p className="text-white text-3xl font-extrabold mb-4">
            {totalValide.toLocaleString('fr-FR')} <span className="text-lg font-bold text-white/70">FCFA</span>
          </p>

          <div className="flex items-center justify-between">
            <div className="bg-white/10 rounded-2xl px-4 py-3 flex-1 mr-3">
              <p className="text-white/60 text-xs mb-1">Prochaine cotisation</p>
              <p className="text-white font-extrabold text-lg">
                {prochaineCotisation.toLocaleString('fr-FR')}
              </p>
              <p className="text-white/60 text-xs">FCFA</p>
              {cycleEnCours && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar size={10} className="text-white/50" />
                  <span className="text-white/50 text-[10px]">
                    {new Date(cycleEnCours.dateFin).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <p className="text-white/60 text-[10px]">Jackpot à recevoir</p>
                <p className="text-amber-300 font-extrabold text-sm">
                  {(jackpotEstime / 1000).toFixed(0)} 000
                </p>
                <p className="text-white/50 text-[10px]">FCFA</p>
              </div>
              <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                <p className="text-white/60 text-[10px]">Membres actifs</p>
                <p className="text-white font-extrabold text-sm flex items-center justify-center gap-1">
                  <Users size={11} />{totalMembres}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progression du cycle ─────────────────────────────────── */}
      {activeTontine && cycleEnCours && (
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-neutral-900">Avancement du cycle</p>
            <span className="text-xs text-neutral-400">Cycle en cours</span>
          </div>
          <div className="flex items-center gap-4">
            <CycleDonut pct={cyclePct} />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                <span>Cotisations reçues</span>
                <span className="font-bold text-neutral-800">{cotiseesCount}/{totalMembres}</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${cyclePct}%` }} />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1.5">
                {cycleEnCours ? `${new Date(cycleEnCours.dateDebut).toLocaleDateString('fr-FR')} → ${new Date(cycleEnCours.dateFin).toLocaleDateString('fr-FR')}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Jackpot à recevoir (CTA) ─────────────────────────────── */}
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Trophy size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-amber-700 font-semibold">Jackpot estimé</p>
            <p className="text-amber-800 font-extrabold text-lg">{jackpotEstime.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>
        <Link to="/member/tontines" className="text-xs font-bold text-amber-700 flex items-center gap-0.5">
          Voir <ChevronRight size={14} />
        </Link>
      </div>

      {/* ── Mes tontines ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900">Mes tontines ({actives} active{actives > 1 ? 's' : ''})</h3>
          <Link to="/member/tontines" className="text-xs font-medium text-primary-600 flex items-center gap-0.5">
            Tout voir <ChevronRight size={12} />
          </Link>
        </div>
        {tontines.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-400 mb-3">Aucune tontine pour le moment</p>
            <Link to="/member/tontines" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
              <Plus size={14} /> Rejoindre une tontine
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tontines.slice(0, 3).map((t: Tontine) => {
              const pct = t.nombreMembres > 0 ? Math.round((t.nombreMembresActuels / t.nombreMembres) * 100) : 0
              const isActive = t.statut === TontineStatut.ACTIVE
              return (
                <Link key={t.id} to={`/member/tontines/${t.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-50">
                  <Avatar name={t.nom} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{t.nom}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {isActive ? 'Active' : t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-neutral-100 rounded-full h-1">
                        <div className="h-1 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-neutral-400 flex-shrink-0">{pct}%</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {t.nombreMembresActuels}/{t.nombreMembres} membres · {t.montant.toLocaleString('fr-FR')} FCFA/{t.frequence.toLowerCase()}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-neutral-300 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Raccourcis rapides ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/member/cotisations"
          className="bg-white border border-neutral-100 shadow-sm rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Calendar size={18} />
          </div>
          <p className="text-xs font-semibold text-neutral-700 text-center">Mes cotisations</p>
        </Link>
        <Link to="/notifications"
          className="bg-white border border-neutral-100 shadow-sm rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
          </div>
          <p className="text-xs font-semibold text-neutral-700 text-center">Notifications</p>
        </Link>
      </div>

      {/* ── Modal : Créer une tontine ─────────────────────────────── */}
      <CreateTontineModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </AppLayout>
  )
}
