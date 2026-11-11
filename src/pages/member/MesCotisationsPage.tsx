import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMontant, formatDateHeure } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useMembres } from '@/hooks/useMembres'
import { useCotisations } from '@/hooks/useCotisations'
import { useTontines } from '@/hooks/useTontines'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut, TontineStatut } from '@/types/common'
import { CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react'
import { ChipRow } from '@/components/ui/ChipRow'

// ─── Config icônes par statut ─────────────────────────────────────────────────
const STATUT_CONFIG: Record<CotisationStatut, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  VALIDE:     { icon: <CheckCircle size={16} />, color: 'text-primary-600', bg: 'bg-primary-50',  label: 'Validée'   },
  EN_ATTENTE: { icon: <Clock size={16} />,       color: 'text-orange-500',  bg: 'bg-orange-50',   label: 'En attente' },
  EN_RETARD:  { icon: <AlertTriangle size={16}/>, color: 'text-red-500',    bg: 'bg-red-50',      label: 'En retard'  },
}

export function MesCotisationsPage() {
  const [page, setPage]           = useState(0)
  const navigate = useNavigate()

  const [listTontineId, setListTontineId] = useState('')

  const { user, isAdmin, isSuperAdmin } = useAuth()
  const { data: tontinesData } = useTontines(0, 50)
  const tontines    = (tontinesData?.content || []).filter((t) => t.statut === TontineStatut.ACTIVE)
  const historyTontineId = listTontineId || tontines[0]?.id || ''
  const historyTontine = tontines.find((t) => t.id === historyTontineId)

  const isAdminUser = isAdmin() || isSuperAdmin()
  // Un ADMIN/SUPER_ADMIN reçoit toutes les cotisations de la tontine : on restreint aux siennes
  // avec le filtre serveur ?membreId= (pagination exacte). Son membreId est retrouvé par
  // téléphone — Keycloak stocke "221XXXXXXXX", l'API "7XXXXXXXX" → on retire l'indicatif.
  const normalizePhone = (p: string) => p.replace(/\D/g, '').replace(/^221/, '')
  const { data: membresData, isLoading: membresLoading } = useMembres(isAdminUser ? historyTontineId : '', 0, 100)
  const myMembreId = membresData?.content.find(
    (m) => normalizePhone(m.user.phone) === normalizePhone(user?.phone || '')
  )?.id
  // Admin non membre de cette tontine → requête désactivée → liste vide (jamais celles des autres)
  const { data: cotisationsData, isLoading: cotLoading } = useCotisations(
    historyTontineId, undefined, page, 20,
    isAdminUser ? myMembreId : undefined,
    !isAdminUser || !!myMembreId
  )
  const isLoading = cotLoading || (isAdminUser && membresLoading)

  const cotisations = cotisationsData?.content || []
  const totalPages  = cotisationsData?.totalPages || 1


  return (
    <AppLayout>
      <PageHeader
        title="Mes cotisations"
        description="Historique de vos paiements."
        action={
          <Button onClick={() => navigate('/payer')} disabled={tontines.length === 0}>
            <Plus size={18} /> Payer
          </Button>
        }
      />

      {/* Choix de la tontine (si plusieurs) */}
      {tontines.length > 1 && (
        <ChipRow className="mb-3">
          {tontines.map((t) => (
            <button
              aria-pressed={historyTontineId === t.id}
              key={t.id}
              onClick={() => { setListTontineId(t.id); setPage(0) }}
              className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                historyTontineId === t.id ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t.nom.length > 24 ? t.nom.slice(0, 24) + '…' : t.nom}
            </button>
          ))}
        </ChipRow>
      )}

      {/* Historique — style timeline */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-900">{historyTontine?.nom || 'Historique'}</p>
          {cotisationsData && <p className="text-xs text-neutral-500">{cotisationsData.totalElements} paiement{cotisationsData.totalElements > 1 ? 's' : ''}</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : cotisations.length === 0 ? (
          <p className="text-center py-10 text-neutral-400 text-sm">Aucune cotisation</p>
        ) : (
          <div className="divide-y divide-neutral-50">
            {cotisations.map((c: Cotisation) => {
              const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG.EN_ATTENTE
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/recu/${c.tontineId}/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-50"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{cfg.label}</p>
                    <p className="text-xs text-neutral-500 truncate">{formatDateHeure(c.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-bold tabular flex-shrink-0 ${c.statut === CotisationStatut.VALIDE ? 'text-neutral-900' : c.statut === CotisationStatut.EN_RETARD ? 'text-red-600' : 'text-neutral-500'}`}>
                    {formatMontant(c.montant)} F
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-neutral-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={cotisationsData?.totalElements}
              pageSize={20}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

    </AppLayout>
  )
}
