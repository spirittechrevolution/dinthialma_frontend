/**
 * B3 — Encaisser, version web (≥ 1024 px) : tout tient sur un écran.
 *
 * À gauche : recherche + onglets « À encaisser » / « Déjà payé » + liste qui défile à l'intérieur
 * (↑ ↓ pour parcourir depuis la recherche, Entrée pour choisir).
 * À droite : formulaire compact (montant au clavier, moyens sur une ligne, référence et note visibles),
 * bouton « Encaisser » toujours visible en bas du panneau. Entrée valide le formulaire.
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { ArrowLeft, Search, ChevronRight, PartyPopper, MousePointerClick, X } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/Section'
import { PaymentMethodTiles } from '@/components/pay/PaymentMethodTiles'
import { METHODE_PAR_DEFAUT } from '@/lib/paymentMethods'
import { useAdminRecordCotisation } from '@/hooks/useCotisations'
import { useOnline } from '@/hooks/useOnline'
import { formatF } from '@/lib/format'
import { messageErreur } from '@/lib/apiError'
import { AccountStatus, CotisationStatut } from '@/types/common'
import type { CycleRecapLigne } from '@/types/cotisation'

interface EncaisserDesktopProps {
  tontineId: string
  tontineNom: string
  cycleId: string
  numeroCycle: number
  /** 0 = montant libre (à saisir) */
  montantDefaut: number
  lignes: CycleRecapLigne[]
  membreId: string | null
  onChoisir: (membreId: string) => void
  onFermer: () => void
}

type Onglet = 'aEncaisser' | 'paye'

const nomDe = (l: CycleRecapLigne) => `${l.firstName} ${l.lastName}`.trim()
const actif = (l: CycleRecapLigne) => l.statutCotisation === CotisationStatut.EN_ATTENTE || l.statutCotisation === CotisationStatut.VALIDE

export function EncaisserDesktop(p: EncaisserDesktopProps) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [onglet, setOnglet] = useState<Onglet>('aEncaisser')
  const [curseur, setCurseur] = useState(0)
  const listeRef = useRef<HTMLUListElement>(null)

  const filtre = (l: CycleRecapLigne) => {
    const s = q.trim().toLowerCase()
    return !s || nomDe(l).toLowerCase().includes(s) || (l.phone ?? '').includes(s.replace(/\s/g, ''))
  }
  const nonPayes = p.lignes.filter((l) => !actif(l))
  const payes = p.lignes.filter(actif)
  const visibles = (onglet === 'aEncaisser' ? nonPayes : payes).filter(filtre)
  const membre = p.membreId ? nonPayes.find((l) => l.membreId === p.membreId) : undefined
  const pct = p.lignes.length ? Math.round((payes.length / p.lignes.length) * 100) : 0

  useEffect(() => { setCurseur(0) }, [q, onglet])
  // Garde la ligne active visible pendant la navigation au clavier
  useEffect(() => {
    listeRef.current?.querySelector<HTMLElement>(`[data-index="${curseur}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [curseur])

  const ouvrir = (l: CycleRecapLigne) => {
    if (actif(l)) { if (l.cotisationId) navigate(`/recu/${p.tontineId}/${l.cotisationId}`) }
    else p.onChoisir(l.membreId)
  }
  const onKeyRecherche = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCurseur((c) => Math.min(c + 1, visibles.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCurseur((c) => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && visibles[curseur]) { e.preventDefault(); ouvrir(visibles[curseur]) }
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#f2f3f5]">
      {/* En-tête de page */}
      <header className="max-w-[1200px] w-full mx-auto px-8 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/accueil'))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-700 hover:bg-black/5"
          aria-label="Retour"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-bold text-neutral-900 leading-tight">Encaisser</h1>
          <p className="text-sm text-neutral-500 truncate">{p.tontineNom} · Tour {p.numeroCycle}</p>
        </div>
        <div className="w-64">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Ont payé</span>
            <span className="font-semibold text-neutral-900 tabular-nums">{payes.length} / {p.lignes.length}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuenow={payes.length} aria-valuemin={0} aria-valuemax={p.lignes.length}>
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {/* Deux panneaux à hauteur de l'écran */}
      <div className="flex-1 min-h-0 max-w-[1200px] w-full mx-auto px-8 pb-6 grid grid-cols-[minmax(320px,400px)_minmax(0,1fr)] gap-6">
        {/* Liste des membres */}
        <section className="bg-white rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 pb-3 space-y-3 border-b border-neutral-100">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyRecherche}
                placeholder="Nom ou numéro"
                aria-label="Chercher un membre (↑ ↓ pour parcourir, Entrée pour choisir)"
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-neutral-100 text-[15px] outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div role="tablist" className="grid grid-cols-2 rounded-full bg-neutral-100 p-1">
              {([['aEncaisser', `À encaisser (${nonPayes.length})`], ['paye', `Déjà payé (${payes.length})`]] as const).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={onglet === id}
                  onClick={() => setOnglet(id)}
                  className={clsx('h-9 rounded-full text-sm font-semibold', onglet === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ul ref={listeRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2" aria-label="Membres">
            {visibles.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-neutral-500">
                {q ? 'Aucun membre ne correspond.' : onglet === 'aEncaisser' ? 'Tout le monde a payé ce tour ✓' : 'Personne n\'a encore payé.'}
              </li>
            ) : visibles.map((l, i) => {
              const choisi = l.membreId === p.membreId
              const enAttente = l.statutCotisation === CotisationStatut.EN_ATTENTE
              const contenu = (
                <>
                  <InitialsAvatar name={nomDe(l) || '?'} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 truncate">{nomDe(l)}</span>
                    <span className="block text-xs text-neutral-500 truncate">
                      {onglet === 'paye'
                        ? (l.montant != null ? formatF(l.montant) : '')
                        : [l.ordreJackpot ? `N° ${l.ordreJackpot}` : null, l.accountStatus === AccountStatus.PRE_ENROLLED ? 'Sans compte' : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {onglet === 'paye' ? (
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs font-semibold', enAttente ? 'bg-amber-50 text-amber-800' : 'bg-primary-50 text-primary-800')}>
                      {enAttente ? 'À valider' : 'Payé ✓'}
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-neutral-300" />
                  )}
                </>
              )
              const cls = clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left',
                choisi ? 'bg-primary-50 ring-1 ring-primary-200' : i === curseur ? 'bg-neutral-100' : 'hover:bg-neutral-50',
              )
              return (
                <li key={l.membreId} data-index={i}>
                  {onglet === 'paye' && l.cotisationId ? (
                    <Link to={`/recu/${p.tontineId}/${l.cotisationId}`} className={cls}>{contenu}</Link>
                  ) : (
                    <button onClick={() => ouvrir(l)} aria-current={choisi ? 'true' : undefined} className={cls}>{contenu}</button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* Formulaire */}
        <section className="bg-white rounded-3xl shadow-sm flex flex-col min-h-0 overflow-hidden">
          {membre ? (
            <FormulaireEncaissement key={membre.membreId} {...p} membre={membre} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center">
                {nonPayes.length === 0 ? <PartyPopper size={26} /> : <MousePointerClick size={26} />}
              </span>
              <p className="mt-3 text-lg font-bold text-neutral-900">{nonPayes.length === 0 ? 'Tout le monde a payé ce tour ✓' : 'Choisissez un membre'}</p>
              <p className="mt-1 text-sm text-neutral-500 max-w-xs">
                {nonPayes.length === 0 ? 'Il n\'y a rien à encaisser.' : 'Cliquez sur un membre à gauche, ou tapez son nom puis Entrée.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function FormulaireEncaissement({ tontineId, cycleId, numeroCycle, montantDefaut, membre, onFermer }: EncaisserDesktopProps & { membre: CycleRecapLigne }) {
  const navigate = useNavigate()
  const online = useOnline()
  const { mutate: encaisser, isPending } = useAdminRecordCotisation()
  const [saisie, setSaisie] = useState(montantDefaut ? String(montantDefaut) : '')
  const [methode, setMethode] = useState(METHODE_PAR_DEFAUT)
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const montantRef = useRef<HTMLInputElement>(null)
  const nom = nomDe(membre)
  const montant = Number(saisie.replace(/\D/g, '')) || 0
  const affiche = useMemo(() => (saisie ? Number(saisie.replace(/\D/g, '')).toLocaleString('fr-FR').replace(/ | /g, ' ') : ''), [saisie])

  // Le montant est prêt à être corrigé dès l'ouverture
  useEffect(() => { montantRef.current?.focus(); montantRef.current?.select() }, [])

  const confirmer = (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (montant <= 0) { setError('Saisissez un montant.'); montantRef.current?.focus(); return }
    encaisser(
      {
        tontineId,
        request: {
          membreId: membre.membreId,
          cycleId,
          montant,
          methodePaiement: methode,
          referenceTransaction: reference.trim() || undefined,
          note: note.trim() || undefined,
        },
      },
      {
        onSuccess: (cot) => navigate(`/recu/${tontineId}/${cot.id}`, { replace: true, state: { justCreated: true } }),
        onError: (err) => setError(messageErreur(err, "L'encaissement n'a pas pu être enregistré. Réessayez.")),
      },
    )
  }

  const champ = 'w-full h-11 px-4 rounded-2xl bg-neutral-100 text-[15px] outline-none focus:ring-2 focus:ring-primary-600'

  return (
    <form onSubmit={confirmer} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Membre */}
        <div className="flex items-center gap-3">
          <InitialsAvatar name={nom} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-neutral-900 truncate">{nom}</p>
            <p className="text-sm text-neutral-500">
              Tour {numeroCycle}{membre.ordreJackpot ? ` · N° ${membre.ordreJackpot}` : ''}{membre.accountStatus === AccountStatus.PRE_ENROLLED ? ' · Sans compte' : ''}
            </p>
          </div>
          <button type="button" onClick={onFermer} className="h-10 px-3 rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 inline-flex items-center gap-1.5">
            <X size={15} /> Changer
          </button>
        </div>

        {/* Montant */}
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Montant</span>
          <span className="mt-2 flex items-center gap-3 rounded-2xl bg-neutral-100 px-5 focus-within:ring-2 focus-within:ring-primary-600">
            <input
              ref={montantRef}
              value={affiche}
              onChange={(e) => setSaisie(e.target.value.replace(/\D/g, '').slice(0, 9))}
              inputMode="numeric"
              placeholder="0"
              aria-label="Montant encaissé en francs CFA"
              className="flex-1 min-w-0 h-16 bg-transparent text-[34px] font-extrabold tabular-nums text-neutral-900 outline-none"
            />
            <span className="text-2xl font-bold text-neutral-400">F</span>
          </span>
          {montantDefaut > 0 && montant !== montantDefaut && (
            <button type="button" onClick={() => setSaisie(String(montantDefaut))} className="mt-2 text-sm font-semibold text-primary-700 hover:underline">
              Remettre le montant prévu ({formatF(montantDefaut)})
            </button>
          )}
        </label>

        {/* Moyen */}
        <PaymentMethodTiles value={methode} onChange={setMethode} compact />

        {/* Référence et note */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Référence <span className="font-normal text-neutral-400">(facultatif)</span></span>
            <input value={reference} onChange={(e) => setReference(e.target.value.slice(0, 30))} className={clsx(champ, 'mt-2')} />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">Note <span className="font-normal text-neutral-400">(facultatif)</span></span>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} className={clsx(champ, 'mt-2')} />
          </label>
        </div>
      </div>

      {/* Bouton toujours visible */}
      <div className="border-t border-neutral-100 px-6 py-4 flex items-center gap-4">
        <p className="flex-1 min-w-0 text-sm text-neutral-500">
          {error ? <span role="alert" className="font-medium text-red-700">{error}</span> : <>Le paiement sera validé et {membre.firstName} sera prévenu.</>}
        </p>
        <button
          type="submit"
          disabled={!online || isPending || montant <= 0}
          className="h-12 px-8 rounded-full bg-primary-700 text-white text-[16px] font-bold hover:bg-primary-800 active:scale-[0.98] transition disabled:opacity-50"
        >
          {isPending ? 'Enregistrement…' : !online ? 'Connexion requise' : `Encaisser ${montant ? formatF(montant) : ''}`}
        </button>
      </div>
    </form>
  )
}
