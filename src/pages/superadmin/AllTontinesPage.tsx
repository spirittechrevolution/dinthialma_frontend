import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useTontines } from '@/hooks/useTontines'
import { Tontine } from '@/types/tontine'
import { TontineStatut } from '@/types/common'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ExternalLink } from 'lucide-react'

const STATUT_TABS = [
  { label: 'Toutes', value: '' },
  { label: 'Active', value: TontineStatut.ACTIVE },
  { label: 'Brouillon', value: TontineStatut.BROUILLON },
  { label: 'Suspendue', value: TontineStatut.SUSPENDUE },
  { label: 'Terminée', value: TontineStatut.TERMINEE },
]

const statutVariants: Record<TontineStatut, 'success' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  BROUILLON: 'default',
  SUSPENDUE: 'warning',
  TERMINEE: 'default',
}

const FREQ_LABELS: Record<string, string> = {
  JOURNALIERE: 'Journalière',
  HEBDOMADAIRE: 'Hebdomadaire',
  BIMENSUEL: 'Bimensuel',
  MENSUEL: 'Mensuelle',
  TRIMESTRIEL: 'Trimestriel',
}

export function AllTontinesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statutTab, setStatutTab] = useState('')

  const { data: tontinesData, isLoading } = useTontines(page, 20)
  const tontines = tontinesData?.content || []
  const totalPages = tontinesData?.totalPages || 1

  const filtered = tontines.filter((t: Tontine) => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.nom.toLowerCase().includes(q) ||
      `${t.creePar.firstName} ${t.creePar.lastName}`.toLowerCase().includes(q)
    const matchStatut = !statutTab || t.statut === statutTab
    return matchSearch && matchStatut
  })

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Toutes les tontines</h1>
          <p className="text-sm text-neutral-500 mt-1">Vue globale des tontines de la plateforme.</p>
        </div>
        <Button size="sm">
          <Plus size={16} className="mr-1" /> Nouvelle
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="px-5 pt-4 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une tontine ou un créateur..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
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
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards — mobile */}
        <div className="md:hidden divide-y divide-neutral-50 mt-3">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-neutral-400 text-sm">Aucune tontine trouvée</p>
          ) : (
            filtered.map((t: Tontine) => (
              <div key={t.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-neutral-900 truncate">{t.nom}</p>
                    <p className="text-xs text-neutral-500">{t.creePar.firstName} {t.creePar.lastName}</p>
                  </div>
                  <Badge variant={statutVariants[t.statut]}>
                    {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                    <span>{FREQ_LABELS[t.frequence] || t.frequence}</span>
                    <span className="font-semibold text-neutral-800">{t.montant.toLocaleString('fr-FR')} FCFA</span>
                    <span>{t.nombreMembresActuels}/{t.nombreMembres} membres</span>
                  </div>
                  <button
                    onClick={() => navigate(`/superadmin/tontines/${t.id}`)}
                    className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-colors flex-shrink-0"
                    title="Voir le détail"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden md:block overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Tontine', 'Créateur', 'Fréquence', 'Montant', 'Membres', 'Début', 'Statut'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-neutral-400">Aucune tontine trouvée</td></tr>
              ) : (
                filtered.map((t: Tontine) => (
                  <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-900">{t.nom}</p>
                      {t.description && (
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1 max-w-xs">{t.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-neutral-700">
                      {t.creePar.firstName} {t.creePar.lastName}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {FREQ_LABELS[t.frequence] || t.frequence}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {t.montant.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {t.nombreMembresActuels}/{t.nombreMembres}
                    </td>
                    <td className="px-5 py-4 text-neutral-500">
                      {new Date(t.dateDebut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statutVariants[t.statut]}>
                        {t.statut.charAt(0) + t.statut.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/superadmin/tontines/${t.id}`)}
                        className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        title="Voir le détail"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-neutral-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
