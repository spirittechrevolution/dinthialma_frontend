import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useTontines } from '@/hooks/useTontines'
import { Tontine, TontineType } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { Plus, ArrowRight, Users, Calendar, Search, RotateCcw, CalendarHeart } from 'lucide-react'

const STATUT_TABS = [
  { label: 'Toutes', value: '' },
  { label: 'Active', value: TontineStatut.ACTIVE },
  { label: 'Brouillon', value: TontineStatut.BROUILLON },
  { label: 'Suspendue', value: TontineStatut.SUSPENDUE },
  { label: 'Terminee', value: TontineStatut.TERMINEE },
]

const BADGE_VARIANT: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
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

export function TontinesPage() {
  const navigate = useNavigate()
  const [page] = useState(0)
  const [search, setSearch] = useState('')
  const [statutTab, setStatutTab] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: tontinesData, isLoading } = useTontines(page, 50)

  const tontines = tontinesData?.content || []

  const filtered = tontines.filter((t: Tontine) => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.nom.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    const matchStatut = !statutTab || t.statut === statutTab
    return matchSearch && matchStatut
  })

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mes tontines</h1>
          <p className="text-sm text-neutral-500 mt-1">Créez et gérez vos tontines.</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus size={16} className="mr-1" /> Nouvelle tontine
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une tontine..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatutTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                statutTab === tab.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-lg mb-2">Aucune tontine</p>
          <p className="text-sm">Créez votre première tontine en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t: Tontine) => {
            const isEvent = t.tontineType === TontineType.EVENEMENTIELLE
            const pct = t.nombreMembres > 0 ? Math.round((t.nombreMembresActuels / t.nombreMembres) * 100) : 0
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={BADGE_VARIANT[t.statut]}>
                      {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                    </Badge>
                    {isEvent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        <CalendarHeart size={10} /> Événementielle
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        <RotateCcw size={10} /> Rotative
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/admin/tontines/${t.id}`)}
                    className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>

                <h3 className="font-bold text-neutral-900 text-base mb-1">{t.nom}</h3>
                {t.description && (
                  <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{t.description}</p>
                )}

                {isEvent && t.montantLibre ? (
                  <p className="text-2xl font-bold text-purple-600 mb-0.5">Cotisation libre</p>
                ) : (
                  <p className="text-2xl font-bold text-primary-600 mb-0.5">
                    {t.montant.toLocaleString('fr-FR')} FCFA
                  </p>
                )}
                <p className="text-xs text-neutral-400 mb-4">/ {FREQ_LABELS[t.frequence] || t.frequence}</p>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Users size={12} /> Membres</span>
                    <span className="font-semibold text-neutral-700">
                      {t.nombreMembresActuels}{!isEvent && `/${t.nombreMembres}`}
                    </span>
                  </div>
                  {!isEvent && (
                    <div className="w-full bg-neutral-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(t.dateDebut).toLocaleDateString('fr-FR')}</span>
                    {isEvent && t.dateEcheance ? (
                      <span className="text-purple-500 font-semibold">
                        {new Date(t.dateEcheance).toLocaleDateString('fr-FR')}
                      </span>
                    ) : (
                      <span className="uppercase font-semibold tracking-wide">{t.modeCycle}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateTontineModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </AppLayout>
  )
}
