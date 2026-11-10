import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/ui/Spinner'
import { QuickAction } from '@/components/ui/QuickAction'
import { Section, ListItem, InitialsAvatar } from '@/components/ui/Section'
import { BalanceCard } from '@/components/shared/BalanceCard'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useAuth } from '@/hooks/useAuth'
import { useTontines } from '@/hooks/useTontines'
import { useCotisations } from '@/hooks/useCotisations'
import { useCycles } from '@/hooks/useCycles'
import { useMembres } from '@/hooks/useMembres'
import { Tontine } from '@/types/tontine'
import { TontineStatut, CotisationStatut, CycleStatut } from '@/types/common'
import { Cotisation } from '@/types/cotisation'
import { Cycle } from '@/types/cycle'
import { formatMontant, formatFCFA, formatDateCourte, formatDateHeure } from '@/lib/format'
import { Send, Wallet, History, Plus, Trophy, CheckCircle2, Clock, AlertTriangle, ChevronRight } from 'lucide-react'

const COTI_STATUT: Record<CotisationStatut, { icon: React.ReactNode; tone: string; label: string; amount: string }> = {
  VALIDE:     { icon: <CheckCircle2 size={18} />, tone: 'bg-primary-50 text-primary-700', label: 'Cotisation validée',  amount: 'text-neutral-900' },
  EN_ATTENTE: { icon: <Clock size={18} />,        tone: 'bg-amber-50 text-amber-700',     label: 'En attente de validation', amount: 'text-neutral-500' },
  EN_RETARD:  { icon: <AlertTriangle size={18} />, tone: 'bg-red-50 text-red-600',         label: 'Cotisation en retard', amount: 'text-red-600' },
}

export function MemberDashboard() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const { data: tontinesData, isLoading } = useTontines(0, 20)
  const tontines = tontinesData?.content || []

  const activeTontine = tontines.find((t: Tontine) => t.statut === TontineStatut.ACTIVE)
  // Un ADMIN/SUPER_ADMIN reçoit toutes les cotisations de la tontine : on ne garde que les siennes
  // via ?membreId= (son membre est retrouvé par téléphone ; Keycloak "221…" vs API "7…").
  const isAdminUser = isAdmin() || isSuperAdmin()
  const normalizePhone = (p: string) => p.replace(/\D/g, '').replace(/^221/, '')
  const { data: membresData } = useMembres(isAdminUser ? activeTontine?.id || '' : '', 0, 100)
  const myMembreId = membresData?.content.find(
    (m) => normalizePhone(m.user.phone) === normalizePhone(user?.phone || '')
  )?.id
  const { data: cotisationsData } = useCotisations(
    activeTontine?.id || '', undefined, 0, 50,
    isAdminUser ? myMembreId : undefined,
    !isAdminUser || !!myMembreId
  )
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
  // Jackpot réel du dernier cycle clôturé (montantNet API) ; sinon estimation, signalée comme telle
  const dernierCycleTermine = [...cycles]
    .filter((c: Cycle) => c.statut === CycleStatut.TERMINE && c.montantNet != null)
    .sort((a: Cycle, b: Cycle) => b.numeroCycle - a.numeroCycle)[0]
  const jackpotReel = dernierCycleTermine?.montantNet ?? null
  const prochaineCotisation = activeTontine?.montant || 0
  const recentes = [...cotisations]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5)

  const prenom = user?.firstName || 'Membre'

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
      {/* Salutation */}
      <div className="mb-4 px-1">
        <p className="text-sm text-neutral-500">Bonjour,</p>
        <h1 className="text-2xl font-bold text-neutral-900">{prenom} 👋</h1>
      </div>

      {/* Carte solde */}
      <BalanceCard
        label="Total cotisé"
        amount={totalValide}
        eyebrow={activeTontine && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-300" /> {activeTontine.nom}
          </span>
        )}
        footer={activeTontine ? (
          <>
            Prochaine cotisation : <b className="font-semibold text-white">{formatFCFA(prochaineCotisation)}</b>
            {cycleEnCours && <> · avant le {formatDateCourte(cycleEnCours.dateFin)}</>}
          </>
        ) : 'Rejoignez ou créez une tontine pour commencer.'}
        action={activeTontine ? (
          <Link
            to="/member/cotisations"
            state={{ openPay: true }}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-primary-700 font-bold text-[15px] active:scale-[0.98] transition"
          >
            <Send size={18} /> Payer ma cotisation
          </Link>
        ) : (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-white text-primary-700 font-bold text-[15px] active:scale-[0.98] transition"
          >
            <Plus size={18} /> Créer une tontine
          </button>
        )}
      />

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <QuickAction icon={<Send size={22} />} label="Payer" to="/member/cotisations" state={{ openPay: true }} tone="primary" />
        <QuickAction icon={<Wallet size={22} />} label="Tontines" to="/member/tontines" tone="blue" />
        <QuickAction icon={<History size={22} />} label="Historique" to="/member/cotisations" tone="purple" />
        <QuickAction icon={<Plus size={22} />} label="Créer" onClick={() => setCreateOpen(true)} tone="amber" />
      </div>

      {/* Cycle en cours */}
      {activeTontine && cycleEnCours && (
        <Section title="Cycle en cours">
          <div className="p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-neutral-600">Cotisations reçues</span>
              <span className="text-sm font-bold text-neutral-900 tabular">{cotiseesCount} / {totalMembres}</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-primary-500 transition-all" style={{ width: `${cyclePct}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-neutral-500">
                {formatDateCourte(cycleEnCours.dateDebut)} → {formatDateCourte(cycleEnCours.dateFin)}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-2.5 py-1">
                <Trophy size={13} /> {jackpotReel != null ? 'Dernier jackpot' : 'Jackpot estimé'} {formatMontant(jackpotReel ?? jackpotEstime)} F
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* Mes tontines */}
      <Section title="Mes tontines" to="/member/tontines">
        {tontines.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-neutral-500 mb-3">Aucune tontine pour le moment</p>
            <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
              <Plus size={16} /> Créer une tontine
            </button>
          </div>
        ) : (
          tontines.slice(0, 3).map((t: Tontine) => (
            <ListItem
              key={t.id}
              to={`/member/tontines/${t.id}`}
              leading={<InitialsAvatar name={t.nom} />}
              title={t.nom}
              subtitle={`${formatFCFA(t.montant)} / ${t.frequence.toLowerCase()} · ${t.nombreMembresActuels}/${t.nombreMembres} membres`}
              trailing={<ChevronRight size={18} className="text-neutral-300" />}
            />
          ))
        )}
      </Section>

      {/* Activité récente */}
      {activeTontine && (
        <Section title="Activité récente" to="/member/cotisations">
          {recentes.length === 0 ? (
            <p className="text-center py-8 text-sm text-neutral-500">Aucune cotisation pour le moment</p>
          ) : (
            recentes.map((c: Cotisation) => {
              const cfg = COTI_STATUT[c.statut] || COTI_STATUT.EN_ATTENTE
              return (
                <ListItem
                  key={c.id}
                  leading={<span className={`w-10 h-10 rounded-full flex items-center justify-center ${cfg.tone}`}>{cfg.icon}</span>}
                  title={cfg.label}
                  subtitle={formatDateHeure(c.createdAt)}
                  trailing={<span className={`text-sm font-bold tabular ${cfg.amount}`}>-{formatMontant(c.montant)} F</span>}
                />
              )
            })
          )}
        </Section>
      )}

      </div>

      <CreateTontineModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </AppLayout>
  )
}
