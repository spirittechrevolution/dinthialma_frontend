/**
 * Modifier une tontine en brouillon (gestionnaire) — depuis Réglages.
 * Mêmes réglages que la création, sur un seul écran. Le mode des tours (automatique / manuel)
 * n'est pas modifiable par l'API après création.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Stepper } from '@/components/ui/Stepper'
import { useTontineVue } from '@/hooks/useTontineVue'
import { useUpdateTontine } from '@/hooks/useTontines'
import { useCodeList } from '@/hooks/useCodeList'
import { useOnline } from '@/hooks/useOnline'
import { formatF } from '@/lib/format'
import { rythmeCourt, FREQUENCES_DEFAUT, ORDRES_DEFAUT, ORDRE_LABEL, capital } from '@/lib/tontineLabels'
import { parseApiError } from '@/lib/apiError'
import { TontineStatut } from '@/types/common'
import { TontineType, type UpdateTontineRequest } from '@/types/tontine'

const champ = 'mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600'
const isoJour = (v: string | null | undefined) => (v ? v.slice(0, 10) : '')

export function ModifierTontinePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const v = useTontineVue(id)
  const t = v.tontine
  const { mutate: modifier, isPending } = useUpdateTontine()
  const { data: freqList } = useCodeList('FREQUENCE_TONTINE')
  const { data: ordreList } = useCodeList('ORDRE_BENEFICIAIRE')
  const frequences = freqList?.length ? freqList.map((f) => f.value) : FREQUENCES_DEFAUT
  const ordres = ordreList?.length ? ordreList.map((o) => o.value) : ORDRES_DEFAUT

  const [f, setF] = useState({
    nom: '', description: '', montant: '', frequence: '', dateDebut: '',
    membres: 2, gagnants: 1, ordre: 'ROTATION',
    dateEvenement: '', montantLibre: false, minimum: '',
  })
  const [pret, setPret] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Préremplissage une fois la tontine chargée
  useEffect(() => {
    if (!t || pret) return
    setF({
      nom: t.nom,
      description: t.description ?? '',
      montant: t.montant ? String(t.montant) : '',
      frequence: t.frequence,
      dateDebut: isoJour(t.dateDebut),
      membres: t.nombreMembres || 2,
      gagnants: t.nombreGagnants || 1,
      ordre: t.ordreBeneficiaire ?? 'ROTATION',
      dateEvenement: isoJour(t.dateEcheance),
      montantLibre: !!t.montantLibre,
      minimum: t.montantMinimum ? String(t.montantMinimum) : '',
    })
    setPret(true)
  }, [t, pret])

  if (v.isLoading || (t && !pret)) {
    return <Shell><div className="space-y-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-3xl bg-white animate-pulse" />)}</div></Shell>
  }
  if (!t || v.vue !== 'GERE') {
    return <Shell><p className="pt-8 text-center text-sm text-neutral-500">Réservé au gestionnaire de la tontine.</p></Shell>
  }
  if (t.statut !== TontineStatut.BROUILLON) {
    return <Shell><p className="pt-8 text-center text-sm text-neutral-500">Seule une tontine en brouillon peut être modifiée.</p></Shell>
  }

  const isEvent = t.tontineType === TontineType.EVENEMENTIELLE
  const montant = Number(f.montant)
  const set = <K extends keyof typeof f>(k: K, val: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: val })); setError(null) }

  const verifier = (): string | null => {
    const n = f.nom.trim()
    if (n.length < 2 || n.length > 150) return 'Le nom doit faire entre 2 et 150 caractères.'
    if (!f.frequence) return 'Choisissez un rythme.'
    if (!f.dateDebut) return 'Indiquez la date de début.'
    if (isEvent) {
      if (!f.dateEvenement || f.dateEvenement <= f.dateDebut) return "La date de l'événement doit être après le début."
      if (!f.montantLibre && !(montant > 0)) return 'Indiquez le montant.'
      return null
    }
    if (!(montant > 0)) return 'Indiquez le montant.'
    if (f.membres < Math.max(2, t.nombreMembresActuels)) return `Au moins ${Math.max(2, t.nombreMembresActuels)} membres (déjà ajoutés).`
    if (f.gagnants < 1 || f.gagnants >= f.membres) return 'Le nombre de gagnants doit être inférieur au nombre de membres.'
    return null
  }

  const enregistrer = () => {
    const e = verifier()
    if (e) { setError(e); return }
    const req: UpdateTontineRequest = {
      nom: f.nom.trim(),
      description: f.description.trim() || undefined,
      frequence: f.frequence,
      dateDebut: f.dateDebut,
    }
    if (isEvent) {
      req.dateEcheance = f.dateEvenement
      req.nomEvenement = f.nom.trim()
      req.montantLibre = f.montantLibre
      req.montant = f.montantLibre ? undefined : montant
      req.montantMinimum = f.montantLibre && Number(f.minimum) > 0 ? Number(f.minimum) : undefined
    } else {
      req.montant = montant
      req.nombreMembres = f.membres
      req.nombreGagnants = f.gagnants
      req.ordreBeneficiaire = f.ordre
    }
    modifier({ id, request: req }, {
      onSuccess: () => { toast.success('Modifications enregistrées'); navigate(`/tontine/${id}/reglages`, { replace: true }) },
      onError: (err) => setError(parseApiError(err).serverMessage || "L'enregistrement a échoué. Réessayez."),
    })
  }

  const pills = (valeurs: string[], actif: string, onPick: (v: string) => void, libelle: (v: string) => string) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {valeurs.map((x) => (
        <button key={x} type="button" aria-pressed={actif === x} onClick={() => onPick(x)}
          className={clsx('h-11 px-4 rounded-full text-sm font-semibold', actif === x ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-700')}>
          {libelle(x)}
        </button>
      ))}
    </div>
  )

  return (
    <Shell>
      <div className="space-y-4 pb-28">
        <section className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Nom</span>
            <input value={f.nom} onChange={(e) => set('nom', e.target.value.slice(0, 150))} className={champ} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Description (facultatif)</span>
            <textarea value={f.description} onChange={(e) => set('description', e.target.value.slice(0, 300))} rows={2}
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-neutral-100 text-[16px] resize-none outline-none focus:ring-2 focus:ring-primary-600" />
          </label>
        </section>

        <section className="bg-white rounded-3xl shadow-sm p-4 space-y-4">
          {isEvent && (
            <label className="flex items-center justify-between h-12">
              <span className="font-medium text-neutral-800">Montant libre</span>
              <input type="checkbox" checked={f.montantLibre} onChange={(e) => set('montantLibre', e.target.checked)} className="w-6 h-6 accent-primary-700" />
            </label>
          )}
          {isEvent && f.montantLibre ? (
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Minimum par cotisation (facultatif)</span>
              <input value={f.minimum} onChange={(e) => set('minimum', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="1000" className={champ} />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Montant (FCFA)</span>
              <input value={f.montant} onChange={(e) => set('montant', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={champ} />
              {montant > 0 && <span className="text-sm text-neutral-500">{formatF(montant)}</span>}
            </label>
          )}
          <div>
            <p className="text-sm font-semibold text-neutral-700">{isEvent ? 'Rappels' : 'Rythme'}</p>
            {pills(frequences, f.frequence, (x) => set('frequence', x), (x) => capital(rythmeCourt(x)))}
          </div>
          <div className={clsx('grid gap-3', isEvent ? 'grid-cols-2' : 'grid-cols-1')}>
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">Début</span>
              <input type="date" value={f.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} className={champ} />
            </label>
            {isEvent && (
              <label className="block">
                <span className="text-sm font-semibold text-neutral-700">Événement</span>
                <input type="date" value={f.dateEvenement} min={f.dateDebut} onChange={(e) => set('dateEvenement', e.target.value)} className={champ} />
              </label>
            )}
          </div>
        </section>

        {!isEvent && (
          <section className="bg-white rounded-3xl shadow-sm p-4 space-y-5">
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">Nombre de membres</p>
              <Stepper value={f.membres} min={Math.max(2, t.nombreMembresActuels)} max={100} onChange={(x) => set('membres', x)} label="membres" small />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">Gagnants par tour</p>
              <Stepper value={f.gagnants} min={1} max={Math.max(1, f.membres - 1)} onChange={(x) => set('gagnants', x)} label={f.gagnants > 1 ? 'gagnants' : 'gagnant'} small />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">Ordre des gagnants</p>
              {pills(ordres, f.ordre, (x) => set('ordre', x), (x) => ORDRE_LABEL[x] ?? x)}
            </div>
          </section>
        )}

        {error && <p role="alert" className="px-1 text-sm font-medium text-red-700">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          <button onClick={enregistrer} disabled={!online || isPending} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
            {isPending ? 'Enregistrement…' : !online ? 'Connexion requise' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Modifier le brouillon" />
      <main className="px-4 pb-8 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
