/**
 * T1 — Mes tontines (gabarit « catalogue » de Wave) : recherche, favoris, sections
 * En tant que gestionnaire · En tant que membre · Terminées. Remplace les listes gestionnaire et membre.
 * ?section=gere|cotise : met la section du mode de l'accueil en premier.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { Search, Plus, Star, ChevronRight, ChevronDown, RotateCw, Wallet, PartyPopper } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { useMesTontines, useGestionSummary, useCotisantSummary } from '@/hooks/useMe'
import { useFavoris } from '@/hooks/useFavoris'
import { useMesDemandes } from '@/hooks/useQr'
import { useDemandeCiblee } from '@/hooks/useDemandeCiblee'
import { formatF } from '@/lib/format'
import { rythmeCourt } from '@/lib/tontineLabels'
import { TontineStatut } from '@/types/common'
import { jeCotise, jeGere, type MaTontine } from '@/types/me'

const STATUT_LABEL: Partial<Record<TontineStatut, string>> = {
  BROUILLON: 'Brouillon',
  SUSPENDUE: 'Suspendue',
  TERMINEE: 'Terminée',
}

export function MesTontinesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const sectionPrioritaire = params.get('section')
  const bienvenue = !!(location.state as { welcomeActivated?: boolean } | null)?.welcomeActivated
  const { data, isLoading, isError, refetch } = useMesTontines()
  const tontines = (data ?? []).filter((t) => t.monRole !== 'LECTURE')
  const gestion = useGestionSummary(tontines.some(jeGere))
  const cotisant = useCotisantSummary(tontines.some(jeCotise))
  const { favoris, estFavori, basculer } = useFavoris()
  const { data: mesDemandes } = useMesDemandes()
  const demandesVisibles = (mesDemandes ?? []).filter((d) => d.statut !== 'ACCEPTEE')
  const demandeCiblee = useDemandeCiblee(demandesVisibles.length > 0)
  const [q, setQ] = useState('')
  const [terminéesOuvertes, setTerminéesOuvertes] = useState(false)

  const aValider = (id: string) => {
    const t = gestion.data?.tontines.find((x) => x.tontineId === id)
    return t ? t.cotisationsEnAttente + t.demandesEnAttente : 0
  }
  const aPayer = (id: string) => cotisant.data?.tontines.find((t) => t.tontineId === id)?.cotisationDue?.statut === 'A_PAYER'

  const filtre = (t: MaTontine) => !q.trim() || t.nom.toLowerCase().includes(q.trim().toLowerCase())
  const visibles = tontines.filter(filtre)
  const actives = visibles.filter((t) => t.statut !== TontineStatut.TERMINEE)
  const fav = visibles.filter((t) => favoris.includes(t.id))
  const gere = actives.filter(jeGere)
  const cotise = actives.filter((t) => t.monRole === 'MEMBRE')
  const terminees = visibles.filter((t) => t.statut === TontineStatut.TERMINEE)

  const sectionGere = { id: 'gere', titre: 'En tant que gestionnaire', items: gere }
  const sectionCotise = { id: 'cotise', titre: 'En tant que membre', items: cotise }
  const sections = sectionPrioritaire === 'cotise' ? [sectionCotise, sectionGere] : [sectionGere, sectionCotise]

  const ligne = (t: MaTontine) => {
    const n = jeGere(t) ? aValider(t.id) : 0
    const payer = jeCotise(t) && aPayer(t.id)
    return (
      <li key={t.id} className="flex items-center">
        <Link to={`/tontine/${t.id}`} className="flex flex-1 min-w-0 items-center gap-3 pl-4 py-3 min-h-[68px]">
          <InitialsAvatar name={t.nom} size={44} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900 truncate">{t.nom}</span>
              {STATUT_LABEL[t.statut] && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{STATUT_LABEL[t.statut]}</span>}
            </span>
            <span className="block text-sm text-neutral-500 truncate">
              {t.montantLibre ? 'Montant libre' : `${formatF(t.montant)} / ${rythmeCourt(t.frequence)}`} · {t.nombreMembresActuels}{t.nombreMembres ? `/${t.nombreMembres}` : ''} membres
            </span>
            {(n > 0 || payer) && (
              <span className="mt-1 flex gap-1">
                {n > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{n} à valider</span>}
                {payer && <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-800">À payer</span>}
              </span>
            )}
          </span>
          <ChevronRight size={18} className="text-neutral-300" />
        </Link>
        <button
          onClick={() => basculer(t.id)}
          aria-pressed={estFavori(t.id)}
          aria-label={estFavori(t.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="w-12 h-12 mr-1 flex items-center justify-center"
        >
          <Star size={20} className={estFavori(t.id) ? 'fill-yellow-400 text-yellow-500' : 'text-neutral-300'} />
        </button>
      </li>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader
        title="Mes tontines"
        onBack={() => navigate('/accueil')}
        right={
          <button onClick={() => navigate('/creer')} className="h-11 px-4 mr-1 rounded-full bg-primary-700 text-white text-sm font-bold inline-flex items-center gap-1.5">
            <Plus size={16} /> Créer
          </button>
        }
      />
      <main className="px-4 pb-10 max-w-lg mx-auto md:max-w-3xl space-y-5">
        {bienvenue && (
          <div role="status" className="rounded-3xl bg-primary-50 p-4 flex gap-3">
            <PartyPopper size={22} className="text-primary-700 flex-shrink-0" />
            <p className="text-primary-900"><b>Votre compte est activé !</b><br />Vous êtes déjà membre d'une tontine.</p>
          </div>
        )}

        {demandesVisibles.length > 0 && (
          <section>
            <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">Mes demandes</h2>
            <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
              {demandesVisibles.map((d) => (
                <li key={d.id} id={`demande-${d.id}`} className={clsx('flex items-center gap-3 px-4 py-3 min-h-[60px]', demandeCiblee === d.id && 'bg-primary-50')}>
                  <InitialsAvatar name={d.tontineNom} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 truncate">{d.tontineNom}</span>
                    {d.statut === 'REFUSEE' && d.motifRefus && <span className="block text-sm text-neutral-500 truncate">{d.motifRefus}</span>}
                  </span>
                  <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', d.statut === 'REFUSEE' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800')}>
                    {d.statut === 'REFUSEE' ? 'Refusée' : 'En attente'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tontines.length > 6 && (
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher une tontine"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white shadow-sm text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[68px] rounded-2xl bg-white animate-pulse" />)}</div>
        ) : isError ? (
          <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-sm text-neutral-600">Impossible de charger vos tontines.</p>
            <button onClick={() => refetch()} className="mt-3 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          </section>
        ) : tontines.length === 0 ? (
          <section className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><Wallet size={26} /></span>
            <p className="mt-3 text-lg font-bold text-neutral-900">Aucune tontine</p>
            <p className="mt-1 text-sm text-neutral-500">Créez la vôtre, ou montrez votre QR à un gestionnaire pour qu'il vous ajoute.</p>
            <button onClick={() => navigate('/creer')} className="mt-4 h-12 px-5 rounded-full bg-primary-700 text-white font-bold">Créer une tontine</button>
          </section>
        ) : (
          <>
            {fav.length > 0 && (
              <section>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">Favoris</h2>
                <div className="bg-white rounded-3xl shadow-sm p-3 grid grid-cols-4 gap-y-3">
                  {fav.map((t) => (
                    <Link key={t.id} to={`/tontine/${t.id}`} className="flex flex-col items-center gap-1.5 min-w-0">
                      <InitialsAvatar name={t.nom} size={56} />
                      <span className="text-[13px] font-medium text-neutral-800 text-center leading-tight line-clamp-2 px-0.5">{t.nom}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {sections.map((s) => s.items.length > 0 && (
              <section key={s.id}>
                <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">{s.titre} ({s.items.length})</h2>
                <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
                  {s.items.map(ligne)}
                </ul>
              </section>
            ))}

            {terminees.length > 0 && (
              <section>
                <button onClick={() => setTerminéesOuvertes((v) => !v)} aria-expanded={terminéesOuvertes}
                  className="w-full px-1 mb-2 flex items-center justify-between text-sm font-semibold text-neutral-500">
                  Terminées ({terminees.length}) <ChevronDown size={16} className={clsx('transition', terminéesOuvertes && 'rotate-180')} />
                </button>
                {terminéesOuvertes && (
                  <ul className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
                    {terminees.map(ligne)}
                  </ul>
                )}
              </section>
            )}

            {q && fav.length + gere.length + cotise.length + terminees.length === 0 && (
              <p className="text-center text-sm text-neutral-500">Aucune tontine ne correspond.</p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
