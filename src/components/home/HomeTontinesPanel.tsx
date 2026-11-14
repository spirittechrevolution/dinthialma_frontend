import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronRight, Wallet } from 'lucide-react'
import { formatF } from '@/lib/format'
import { dueDetail } from '@/components/home/HomeSheets'
import type { CotisantSummary, GestionSummary, MaTontine, ModeAccueil } from '@/types/me'

interface HomeTontinesPanelProps {
  mode: ModeAccueil
  tontines: MaTontine[]
  cotisant: CotisantSummary | undefined
  gestion: GestionSummary | undefined
  isLoading: boolean
  /** Tontine choisie dans le filtre du bandeau (mise en évidence) */
  selectedId: string | null
  hidden: boolean
}

/**
 * A1 desktop — panneau « Mes tontines » (colonne de droite de l'accueil).
 * Mêmes données que l'accueil mobile (/me/summary, /admin/my-dashboard) : aucun appel en plus.
 * Je cotise : où j'en suis dans chaque tontine. Je gère : avancement du tour en cours.
 */
export function HomeTontinesPanel({ mode, tontines, cotisant, gestion, isLoading, selectedId, hidden }: HomeTontinesPanelProps) {
  const montant = (v: number | null | undefined) => (hidden ? '••••' : formatF(v ?? 0))

  return (
    <section className="bg-white rounded-3xl shadow-sm" aria-labelledby="panel-tontines">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 id="panel-tontines" className="text-[17px] font-semibold text-neutral-900">Mes tontines</h2>
        <Link
          to={mode === 'GERE' ? '/tontines?section=gere' : '/tontines?section=cotise'}
          className="text-sm font-semibold text-primary-700 hover:underline"
        >
          Tout voir
        </Link>
      </div>

      {isLoading ? (
        <ul aria-busy="true" className="pb-2">
          {[0, 1, 2].map((i) => (
            <li key={i} className="px-4 py-3 space-y-2">
              <span className="block h-4 w-2/3 rounded bg-neutral-100 animate-pulse" />
              <span className="block h-3 w-1/2 rounded bg-neutral-100 animate-pulse" />
            </li>
          ))}
        </ul>
      ) : tontines.length === 0 ? (
        <div className="px-4 pb-6 pt-2 text-center">
          <span className="mx-auto w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
            <Wallet size={22} />
          </span>
          <p className="mt-2 text-sm text-neutral-500">Aucune tontine pour l'instant</p>
        </div>
      ) : (
        <ul className="pb-2">
          {tontines.map((t) => {
            const selected = t.id === selectedId
            return (
              <li key={t.id}>
                <Link
                  to={`/tontine/${t.id}`}
                  aria-current={selected ? 'true' : undefined}
                  className={clsx(
                    'mx-2 px-2 py-3 rounded-2xl flex items-center gap-3 transition-colors',
                    selected ? 'bg-primary-50' : 'hover:bg-neutral-50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {mode === 'GERE'
                      ? <LigneGestion t={t} gestion={gestion} montant={montant} />
                      : <LigneCotisant t={t} cotisant={cotisant} />}
                  </div>
                  <ChevronRight size={18} className="text-neutral-400 flex-shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Pastille({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={clsx('inline-flex items-center h-6 px-2 rounded-full text-xs font-semibold', cls)}>{children}</span>
}

function LigneCotisant({ t, cotisant }: { t: MaTontine; cotisant: CotisantSummary | undefined }) {
  const s = cotisant?.tontines.find((x) => x.tontineId === t.id)
  const due = s?.cotisationDue
  return (
    <>
      <p className="font-semibold text-neutral-900 truncate">{t.nom}</p>
      <p className="text-sm text-neutral-500 truncate">
        {t.montantLibre ? 'Montant libre' : formatF(t.montant)}
        {s && s.toursTotal > 0 ? ` · ${s.toursPayes}/${s.toursTotal} tours payés` : ''}
      </p>
      <div className="mt-1.5">
        {due?.statut === 'A_PAYER' ? (
          <Pastille cls="bg-red-50 text-red-700">À payer · {dueDetail(due.dateLimite)}</Pastille>
        ) : due?.statut === 'EN_ATTENTE' ? (
          <Pastille cls="bg-amber-50 text-amber-800">En attente de validation</Pastille>
        ) : due?.statut === 'VALIDE' ? (
          <Pastille cls="bg-primary-50 text-primary-800">À jour</Pastille>
        ) : (
          <Pastille cls="bg-neutral-100 text-neutral-600">Rien à payer</Pastille>
        )}
      </div>
    </>
  )
}

function LigneGestion({ t, gestion, montant }: { t: MaTontine; gestion: GestionSummary | undefined; montant: (v: number | null | undefined) => string }) {
  const g = gestion?.tontines.find((x) => x.tontineId === t.id)
  const c = g?.cycleEnCours
  const pct = c && c.membresActifs > 0 ? Math.round((c.membresAyantPaye / c.membresActifs) * 100) : 0
  return (
    <>
      <div className="flex items-center gap-2">
        <p className="flex-1 font-semibold text-neutral-900 truncate">{t.nom}</p>
        {!!g?.cotisationsEnAttente && (
          <Pastille cls="bg-amber-50 text-amber-800">{g.cotisationsEnAttente} à valider</Pastille>
        )}
      </div>
      {c ? (
        <>
          <p className="text-sm text-neutral-500 truncate">
            Tour {c.numeroCycle} · {montant(c.montantCollecte)}
            {c.montantAttendu != null ? ` / ${montant(c.montantAttendu)}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden"
              role="progressbar"
              aria-valuenow={c.membresAyantPaye}
              aria-valuemin={0}
              aria-valuemax={c.membresActifs}
              aria-label={`${c.membresAyantPaye} membres sur ${c.membresActifs} ont payé`}
            >
              <span className="block h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-xs font-medium text-neutral-600 tabular-nums">{c.membresAyantPaye}/{c.membresActifs}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500">{g?.gagnantsADesigner ? 'Gagnant à désigner' : 'Pas de tour en cours'}</p>
      )}
    </>
  )
}
