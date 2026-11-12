import { Minus, Plus, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatF, formatDateCourte } from '@/lib/format'
import { RYTHMES, dureeRythme, ajouterRythme, type Rythme } from '@/lib/tontineLabels'

interface RythmeSliderProps {
  /** Code FREQUENCE_TONTINE choisi */
  value: string
  onChange: (code: string) => void
  /** Codes acceptés par le backend (référentiel FREQUENCE_TONTINE) */
  disponibles: string[]
  isEvent: boolean
  /** Montant par cotisation (0 ou absent = non renseigné) */
  montant?: number
  montantLibre?: boolean
  /** yyyy-mm-dd */
  dateDebut?: string
  /** Événementielle : date de l'événement (yyyy-mm-dd) */
  dateEvenement?: string
}

/**
 * Réglage du rythme « comme le volume d'une télé » : une barre à crans, du plus court au plus long,
 * le rythme écrit en gros au-dessus et un résumé de ce qu'il implique en dessous.
 * Seuls les crans acceptés par le backend sont affichés, jusqu'à 1 mois (voir RYTHMES et B26).
 */
export function RythmeSlider({ value, onChange, disponibles, isEvent, montant = 0, montantLibre, dateDebut, dateEvenement }: RythmeSliderProps) {
  // Crans jusqu'à 1 mois ; un rythme hors limite n'apparaît que s'il est déjà celui de la tontine
  const crans = RYTHMES.filter((r) => r.code && disponibles.includes(r.code) && (!r.horsLimite || r.code === value))
  if (crans.length === 0) return null
  const index = Math.max(0, crans.findIndex((r) => r.code === value))
  const choisi = crans[index]
  const max = crans.length - 1
  const pct = max ? (index / max) * 100 : 0
  const aller = (i: number) => {
    const r = crans[Math.min(max, Math.max(0, i))]
    if (r.code && r.code !== value) onChange(r.code)
  }
  // Libellés sous la barre : tous s'il y a peu de crans, sinon seulement les repères
  const afficherLibelle = (r: Rythme) => crans.length <= 6 || r.repere

  return (
    <div>
      <p className="text-sm font-semibold text-neutral-700">Rythme des cotisations</p>
      <p className="mt-3 text-center text-[24px] font-extrabold text-neutral-900" aria-hidden>{choisi.label}</p>
      <p className="text-center text-sm text-neutral-500" aria-hidden>
        {isEvent ? 'une cotisation' : 'un tour'} tous les {dureeRythme(choisi)}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => aller(index - 1)} disabled={index === 0} aria-label="Rythme plus court"
          className="w-11 h-11 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Minus size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={index}
            onChange={(e) => aller(Number(e.target.value))}
            aria-label="Rythme des cotisations"
            aria-valuetext={choisi.label}
            className="rythme-range w-full"
            style={{ ['--pct' as string]: `${pct}%` }}
          />
          {/* Crans et libellés, alignés sur le centre du curseur (marge = demi-largeur du curseur) */}
          <div className="relative h-8 mx-[14px]" aria-hidden>
            {crans.map((r, i) => {
              const left = max ? (i / max) * 100 : 0
              return (
                <span key={r.label} className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: `${left}%` }}>
                  <span className={clsx('w-px h-1.5', i <= index ? 'bg-primary-600' : 'bg-neutral-300')} />
                  {afficherLibelle(r) && (
                    <span className={clsx('mt-1 text-[11px] whitespace-nowrap', i === index ? 'font-bold text-primary-800' : 'text-neutral-500')}>{r.court}</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
        <button type="button" onClick={() => aller(index + 1)} disabled={index === max} aria-label="Rythme plus long"
          className="w-11 h-11 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Plus size={20} />
        </button>
      </div>

      <Resume rythme={choisi} isEvent={isEvent} montant={montant} montantLibre={montantLibre} dateDebut={dateDebut} dateEvenement={dateEvenement} />
    </div>
  )
}

/** Ce que le rythme implique, en clair */
function Resume({ rythme, isEvent, montant, montantLibre, dateDebut, dateEvenement }: {
  rythme: Rythme; isEvent: boolean; montant: number; montantLibre?: boolean; dateDebut?: string; dateEvenement?: string
}) {
  const phrase = rythme.label.charAt(0).toLowerCase() + rythme.label.slice(1)
  const lignes: string[] = []

  if (isEvent) {
    lignes.push(montantLibre ? `Chacun cotise librement ${phrase}.` : montant > 0 ? `Chacun cotise ${formatF(montant)} ${phrase}.` : `Chacun cotise ${phrase}.`)
    if (dateDebut && dateEvenement && dateEvenement > dateDebut) {
      // Même règle que le backend : le dernier versement tombe sur la date de l'événement
      const fin = new Date(dateEvenement)
      let d = new Date(dateDebut)
      let n = 0
      while (d < fin && n < 400) { n++; d = ajouterRythme(d, rythme) }
      lignes.push(`${n} versement${n > 1 ? 's' : ''} jusqu'au ${formatDateCourte(dateEvenement)}${!montantLibre && montant > 0 ? `, soit ${formatF(montant * n)} par membre` : ''}.`)
    }
    lignes.push('Un rappel est envoyé avant chaque échéance.')
  } else {
    lignes.push(montant > 0 ? `Chaque membre cotise ${formatF(montant)} ${phrase}.` : `Chaque membre cotise ${phrase}.`)
    lignes.push(`Un tour dure ${dureeRythme(rythme)} : à chaque tour, la cagnotte va à un membre.`)
  }

  return (
    <div className="mt-2 rounded-2xl bg-primary-50 px-4 py-3 flex gap-2.5" aria-live="polite">
      <CheckCircle2 size={18} className="text-primary-700 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-neutral-800 space-y-0.5">
        {lignes.map((l) => <p key={l}>{l}</p>)}
      </div>
    </div>
  )
}
