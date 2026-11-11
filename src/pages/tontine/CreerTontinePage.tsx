/**
 * T9 — Créer une tontine (gabarit « question unique » de Wave).
 *
 * 1. « Pour quoi cotisez-vous ? » → fixe le type (rotative / événementielle), un nom et un rythme proposés
 * 2. « Combien et à quel rythme ? » (+ date et montant libre pour un événement)
 * 3. « Combien de membres ? » (rotative) + « Plus d'options »
 * 4. Récapitulatif en une phrase + nom modifiable → création → écran de succès
 * Après création, la session est renouvelée pour obtenir les droits de gestionnaire sans reconnexion.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  RefreshCw, Moon, Heart, Baby, Users, Briefcase, GraduationCap, Plane, MoreHorizontal,
  ChevronDown, CheckCircle2, UserPlus,
} from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { AmountPad, BigAmount } from '@/components/pay/AmountPad'
import { useCreateTontine } from '@/hooks/useTontines'
import { useCodeList } from '@/hooks/useCodeList'
import { useAuth } from '@/hooks/useAuth'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte } from '@/lib/format'
import { rythmeCourt, datesTourSuggerees, FREQUENCES_DEFAUT, ORDRES_DEFAUT, ORDRE_LABEL, capital } from '@/lib/tontineLabels'
import { Stepper } from '@/components/ui/Stepper'
import { parseApiError } from '@/lib/apiError'
import { ModeCycle } from '@/types/common'
import { TontineType, type CreateTontineRequest } from '@/types/tontine'

type Objectif = 'classique' | 'tabaski' | 'mariage' | 'bapteme' | 'famille' | 'business' | 'etudes' | 'voyage' | 'autre'

const annee = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear()

const OBJECTIFS: { id: Objectif; label: string; icon: JSX.Element; type: TontineType; nom: string; frequence: string; tone: string }[] = [
  { id: 'classique', label: 'Tontine classique', icon: <RefreshCw size={30} />, type: TontineType.ROTATIVE, nom: 'Ma tontine', frequence: 'MENSUEL', tone: 'bg-primary-100 text-primary-800' },
  { id: 'tabaski', label: 'Tabaski', icon: <Moon size={30} />, type: TontineType.EVENEMENTIELLE, nom: `Tabaski ${annee}`, frequence: 'MENSUEL', tone: 'bg-amber-100 text-amber-800' },
  { id: 'mariage', label: 'Mariage', icon: <Heart size={30} />, type: TontineType.EVENEMENTIELLE, nom: 'Mariage', frequence: 'MENSUEL', tone: 'bg-rose-100 text-rose-800' },
  { id: 'bapteme', label: 'Baptême', icon: <Baby size={30} />, type: TontineType.EVENEMENTIELLE, nom: 'Baptême', frequence: 'MENSUEL', tone: 'bg-sky-100 text-sky-800' },
  { id: 'famille', label: 'Famille', icon: <Users size={30} />, type: TontineType.ROTATIVE, nom: 'Tontine Famille', frequence: 'MENSUEL', tone: 'bg-violet-100 text-violet-800' },
  { id: 'business', label: 'Business', icon: <Briefcase size={30} />, type: TontineType.ROTATIVE, nom: 'Tontine Business', frequence: 'HEBDOMADAIRE', tone: 'bg-teal-100 text-teal-800' },
  { id: 'etudes', label: 'Études', icon: <GraduationCap size={30} />, type: TontineType.EVENEMENTIELLE, nom: 'Rentrée scolaire', frequence: 'MENSUEL', tone: 'bg-indigo-100 text-indigo-800' },
  { id: 'voyage', label: 'Voyage', icon: <Plane size={30} />, type: TontineType.EVENEMENTIELLE, nom: 'Voyage', frequence: 'MENSUEL', tone: 'bg-cyan-100 text-cyan-800' },
  { id: 'autre', label: 'Autre', icon: <MoreHorizontal size={30} />, type: TontineType.ROTATIVE, nom: 'Ma tontine', frequence: 'MENSUEL', tone: 'bg-neutral-200 text-neutral-700' },
]


export function CreerTontinePage() {
  const navigate = useNavigate()
  const online = useOnline()
  const { refreshSession } = useAuth()
  const { mutate: creer, isPending } = useCreateTontine()
  const { data: freqList } = useCodeList('FREQUENCE_TONTINE')
  const { data: ordreList } = useCodeList('ORDRE_BENEFICIAIRE')
  const frequences = freqList?.length ? freqList.map((f) => f.value) : FREQUENCES_DEFAUT
  const ordres = ordreList?.length ? ordreList.map((o) => o.value) : ORDRES_DEFAUT

  const aujourdhui = datesTourSuggerees('JOURNALIERE').debut
  const [etape, setEtape] = useState(1)
  const [objectif, setObjectif] = useState<Objectif | null>(null)
  const [type, setType] = useState<TontineType>(TontineType.ROTATIVE)
  const [nom, setNom] = useState('')
  const [montant, setMontant] = useState(5000)
  const [frequence, setFrequence] = useState('MENSUEL')
  const [membres, setMembres] = useState(10)
  const [dateDebut, setDateDebut] = useState(aujourdhui)
  const [gagnants, setGagnants] = useState(1)
  const [ordre, setOrdre] = useState('ROTATION')
  const [modeCycle, setModeCycle] = useState<ModeCycle>(ModeCycle.AUTOMATIQUE)
  const [description, setDescription] = useState('')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [dateEvenement, setDateEvenement] = useState('')
  const [montantLibre, setMontantLibre] = useState(false)
  const [minimum, setMinimum] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creeeId, setCreeeId] = useState<string | null>(null)

  const isEvent = type === TontineType.EVENEMENTIELLE
  const etapes = isEvent ? [1, 2, 4] : [1, 2, 3, 4]
  const indexEtape = etapes.indexOf(etape)

  const choisirObjectif = (o: (typeof OBJECTIFS)[number]) => {
    setObjectif(o.id)
    setType(o.type)
    setNom(o.nom)
    setFrequence(frequences.includes(o.frequence) ? o.frequence : frequences[0])
    if (!ordres.includes(ordre)) setOrdre(ordres[0])
  }

  const erreurEtape = useMemo((): string | null => {
    if (etape === 1) return objectif ? null : 'Choisissez un objectif.'
    if (etape === 2) {
      if (!frequence) return 'Choisissez un rythme.'
      if (isEvent) {
        if (!dateEvenement) return "Indiquez la date de l'événement."
        if (dateEvenement <= dateDebut) return "La date de l'événement doit être après le début."
        if (!montantLibre && montant <= 0) return 'Indiquez le montant.'
        return null
      }
      return montant > 0 ? null : 'Indiquez le montant.'
    }
    if (etape === 3) {
      if (membres < 2 || membres > 100) return 'Entre 2 et 100 membres.'
      if (gagnants < 1 || gagnants >= membres) return 'Le nombre de gagnants doit être inférieur au nombre de membres.'
      if (!dateDebut) return 'Indiquez la date de début.'
      return null
    }
    if (etape === 4) {
      const n = nom.trim()
      return n.length < 2 ? 'Le nom doit faire au moins 2 caractères.' : n.length > 150 ? '150 caractères maximum.' : null
    }
    return null
  }, [etape, objectif, frequence, isEvent, dateEvenement, dateDebut, montantLibre, montant, membres, gagnants, nom])

  const suivant = () => {
    if (erreurEtape) { setError(erreurEtape); return }
    setError(null)
    setEtape(etapes[indexEtape + 1])
  }
  const precedent = () => {
    setError(null)
    if (indexEtape <= 0) navigate(-1)
    else setEtape(etapes[indexEtape - 1])
  }

  const creerTontine = () => {
    if (erreurEtape) { setError(erreurEtape); return }
    setError(null)
    const payload: CreateTontineRequest = {
      tontineType: type,
      nom: nom.trim(),
      description: description.trim() || undefined,
      frequence,
      dateDebut,
    }
    if (isEvent) {
      payload.dateEcheance = dateEvenement
      payload.nomEvenement = nom.trim()
      payload.montantLibre = montantLibre
      payload.montant = montantLibre ? undefined : montant
      payload.montantMinimum = montantLibre && Number(minimum) > 0 ? Number(minimum) : undefined
    } else {
      payload.montant = montant
      payload.nombreMembres = membres
      payload.nombreGagnants = gagnants
      payload.ordreBeneficiaire = ordre
      payload.modeCycle = modeCycle
    }
    creer(payload, {
      onSuccess: async (t) => {
        await refreshSession() // B12 : droits de gestionnaire sans reconnexion (sans effet si échec)
        setCreeeId(t.id)
      },
      onError: (err) => {
        const { code, serverMessage } = parseApiError(err)
        setError(code === 'NETWORK_ERROR' ? 'Pas de connexion. Réessayez quand le réseau revient.' : serverMessage || 'La création a échoué. Réessayez.')
      },
    })
  }

  // ─── Succès ──────────────────────────────────────────────────────────────
  if (creeeId) {
    return (
      <div className="min-h-[100dvh] bg-[#f2f3f5] px-4 pt-[max(2rem,env(safe-area-inset-top))]">
        <section className="max-w-lg mx-auto bg-white rounded-3xl shadow-sm p-6 text-center">
          <span className="mx-auto w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center animate-pop"><CheckCircle2 size={40} /></span>
          <p className="mt-4 text-xl font-bold text-neutral-900">Tontine créée ✓</p>
          <p className="mt-1 text-neutral-600">{nom.trim()}</p>
          <p className="mt-3 text-sm text-neutral-500">C'est un brouillon : ajoutez vos membres, puis lancez-la depuis sa fiche.</p>
          <button onClick={() => navigate(`/tontine/${creeeId}/membres`, { replace: true })} className="mt-6 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold inline-flex items-center justify-center gap-2">
            <UserPlus size={20} /> Ajouter des membres
          </button>
          <button onClick={() => navigate(`/tontine/${creeeId}`, { replace: true })} className="mt-3 w-full h-12 rounded-full bg-neutral-100 font-semibold">
            Voir la tontine
          </button>
        </section>
      </div>
    )
  }

  // ─── Étapes ──────────────────────────────────────────────────────────────
  const rythme = rythmeCourt(frequence)
  const jackpot = Math.round((montant * membres) / Math.max(1, gagnants))

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Créer une tontine" onBack={precedent} />
      <div className="px-4 max-w-lg mx-auto">
        <div className="flex gap-1.5" aria-label={`Étape ${indexEtape + 1} sur ${etapes.length}`}>
          {etapes.map((e, i) => <span key={e} className={clsx('h-1.5 flex-1 rounded-full', i <= indexEtape ? 'bg-primary-700' : 'bg-neutral-200')} />)}
        </div>
      </div>

      <main className="px-4 pt-5 pb-32 max-w-lg mx-auto">
        {etape === 1 && (
          <>
            <h2 className="text-center text-[22px] font-bold text-neutral-900">Pour quoi cotisez-vous ?</h2>
            <div role="radiogroup" className="mt-6 grid grid-cols-3 gap-y-5 gap-x-2">
              {OBJECTIFS.map((o) => {
                const selected = objectif === o.id
                return (
                  <button
                    key={o.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choisirObjectif(o)}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className={clsx('relative w-[88px] h-[88px] rounded-full flex items-center justify-center transition', o.tone, selected && 'ring-4 ring-primary-700 ring-offset-2 ring-offset-[#f2f3f5]')}>
                      {o.icon}
                      {selected && <CheckCircle2 size={22} className="absolute -top-1 -right-1 text-primary-700 bg-white rounded-full" />}
                    </span>
                    <span className="text-[14px] font-medium text-neutral-800 text-center leading-tight">{o.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {etape === 2 && (
          <div className="space-y-4">
            <h2 className="text-center text-[22px] font-bold text-neutral-900">{isEvent ? 'Combien et jusqu\'à quand ?' : 'Combien et à quel rythme ?'}</h2>

            {objectif === 'autre' && (
              <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-2">
                {[[TontineType.ROTATIVE, 'Chacun son tour'], [TontineType.EVENEMENTIELLE, 'Pour un événement']].map(([v, l]) => (
                  <button key={v} role="radio" aria-checked={type === v} onClick={() => setType(v as TontineType)}
                    className={clsx('h-12 rounded-2xl border-2 font-semibold', type === v ? 'border-primary-700 bg-primary-50' : 'border-neutral-200 bg-white')}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            {isEvent && (
              <label className="flex items-center justify-between bg-white rounded-3xl shadow-sm px-4 h-14">
                <span className="font-medium text-neutral-800">Montant libre</span>
                <input type="checkbox" checked={montantLibre} onChange={(e) => setMontantLibre(e.target.checked)} className="w-6 h-6 accent-primary-700" />
              </label>
            )}

            {!(isEvent && montantLibre) ? (
              <section className="bg-white rounded-3xl shadow-sm p-4">
                <p className="text-center text-sm text-neutral-500">{isEvent ? 'Montant par période' : 'Montant par membre'}</p>
                <div className="mt-2"><BigAmount value={montant} /></div>
                <div className="mt-4"><AmountPad value={montant} onChange={setMontant} max={10_000_000} /></div>
              </section>
            ) : (
              <label className="block bg-white rounded-3xl shadow-sm p-4">
                <span className="text-sm font-semibold text-neutral-700">Minimum par cotisation (facultatif)</span>
                <input value={minimum} onChange={(e) => setMinimum(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="1000"
                  className="mt-2 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
              </label>
            )}

            <section className="bg-white rounded-3xl shadow-sm p-4">
              <p className="text-sm font-semibold text-neutral-700">{isEvent ? 'Rappels' : 'Rythme'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {frequences.map((f) => (
                  <button key={f} aria-pressed={frequence === f} onClick={() => setFrequence(f)}
                    className={clsx('h-11 px-4 rounded-full text-sm font-semibold', frequence === f ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-700')}>
                    {capital(rythmeCourt(f))}
                  </button>
                ))}
              </div>
            </section>

            {isEvent && (
              <section className="bg-white rounded-3xl shadow-sm p-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-700">Début</span>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 w-full h-12 px-3 rounded-2xl bg-neutral-100 text-[16px]" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-700">Événement</span>
                  <input type="date" value={dateEvenement} min={dateDebut} onChange={(e) => setDateEvenement(e.target.value)} className="mt-1 w-full h-12 px-3 rounded-2xl bg-neutral-100 text-[16px]" />
                </label>
              </section>
            )}
          </div>
        )}

        {etape === 3 && (
          <div className="space-y-4">
            <h2 className="text-center text-[22px] font-bold text-neutral-900">Combien de membres ?</h2>
            <section className="bg-white rounded-3xl shadow-sm p-5">
              <Stepper value={membres} min={2} max={100} onChange={setMembres} label="membres" />
            </section>
            <label className="block bg-white rounded-3xl shadow-sm p-4">
              <span className="text-sm font-semibold text-neutral-700">Date de début</span>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px]" />
            </label>

            <section className="bg-white rounded-3xl shadow-sm">
              <button onClick={() => setOptionsOpen((v) => !v)} aria-expanded={optionsOpen} className="w-full h-14 px-4 flex items-center justify-between text-left font-medium text-neutral-800">
                Plus d'options <ChevronDown size={18} className={optionsOpen ? 'rotate-180 transition' : 'transition'} />
              </button>
              {optionsOpen && (
                <div className="px-4 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Gagnants par tour</p>
                    <div className="mt-2"><Stepper value={gagnants} min={1} max={Math.max(1, membres - 1)} onChange={setGagnants} label={gagnants > 1 ? 'gagnants' : 'gagnant'} small /></div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Ordre des gagnants</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ordres.map((o) => (
                        <button key={o} aria-pressed={ordre === o} onClick={() => setOrdre(o)}
                          className={clsx('h-11 px-4 rounded-full text-sm font-semibold', ordre === o ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-700')}>
                          {ORDRE_LABEL[o] ?? o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Tours</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[[ModeCycle.AUTOMATIQUE, 'Automatiques'], [ModeCycle.MANUEL, 'Je les démarre']].map(([m, l]) => (
                        <button key={m} aria-pressed={modeCycle === m} onClick={() => setModeCycle(m as ModeCycle)}
                          className={clsx('h-11 rounded-full text-sm font-semibold', modeCycle === m ? 'bg-primary-700 text-white' : 'bg-neutral-100 text-neutral-700')}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-sm font-semibold text-neutral-700">Description (facultatif)</span>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={2}
                      className="mt-1 w-full px-4 py-3 rounded-2xl bg-neutral-100 text-[16px] resize-none" />
                  </label>
                </div>
              )}
            </section>
          </div>
        )}

        {etape === 4 && (
          <div className="space-y-4">
            <h2 className="text-center text-[22px] font-bold text-neutral-900">Récapitulatif</h2>
            <section className="bg-white rounded-3xl shadow-sm p-5">
              <p className="text-[17px] leading-relaxed text-neutral-900">
                {isEvent ? (
                  <>
                    Chacun cotise <b>{montantLibre ? (Number(minimum) > 0 ? `librement (minimum ${formatF(Number(minimum))})` : 'librement') : `${formatF(montant)} par ${rythme}`}</b> jusqu'au <b>{formatDateCourte(dateEvenement)}</b>.
                    La cagnotte est partagée entre tous à la fin.
                  </>
                ) : (
                  <>
                    <b>{membres} membres</b> cotisent <b>{formatF(montant)}</b> par {rythme}. Chaque {rythme}, <b>{gagnants} membre{gagnants > 1 ? 's' : ''}</b> reçoi{gagnants > 1 ? 'vent' : 't'} <b>{formatF(jackpot)}</b>.
                  </>
                )}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Début le {formatDateCourte(dateDebut)}
                {!isEvent && ` · ${ORDRE_LABEL[ordre] ?? ordre} · tours ${modeCycle === ModeCycle.MANUEL ? 'démarrés par vous' : 'automatiques'}`}
              </p>
            </section>
            <label className="block bg-white rounded-3xl shadow-sm p-4">
              <span className="text-sm font-semibold text-neutral-700">Nom de la tontine</span>
              <input value={nom} onChange={(e) => setNom(e.target.value.slice(0, 150))} autoComplete="off"
                className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
            </label>
          </div>
        )}

        {error && <p role="alert" className="mt-4 px-1 text-sm font-medium text-red-700">{error}</p>}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-[#f2f3f5]/95 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto">
          {etape === 4 ? (
            <button onClick={creerTontine} disabled={!online || isPending} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
              {isPending ? 'Création…' : !online ? 'Connexion requise' : 'Créer la tontine'}
            </button>
          ) : (
            <button onClick={suivant} disabled={etape === 1 && !objectif} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
              Continuer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
