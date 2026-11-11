/**
 * A6 — Historique : tous les mouvements, filtrables (remplace « Mes cotisations »).
 * Je cotise : mes paiements et jackpots ; Je gère : paiements reçus dans mes tontines.
 * ?mode=COTISE|GERE  ?tontine=:id
 */
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronDown, RotateCw } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { ActiviteRow } from '@/components/home/ActivityFeed'
import { TontinePickerSheet } from '@/components/home/HomeSheets'
import { useActivite, useCotisantSummary, useGestionSummary, useMesRoles } from '@/hooks/useMe'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { formatF } from '@/lib/format'
import { CotisationStatut } from '@/types/common'
import { jeCotise, jeGere, type ActiviteItem, type ModeAccueil } from '@/types/me'

const STATUTS: { id: string; label: string; statut: CotisationStatut | null }[] = [
  { id: 'tous', label: 'Tous', statut: null },
  { id: 'attente', label: 'En attente', statut: CotisationStatut.EN_ATTENTE },
  { id: 'valides', label: 'Validés', statut: CotisationStatut.VALIDE },
  { id: 'retard', label: 'En retard', statut: CotisationStatut.EN_RETARD },
]

export function HistoriquePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const roles = useMesRoles()
  const [savedMode, setSavedMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', ['COTISE', 'GERE'] as const)
  const demande = params.get('mode') as ModeAccueil | null
  const voulu = demande === 'GERE' || demande === 'COTISE' ? demande : savedMode
  const mode: ModeAccueil = roles.deuxModes ? voulu : roles.gere ? 'GERE' : 'COTISE'
  const tontineId = params.get('tontine') ?? undefined

  const [statut, setStatut] = useState('tous')
  const [type, setType] = useState<'tout' | 'paiements' | 'jackpots'>('tout')
  const [limite, setLimite] = useState(60)
  const [pickerOpen, setPickerOpen] = useState(false)

  const activite = useActivite(mode, { tontineId, limit: 1000 })
  const cotisant = useCotisantSummary(mode === 'COTISE' && roles.cotise)
  const gestion = useGestionSummary(mode === 'GERE' && roles.gere)

  const tontinesDuMode = roles.tontines.filter((t) => (mode === 'GERE' ? jeGere(t) : jeCotise(t)))
  const tontineChoisie = tontinesDuMode.find((t) => t.id === tontineId)

  const chiffres: [string, string][] = useMemo(() => {
    if (mode === 'GERE') {
      const lignes = (gestion.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
      return [
        ['Collecté', formatF(lignes.reduce((s, t) => s + t.montantTotalValide, 0))],
        ['À valider', String(lignes.reduce((s, t) => s + t.cotisationsEnAttente, 0))],
        ['En retard', String(lignes.reduce((s, t) => s + t.cotisationsEnRetard, 0))],
      ]
    }
    const lignes = (cotisant.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
    return [
      ['Cotisé', formatF(lignes.reduce((s, t) => s + t.totalCotiseValide, 0))],
      ['En attente', formatF(lignes.reduce((s, t) => s + t.totalEnAttente, 0))],
      ['Jackpots', formatF(lignes.reduce((s, t) => s + t.totalJackpotsRecus, 0))],
    ]
  }, [mode, tontineId, gestion.data, cotisant.data])

  const filtreStatut = STATUTS.find((s) => s.id === statut)?.statut ?? null
  const items = (activite.data ?? []).filter((it) => {
    if (type === 'paiements' && it.sens !== 'EPARGNE') return false
    if (type === 'jackpots' && it.sens !== 'GAIN') return false
    if (filtreStatut && it.statut !== filtreStatut) return false
    return true
  })
  const visibles = items.slice(0, limite)

  // Regroupement par mois (« novembre 2026 »)
  const groupes: [string, ActiviteItem[]][] = []
  for (const it of visibles) {
    const mois = new Date(it.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier[0] === mois) dernier[1].push(it)
    else groupes.push([mois, [it]])
  }

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const ouvrir = (it: ActiviteItem) => navigate(it.cotisationId ? `/recu/${it.tontineId}/${it.cotisationId}` : `/tontine/${it.tontineId}`)

  const chip = (actif: boolean) => clsx('h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap', actif ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 shadow-sm')

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Historique" />
      <main className="px-4 pb-10 max-w-lg mx-auto md:max-w-3xl space-y-4">
        {roles.deuxModes && (
          <div role="tablist" aria-label="Mode" className="mx-auto flex max-w-[16rem] rounded-full bg-white p-1 shadow-sm">
            {(['COTISE', 'GERE'] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m}
                onClick={() => { setSavedMode(m); setParams({ mode: m }, { replace: true }) }}
                className={clsx('flex-1 h-9 rounded-full text-sm font-semibold', mode === m ? 'bg-primary-700 text-white' : 'text-neutral-600')}>
                {m === 'GERE' ? 'Je gère' : 'Je cotise'}
              </button>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-3 gap-2">
          {chiffres.map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl shadow-sm px-2 py-3 text-center">
              <dt className="text-xs text-neutral-500">{k}</dt>
              <dd className="mt-1 font-bold tabular-nums text-neutral-900 truncate">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2">
          {tontinesDuMode.length > 1 && (
            <button onClick={() => setPickerOpen(true)} className="h-10 px-4 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5">
              {tontineChoisie?.nom ?? 'Toutes mes tontines'} <ChevronDown size={16} />
            </button>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer par statut">
            {STATUTS.map((s) => (
              <button key={s.id} aria-pressed={statut === s.id} onClick={() => { setStatut(s.id); setLimite(60) }} className={chip(statut === s.id)}>{s.label}</button>
            ))}
          </div>
          {mode === 'COTISE' && (
            <div className="flex gap-2" role="group" aria-label="Filtrer par type">
              {([['tout', 'Tout'], ['paiements', 'Paiements'], ['jackpots', 'Jackpots']] as const).map(([v, l]) => (
                <button key={v} aria-pressed={type === v} onClick={() => setType(v)} className={chip(type === v)}>{l}</button>
              ))}
            </div>
          )}
        </div>

        {activite.isLoading || roles.isLoading ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white animate-pulse" />)}</div>
        ) : activite.isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger l'historique.</p>
            <button onClick={() => activite.refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          </section>
        ) : groupes.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">Aucun mouvement</p>
        ) : (
          <>
            {groupes.map(([mois, liste]) => (
              <section key={mois}>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500 first-letter:uppercase">{mois}</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">
                  {liste.map((it) => <ActiviteRow key={it.id} mode={mode} it={it} onOpen={ouvrir} />)}
                </ul>
              </section>
            ))}
            {items.length > limite && (
              <button onClick={() => setLimite((l) => l + 60)} className="w-full h-12 rounded-full bg-white shadow-sm text-sm font-semibold text-primary-800">Voir plus</button>
            )}
          </>
        )}
      </main>

      <TontinePickerSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choisir une tontine"
        options={tontinesDuMode.map((t) => ({ id: t.id, nom: t.nom }))}
        allowAll
        selectedId={tontineId ?? null}
        onSelect={(id) => setParam('tontine', id)}
      />
    </div>
  )
}
