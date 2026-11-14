/**
 * A1 — Accueil, version web (≥ 1024 px).
 *
 * En-tête (bonjour, bascule Membre/Gestionnaire, tontine, œil, actions principales),
 * 4 chiffres clés, carte d'action (seulement s'il y a quelque chose à faire),
 * activité récente en tableau à gauche, mes tontines + QR compact à droite.
 * Pas de grille de services : la barre latérale joue ce rôle. Mêmes données que l'accueil mobile.
 */
import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import {
  Eye, EyeOff, CreditCard, ListChecks, Send, Wallet, Clock, Trophy, Users, CalendarClock,
  ArrowUpRight, RotateCw, Copy, Maximize2, UserPlus, Plus, AlertTriangle, WifiOff,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PageDesktop, EnTetePage, BoutonEnTete, CarteChiffre, CarteSection } from '@/components/desktop/DesktopUi'
import { HomeTontinesPanel } from '@/components/home/HomeTontinesPanel'
import { affichageActivite } from '@/components/home/ActivityFeed'
import { useMesJackpots } from '@/hooks/useMe'
import { formatF, formatDateCourte, formatDateHeure } from '@/lib/format'
import type { ActiviteItem, CotisantSummary, GestionSummary, MaTontine, ModeAccueil } from '@/types/me'

export interface HomeDesktopProps {
  prenom: string
  online: boolean
  mode: ModeAccueil
  onModeChange: (m: ModeAccueil) => void
  deuxModes: boolean
  pastilles: Record<ModeAccueil, number>
  nouvelInscrit: boolean
  tontines: MaTontine[]
  tontineId: string | null
  onTontineChange: (id: string | null) => void
  hidden: boolean
  onToggleHidden: () => void
  cotisant: CotisantSummary | undefined
  gestion: GestionSummary | undefined
  chargement: boolean
  activite: { items: ActiviteItem[] | undefined; isLoading: boolean; isError: boolean; onRetry: () => void }
  onOpenActivite: (it: ActiviteItem) => void
  /** Carte d'action calculée par l'accueil (null = rien à faire) */
  actionCard: JSX.Element | null
  qr: { title: string; subtitle: string; url: string | null; loading: boolean; shareText: string }
  onPayer: () => void
  aPayerTotal: number
  aValiderTotal: number
}

const joursRestants = (iso: string) => Math.ceil((new Date(iso).setHours(23, 59, 59) - Date.now()) / 86_400_000)

export function HomeDesktop(p: HomeDesktopProps) {
  const navigate = useNavigate()
  const gere = p.mode === 'GERE'
  const jackpots = useMesJackpots()
  const m = (v: number | null | undefined) => (p.hidden ? '••••••' : formatF(v ?? 0))

  // ─── Chiffres clés ───────────────────────────────────────────────────────
  let chiffres: ReactNode
  let alerteGagnant: { nom: string; id: string } | null = null
  if (gere) {
    const lignes = (p.gestion?.tontines ?? []).filter((t) => !p.tontineId || t.tontineId === p.tontineId)
    const avecTour = lignes.filter((t) => t.cycleEnCours)
    const collecte = avecTour.reduce((s, t) => s + (t.cycleEnCours?.montantCollecte ?? 0), 0)
    const attendu = avecTour.every((t) => t.cycleEnCours?.montantAttendu != null)
      ? avecTour.reduce((s, t) => s + (t.cycleEnCours?.montantAttendu ?? 0), 0)
      : null
    const ontPaye = avecTour.reduce((s, t) => s + (t.cycleEnCours?.membresAyantPaye ?? 0), 0)
    const actifs = avecTour.reduce((s, t) => s + (t.cycleEnCours?.membresActifs ?? 0), 0)
    const aValider = lignes.reduce((s, t) => s + t.cotisationsEnAttente + t.demandesEnAttente, 0)
    const pasPaye = avecTour.reduce((s, t) => {
      const c = t.cycleEnCours!
      return s + Math.max(0, c.membresActifs - c.membresAyantPaye - c.membresEnAttente)
    }, 0)
    const prochaineFin = [...avecTour].sort((a, b) => a.cycleEnCours!.dateFin.localeCompare(b.cycleEnCours!.dateFin))[0]
    const g = lignes.find((t) => t.gagnantsADesigner)
    if (g) alerteGagnant = { nom: g.nom, id: g.tontineId }
    const pct = actifs ? Math.round((ontPaye / actifs) * 100) : 0
    const encaisserVers = p.tontineId ? `/encaisser/${p.tontineId}` : '/encaisser'

    chiffres = (
      <>
        <CarteChiffre
          label="Collecté ce tour" icone={<Wallet size={18} />} ton="vert" chargement={p.chargement}
          valeur={m(collecte)} detail={attendu != null ? `sur ${m(attendu)} attendus` : avecTour.length ? undefined : 'Aucun tour en cours'}
        >
          {actifs > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <span className="block h-full rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-xs font-semibold text-neutral-600 tabular-nums">{ontPaye}/{actifs}</span>
            </div>
          )}
        </CarteChiffre>
        <CarteChiffre
          label="À valider" icone={<ListChecks size={18} />} ton={aValider ? 'ambre' : 'neutre'} chargement={p.chargement}
          valeur={aValider} detail={aValider ? 'Voir la file →' : 'Rien en attente'}
          to={p.tontineId ? `/a-valider?tontine=${p.tontineId}` : '/a-valider'}
        />
        <CarteChiffre
          label="Pas encore payé" icone={<Users size={18} />} ton={pasPaye ? 'rouge' : 'neutre'} chargement={p.chargement}
          valeur={`${pasPaye} membre${pasPaye > 1 ? 's' : ''}`} detail={pasPaye ? 'Encaisser →' : 'Tout le monde a payé'}
          to={avecTour.length ? encaisserVers : undefined}
        />
        <CarteChiffre
          label={prochaineFin ? `Fin du tour ${prochaineFin.cycleEnCours!.numeroCycle}` : 'Prochain tour'}
          icone={<CalendarClock size={18} />} chargement={p.chargement}
          valeur={prochaineFin ? formatDateCourte(prochaineFin.cycleEnCours!.dateFin) : '—'}
          detail={prochaineFin ? `${joursRestants(prochaineFin.cycleEnCours!.dateFin) > 0 ? `J-${joursRestants(prochaineFin.cycleEnCours!.dateFin)}` : 'Échéance dépassée'} · ${prochaineFin.nom}` : 'Aucun tour en cours'}
        />
      </>
    )
  } else {
    const lignes = (p.cotisant?.tontines ?? []).filter((t) => !p.tontineId || t.tontineId === p.tontineId)
    const prochain = (jackpots.data?.aVenir ?? []).find((j) => !p.tontineId || j.tontineId === p.tontineId)
    const enAttente = lignes.reduce((s, t) => s + t.totalEnAttente, 0)
    chiffres = (
      <>
        <CarteChiffre label="Total cotisé" icone={<Wallet size={18} />} ton="vert" chargement={p.chargement}
          valeur={m(lignes.reduce((s, t) => s + t.totalCotiseValide, 0))} detail="Paiements validés" />
        <CarteChiffre label="En attente" icone={<Clock size={18} />} ton={enAttente ? 'ambre' : 'neutre'} chargement={p.chargement}
          valeur={m(enAttente)} detail={enAttente ? 'En cours de validation' : 'Rien en attente'} />
        <CarteChiffre label="Jackpots reçus" icone={<Trophy size={18} />} ton="jaune" chargement={p.chargement}
          valeur={m(lignes.reduce((s, t) => s + t.totalJackpotsRecus, 0))} detail="Depuis le début" to="/jackpots" />
        <CarteChiffre label="Prochain jackpot" icone={<CalendarClock size={18} />} chargement={jackpots.isLoading}
          valeur={prochain?.montantEstime ? `≈ ${m(prochain.montantEstime)}` : '—'}
          detail={prochain ? prochain.tontineNom : 'Aucun jackpot à venir'} to="/jackpots" />
      </>
    )
  }

  // ─── En-tête ─────────────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const actions = (
    <>
      {p.deuxModes && (
        <div role="tablist" aria-label="Mode" className="flex rounded-full bg-white p-1 shadow-sm">
          {(['COTISE', 'GERE'] as const).map((md) => {
            const actif = p.mode === md
            const pastille = !actif ? p.pastilles[md] : 0
            return (
              <button key={md} role="tab" aria-selected={actif} onClick={() => p.onModeChange(md)}
                className={clsx('h-9 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-1.5', actif ? 'bg-primary-700 text-white' : 'text-neutral-600 hover:text-neutral-900')}>
                {md === 'GERE' ? 'Gestionnaire' : 'Membre'}
                {pastille > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">{pastille > 9 ? '9+' : pastille}</span>}
              </button>
            )
          })}
        </div>
      )}
      {!p.nouvelInscrit && p.tontines.length > 1 && (
        <select
          value={p.tontineId ?? ''}
          onChange={(e) => p.onTontineChange(e.target.value || null)}
          aria-label="Tontine affichée"
          className="h-11 pl-4 pr-9 rounded-full bg-white shadow-sm text-sm font-semibold text-neutral-800 outline-none focus:ring-2 focus:ring-primary-600 max-w-[16rem]"
        >
          {!gere && <option value="">Toutes mes tontines</option>}
          {p.tontines.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
      )}
      <button onClick={p.onToggleHidden} className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-600 hover:text-neutral-900"
        aria-label={p.hidden ? 'Afficher les montants' : 'Masquer les montants'} title={p.hidden ? 'Afficher les montants' : 'Masquer les montants'}>
        {p.hidden ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      {gere ? (
        <>
          <BoutonEnTete variante="secondaire" to={p.tontineId ? `/a-valider?tontine=${p.tontineId}` : '/a-valider'}>
            <ListChecks size={18} /> Valider{p.aValiderTotal ? ` (${p.aValiderTotal})` : ''}
          </BoutonEnTete>
          <BoutonEnTete to={p.tontineId ? `/encaisser/${p.tontineId}` : '/encaisser'} disabled={!p.online}>
            <CreditCard size={18} /> Encaisser
          </BoutonEnTete>
        </>
      ) : !p.nouvelInscrit && (
        <BoutonEnTete onClick={p.onPayer} disabled={!p.online || p.aPayerTotal === 0} title={p.aPayerTotal === 0 ? 'Aucune cotisation à payer' : undefined}>
          <Send size={18} /> Payer{p.aPayerTotal > 1 ? ` (${p.aPayerTotal})` : ''}
        </BoutonEnTete>
      )}
    </>
  )

  return (
    <PageDesktop>
      {!p.online && (
        <p role="status" className="mb-4 rounded-2xl bg-neutral-900 text-white text-sm px-4 py-2 flex items-center gap-2">
          <WifiOff size={16} /> Hors connexion · données de la dernière visite
        </p>
      )}
      <EnTetePage titre={`Bonjour${p.prenom ? ` ${p.prenom}` : ''}`} sousTitre={date.charAt(0).toUpperCase() + date.slice(1)} actions={actions} />

      {p.nouvelInscrit ? (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <div className="space-y-4">
            {p.actionCard}
            <CarteSection titre="Comment ça marche ?">
              <ol className="px-5 pb-5 grid grid-cols-3 gap-4 text-sm text-neutral-700">
                {[
                  [<Plus key="a" size={20} />, 'Créez une tontine ou faites-vous ajouter par un proche.'],
                  [<Send key="b" size={20} />, 'Cotisez à chaque tour.'],
                  [<Trophy key="c" size={20} />, 'Recevez le jackpot quand vient votre tour.'],
                ].map(([ic, txt], i) => (
                  <li key={i} className="rounded-2xl bg-neutral-50 p-4">
                    <span className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">{ic}</span>
                    <p className="mt-3"><b>{i + 1}.</b> {txt}</p>
                  </li>
                ))}
              </ol>
            </CarteSection>
          </div>
          <QrCompact {...p.qr} gere={false} onInviter={() => navigate('/partager')} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{chiffres}</div>

          {/* Une seule action, la plus urgente ; « Tout est à jour » reste discret */}
          {(p.actionCard || alerteGagnant) && (
            <div className="mt-4 space-y-3">
              {p.actionCard}
              {alerteGagnant && (
                <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0"><AlertTriangle size={22} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-neutral-900">Gagnant à désigner</p>
                    <p className="text-sm text-neutral-500 truncate">{alerteGagnant.nom} : un tour est terminé sans gagnant.</p>
                  </div>
                  <BoutonEnTete to={`/tontine/${alerteGagnant.id}/tours`}>Désigner</BoutonEnTete>
                </section>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <CarteSection titre="Activité récente" lien={{ to: `/historique?mode=${p.mode}${p.tontineId ? `&tontine=${p.tontineId}` : ''}` }}>
              <TableauActivite mode={p.mode} {...p.activite} onOpen={p.onOpenActivite} hidden={p.hidden} multiTontines={!p.tontineId && p.tontines.length > 1} />
            </CarteSection>

            <div className="space-y-4 min-w-0">
              <HomeTontinesPanel
                mode={p.mode} tontines={p.tontines} cotisant={p.cotisant} gestion={p.gestion}
                isLoading={p.chargement} selectedId={p.tontineId} hidden={p.hidden}
              />
              <QrCompact {...p.qr} gere={gere} onInviter={() => navigate(p.tontineId ? `/partager?tontine=${p.tontineId}` : '/partager')} />
            </div>
          </div>
        </>
      )}
    </PageDesktop>
  )
}

/** Activité récente en tableau (8 dernières lignes) */
function TableauActivite({ mode, items, isLoading, isError, onRetry, onOpen, hidden, multiTontines }: {
  mode: ModeAccueil
  items: ActiviteItem[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onOpen: (it: ActiviteItem) => void
  hidden: boolean
  multiTontines: boolean
}) {
  const th = 'px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'
  if (isLoading) {
    return <div className="px-5 pb-5 space-y-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-11 rounded-xl bg-neutral-100 animate-pulse" />)}</div>
  }
  if (isError) {
    return (
      <div className="px-5 pb-6 pt-2 text-center">
        <p className="text-sm text-neutral-600">Impossible de charger l'activité.</p>
        <button onClick={onRetry} className="mt-3 h-10 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={15} /> Réessayer</button>
      </div>
    )
  }
  if (!items?.length) {
    return (
      <div className="px-5 pb-8 pt-4 text-center">
        <span className="mx-auto w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center"><Clock size={22} /></span>
        <p className="mt-2 text-sm text-neutral-500">Aucune activité pour l'instant</p>
      </div>
    )
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-neutral-50 border-y border-neutral-100">
        <tr>
          <th className={th}>{mode === 'GERE' ? 'Membre' : 'Mouvement'}</th>
          {multiTontines && <th className={th}>Tontine</th>}
          <th className={th}>Date</th>
          <th className={`${th} text-right`}>Montant</th>
          <th className={th}>Statut</th>
        </tr>
      </thead>
      <tbody>
        {items.slice(0, 8).map((it) => {
          const { st, gain, libelle } = affichageActivite(it)
          return (
            <tr key={it.id} onClick={() => onOpen(it)} tabIndex={0} role="link"
              onKeyDown={(e) => { if (e.key === 'Enter') onOpen(it) }}
              className="border-t border-neutral-100 cursor-pointer hover:bg-neutral-50 focus-visible:outline-none focus-visible:bg-primary-50">
              <td className="px-5 py-3">
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={clsx('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', gain ? 'bg-yellow-50 text-yellow-700' : 'bg-neutral-100 text-neutral-600')}>
                    {gain ? <Trophy size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <span className="font-medium text-neutral-900 truncate">{mode === 'GERE' && it.membreNom ? it.membreNom : libelle}</span>
                </span>
              </td>
              {multiTontines && <td className="px-5 py-3 text-neutral-600 truncate max-w-[12rem]">{it.tontineNom}</td>}
              <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{formatDateHeure(it.date)}</td>
              <td className={clsx('px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap', gain ? 'text-primary-700' : 'text-neutral-900')}>
                {hidden ? '••••' : `${gain ? '+' : ''}${formatF(it.montant)}`}
              </td>
              <td className="px-5 py-3">
                {st.label && <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap', st.cls)}>{st.icon} {st.label}</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** QR compact : petit QR, agrandir, copier le lien (et inviter pour le gestionnaire) */
function QrCompact({ title, subtitle, url, loading, gere, onInviter }: {
  title: string; subtitle: string; url: string | null; loading: boolean; shareText: string; gere: boolean; onInviter: () => void
}) {
  const [grand, setGrand] = useState(false)
  const copier = async () => {
    if (!url) return
    try { await navigator.clipboard.writeText(url); toast.success('Lien copié') } catch { toast.error('Copie impossible') }
  }
  return (
    <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-4">
      {url ? (
        <button onClick={() => setGrand(true)} className="flex-shrink-0 rounded-xl border border-neutral-100 p-1.5 hover:border-neutral-300" aria-label="Agrandir le QR">
          <QRCodeSVG value={url} size={64} level="M" />
        </button>
      ) : (
        <span className={clsx('flex-shrink-0 w-[78px] h-[78px] rounded-xl flex items-center justify-center', loading ? 'bg-neutral-100 animate-pulse' : 'bg-primary-50 text-primary-700')}>
          {!loading && <UserPlus size={28} />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-900 truncate">{title}</p>
        <p className="text-xs text-neutral-500 line-clamp-2">{subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {url && (
            <>
              <button onClick={() => setGrand(true)} className="h-8 px-3 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 inline-flex items-center gap-1 hover:bg-neutral-200"><Maximize2 size={13} /> Afficher</button>
              <button onClick={copier} className="h-8 px-3 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700 inline-flex items-center gap-1 hover:bg-neutral-200"><Copy size={13} /> Copier le lien</button>
            </>
          )}
          {gere && (
            <button onClick={onInviter} className="h-8 px-3 rounded-full bg-primary-50 text-xs font-semibold text-primary-800 inline-flex items-center gap-1 hover:bg-primary-100"><UserPlus size={13} /> Inviter</button>
          )}
        </div>
      </div>
      {url && (
        <Modal isOpen={grand} onClose={() => setGrand(false)} title={title} size="sm">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-3xl bg-white p-4 border border-neutral-100"><QRCodeSVG value={url} size={240} level="M" /></div>
            <p className="text-sm text-neutral-500 text-center">{subtitle}</p>
            <button onClick={copier} className="w-full h-12 rounded-full bg-primary-700 text-white font-bold inline-flex items-center justify-center gap-2"><Copy size={18} /> Copier le lien</button>
          </div>
        </Modal>
      )}
    </section>
  )
}

