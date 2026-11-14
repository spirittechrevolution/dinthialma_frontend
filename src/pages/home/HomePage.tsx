/**
 * A1 — Accueil-hub (brief v2 « logique Wave »).
 *
 * Bandeau (réglages, alertes, bascule Je cotise / Je gère, filtre tontine, montant masquable),
 * carte QR, carte d'action unique, grille de 8 services, fil d'activité.
 * Les écrans pas encore refaits (listes de tontines, historique…) ouvrent provisoirement
 * les écrans existants ; il suffira de changer la destination dans `services`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Wallet, Trophy, History, Plus, Share2, Bell, MoreHorizontal, CreditCard,
  CheckCircle2, Users, RefreshCw, Clock, PartyPopper, UserCircle, Download, ListChecks, WifiOff,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useMesRoles, useCotisantSummary, useGestionSummary, useActivite } from '@/hooks/useMe'
import { useUnreadCount } from '@/hooks/useNotifications'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { useOnline } from '@/hooks/useOnline'
import { usePWA } from '@/hooks/usePWA'
import { HomeHeader } from '@/components/home/HomeHeader'
import { QrCard } from '@/components/home/QrCard'
import { ActionCard, ActionCardSkeleton } from '@/components/home/ActionCard'
import { ServiceGrid, type ServiceItem } from '@/components/home/ServiceGrid'
import { ActivityFeed } from '@/components/home/ActivityFeed'
import { HomeDesktop } from '@/components/home/HomeDesktop'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { TontinePickerSheet, MontantsSheet, PlusSheet, dueDetail, type PlusItem } from '@/components/home/HomeSheets'
import { formatF, safeGet } from '@/lib/format'
import { INVITATION_EN_ATTENTE_KEY } from '@/lib/share'
import { useMonQr, useInvitationTontine } from '@/hooks/useQr'
import { parseApiError } from '@/lib/apiError'
import { TontineStatut } from '@/types/common'
import { PREF_KEYS } from '@/lib/preferences'
import { jeCotise, jeGere, type ActiviteItem, type ModeAccueil } from '@/types/me'

const MODES = ['COTISE', 'GERE'] as const

export function HomePage() {
  const navigate = useNavigate()
  const online = useOnline()
  const desktop = useIsDesktop()
  const { user } = useAuth()
  const { canInstall, triggerInstall } = usePWA()
  const { data: unread = 0 } = useUnreadCount()

  // ─── Rôles et préférences ────────────────────────────────────────────────
  const roles = useMesRoles()
  const [savedMode, setSavedMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', MODES)
  const [hiddenPref, setHiddenPref] = useLocalPreference<'0' | '1'>('dinthialma_hide_amount', '0', ['0', '1'] as const)
  // Dernière tontine choisie côté Gestionnaire (préférence synchronisée avec le serveur, B22)
  const [derniereGeree, setDerniereGeree] = useLocalPreference<string>(PREF_KEYS.derniereTontineGeree, '')
  const hidden = hiddenPref === '1'

  // Mode effectif : on respecte le choix mémorisé seulement s'il est possible
  const mode: ModeAccueil = roles.deuxModes ? savedMode : roles.gere ? 'GERE' : 'COTISE'
  const [tontineId, setTontineId] = useState<string | null>(null)
  useEffect(() => { setTontineId(null) }, [mode])

  // Invitation ouverte avant connexion (page /q/t/…) : on la rouvre une fois connecté
  useEffect(() => {
    const enAttente = safeGet(INVITATION_EN_ATTENTE_KEY)
    if (enAttente) {
      try { localStorage.removeItem(INVITATION_EN_ATTENTE_KEY) } catch { /* ignore */ }
      navigate(enAttente, { replace: true })
    }
  }, [navigate])

  // ─── Données ─────────────────────────────────────────────────────────────
  const cotisant = useCotisantSummary(roles.cotise)
  const gestion = useGestionSummary(roles.gere)
  const activite = useActivite(mode, { tontineId: tontineId ?? undefined })

  const tontinesDuMode = roles.tontines.filter((t) => (mode === 'GERE' ? jeGere(t) : jeCotise(t)))
  const tontineChoisie = tontinesDuMode.find((t) => t.id === tontineId) ?? null

  // Gestionnaire : pas d'option « Toutes mes tontines ». Par défaut : la dernière tontine choisie si je la gère
  // toujours, sinon la première tontine ouverte (brouillon ou active : celles qui ont un QR d'invitation),
  // sinon la première de la liste.
  const tontineGereeParDefaut =
    (mode === 'GERE' ? tontinesDuMode.find((t) => t.id === derniereGeree) : undefined)
    ?? tontinesDuMode.find((t) => t.statut === TontineStatut.ACTIVE || t.statut === TontineStatut.BROUILLON)
    ?? tontinesDuMode[0]
  useEffect(() => {
    if (mode === 'GERE' && !tontineChoisie && tontineGereeParDefaut) setTontineId(tontineGereeParDefaut.id)
  }, [mode, tontineChoisie, tontineGereeParDefaut])
  // Préférence arrivée du serveur après l'affichage (autre appareil) : on la suit,
  // sauf si l'utilisateur a déjà choisi une tontine lui-même pendant cette visite
  const choixManuel = useRef(false)
  useEffect(() => {
    if (mode !== 'GERE' || choixManuel.current || !derniereGeree || derniereGeree === tontineId) return
    if (tontinesDuMode.some((t) => t.id === derniereGeree)) setTontineId(derniereGeree)
  }, [mode, derniereGeree, tontineId, tontinesDuMode])
  const nouvelInscrit = !roles.isLoading && roles.tontines.length === 0

  // ─── Feuilles et modales ─────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false)
  const [montantsOpen, setMontantsOpen] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)
  const [payPickerOpen, setPayPickerOpen] = useState(false)
  /** Membres / Tours en mode « Toutes » : choisir la tontine d'abord */
  const [rubriqueCible, setRubriqueCible] = useState<'membres' | 'tours' | null>(null)

  const openPay = (id?: string | null) => navigate(id ? `/payer/${id}` : '/payer')

  // ─── Montant du bandeau ──────────────────────────────────────────────────
  const { amount, amountLoading } = useMemo(() => {
    if (mode === 'GERE') {
      const g = gestion.data
      const v = tontineId
        ? g?.tontines.find((t) => t.tontineId === tontineId)?.cycleEnCours?.montantCollecte ?? 0
        : g?.totalCollecteToursEnCours ?? 0
      return { amount: v, amountLoading: gestion.isLoading }
    }
    const c = cotisant.data
    const v = tontineId
      ? c?.tontines.find((t) => t.tontineId === tontineId)?.totalCotiseValide ?? 0
      : c?.totalCotiseValide ?? 0
    return { amount: v, amountLoading: roles.cotise && (cotisant.isLoading || roles.isLoading) }
  }, [mode, tontineId, gestion.data, gestion.isLoading, cotisant.data, cotisant.isLoading, roles.cotise, roles.isLoading])

  // Pastilles de la bascule : ce qui attend dans l'autre mode
  const aValiderTotal = (gestion.data?.totalCotisationsEnAttente ?? 0) + (gestion.data?.totalDemandesEnAttente ?? 0)
  const aPayerTotal = cotisant.data?.aPayer.length ?? 0

  // ─── Carte d'action (une seule, la plus urgente) ─────────────────────────
  const offlineReason = online ? undefined : 'Connexion requise'
  let actionCard: JSX.Element | null
  /** Desktop : la carte n'apparaît que s'il y a une action à faire (les chiffres clés disent déjà « tout est à jour ») */
  let actionAFaire = true
  if (roles.isLoading || (mode === 'COTISE' && roles.cotise && cotisant.isLoading) || (mode === 'GERE' && gestion.isLoading)) {
    actionCard = <ActionCardSkeleton />
    actionAFaire = false
  } else if (nouvelInscrit) {
    actionCard = (
      <ActionCard
        icon={<Plus size={22} />} tone="ok"
        title="Créer ma première tontine"
        subtitle="Invité par un proche ? Montrez-lui votre QR."
        actionLabel="Créer" onAction={() => navigate('/creer')}
        disabled={!online} disabledReason={offlineReason}
      />
    )
  } else if (mode === 'GERE') {
    const lignes = (gestion.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
    const aValider = lignes.reduce((s, t) => s + t.cotisationsEnAttente, 0)
    // Les membres qui n'ont pas encore payé ne s'affichent plus ici : le gestionnaire est prévenu
    // par une notification (COTISATIONS_MANQUANTES, in-app et push), voir B26 / B31.

    const demandes = lignes.reduce((s, t) => s + t.demandesEnAttente, 0)

    if (aValider > 0) {
      const cible = lignes.filter((t) => t.cotisationsEnAttente > 0)
      actionCard = (
        <ActionCard
          icon={<CheckCircle2 size={22} />} tone="urgent"
          title={`${aValider} paiement${aValider > 1 ? 's' : ''} à valider`}
          subtitle={cible.length === 1 ? cible[0].nom : `${cible.length} tontines`}
          actionLabel="Valider"
          onAction={() => navigate(cible.length === 1 ? `/a-valider?tontine=${cible[0].tontineId}` : '/a-valider')}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else if (demandes > 0) {
      const cible = lignes.filter((t) => t.demandesEnAttente > 0)
      actionCard = (
        <ActionCard
          icon={<UserPlus size={22} />} tone="urgent"
          title={`${demandes} demande${demandes > 1 ? 's' : ''} d'adhésion`}
          subtitle={cible.length === 1 ? cible[0].nom : `${cible.length} tontines`}
          actionLabel="Voir"
          onAction={() => navigate(cible.length === 1 ? `/a-valider?tontine=${cible[0].tontineId}` : '/a-valider')}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else {
      // Rien à valider : pas de carte (l'accueil reste épuré)
      actionCard = null
    }
  } else {
    const dues = (cotisant.data?.aPayer ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
    const enAttente = (cotisant.data?.tontines ?? [])
      .filter((t) => (!tontineId || t.tontineId === tontineId) && t.cotisationDue?.statut === 'EN_ATTENTE')
    if (dues.length === 1) {
      const d = dues[0]
      const due = d.cotisationDue!
      actionCard = (
        <ActionCard
          icon={<Send size={22} />} tone="urgent"
          title={due.montantLibre && due.montant == null ? 'Cotisation à payer' : `À payer ${formatF(due.montant)}`}
          subtitle={`${d.nom} · ${dueDetail(due.dateLimite)}`}
          actionLabel="Payer" onAction={() => openPay(d.tontineId)}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else if (dues.length > 1) {
      actionCard = (
        <ActionCard
          icon={<Send size={22} />} tone="urgent"
          title={`${dues.length} cotisations à payer`}
          subtitle={`La plus proche : ${dues[0].nom} · ${dueDetail(dues[0].cotisationDue?.dateLimite)}`}
          actionLabel="Payer" onAction={() => setPayPickerOpen(true)}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else if (enAttente.length > 0) {
      actionCard = <ActionCard icon={<Clock size={22} />} tone="neutral" title="Paiement en attente de validation" subtitle={enAttente.map((t) => t.nom).join(', ')} />
      actionAFaire = false
    } else {
      actionCard = <ActionCard icon={<PartyPopper size={22} />} tone="ok" title="Tout est à jour ✓" subtitle="Aucune cotisation à payer" />
      actionAFaire = false
    }
  }

  // ─── Carte QR ────────────────────────────────────────────────────────────
  const prenom = user?.firstName || ''
  const monQr = useMonQr(mode === 'COTISE')
  // Gestionnaire : QR d'invitation de la tontine choisie dans le filtre du bandeau
  const tontineQr = mode === 'GERE' ? tontineChoisie ?? tontineGereeParDefaut : undefined
  const invitation = useInvitationTontine(mode === 'GERE' ? tontineQr?.id : null)
  const invitationFermee = invitation.isError && parseApiError(invitation.error).code === 'TONTINE_NOT_OPEN'
  const qr = mode === 'GERE'
    ? {
        title: tontineQr ? `Inviter dans ${tontineQr.nom}` : 'Inviter dans une tontine',
        subtitle: invitationFermee
          ? 'Cette tontine est fermée : plus d\'invitation possible.'
          : invitation.isError
            ? 'QR indisponible pour le moment. Réessayez plus tard.'
            : 'Faites scanner ce QR pour rejoindre',
        url: tontineQr ? invitation.data?.url ?? null : null,
        loading: !!tontineQr && invitation.isLoading,
        shareText: tontineQr
          ? `Rejoins notre tontine ${tontineQr.nom} (${formatF(tontineQr.montant)}) :`
          : '',
      }
    : {
        title: 'Mon QR membre',
        subtitle: 'À montrer à votre gestionnaire',
        url: monQr.data?.url ?? null,
        loading: monQr.isLoading,
        shareText: `${prenom ? `${prenom} sur` : 'Retrouvez-moi sur'} Dinthialma :`,
      }

  // ─── Grille de services ──────────────────────────────────────────────────
  const ouvrirRubrique = (r: 'membres' | 'tours') => {
    const cible = tontineId ?? (tontinesDuMode.length === 1 ? tontinesDuMode[0].id : null)
    if (cible) navigate(`/tontine/${cible}/${r}`)
    else setRubriqueCible(r)
  }
  const inviter = () => navigate('/partager')

  const services: ServiceItem[] = mode === 'GERE'
    ? [
        { key: 'encaisser', label: 'Encaisser', icon: <CreditCard size={26} />, tone: 'green', to: tontineId ? `/encaisser/${tontineId}` : '/encaisser' },
        { key: 'valider', label: 'À valider', icon: <ListChecks size={26} />, tone: 'amber', to: tontineId ? `/a-valider?tontine=${tontineId}` : '/a-valider', badge: aValiderTotal },
        { key: 'historique', label: 'Historique', icon: <History size={26} />, tone: 'blue', to: tontineId ? `/historique?mode=GERE&tontine=${tontineId}` : '/historique?mode=GERE' },
        { key: 'membres', label: 'Membres', icon: <Users size={26} />, tone: 'violet', onClick: () => ouvrirRubrique('membres') },
        { key: 'tours', label: 'Tours', icon: <RefreshCw size={26} />, tone: 'teal', onClick: () => ouvrirRubrique('tours') },
        { key: 'creer', label: 'Créer', icon: <Plus size={26} />, tone: 'rose', to: '/creer' },
        { key: 'tontines', label: 'Mes tontines', icon: <Wallet size={26} />, tone: 'green', to: '/tontines?section=gere' },
        { key: 'plus', label: 'Plus', icon: <MoreHorizontal size={26} />, tone: 'neutral', onClick: () => setPlusOpen(true) },
      ]
    : [
        { key: 'payer', label: 'Payer', icon: <Send size={26} />, tone: 'green', onClick: () => (aPayerTotal > 1 && !tontineId ? setPayPickerOpen(true) : openPay(tontineId ?? cotisant.data?.aPayer[0]?.tontineId)) },
        { key: 'tontines', label: 'Tontines', icon: <Wallet size={26} />, tone: 'blue', to: '/tontines?section=cotise' },
        { key: 'jackpots', label: 'Jackpots', icon: <Trophy size={26} />, tone: 'amber', to: '/jackpots' },
        { key: 'historique', label: 'Historique', icon: <History size={26} />, tone: 'violet', to: tontineId ? `/historique?mode=COTISE&tontine=${tontineId}` : '/historique?mode=COTISE' },
        { key: 'creer', label: 'Créer', icon: <Plus size={26} />, tone: 'rose', to: '/creer' },
        { key: 'inviter', label: 'Inviter', icon: <Share2 size={26} />, tone: 'teal', onClick: inviter },
        { key: 'alertes', label: 'Alertes', icon: <Bell size={26} />, tone: 'green', to: '/notifications', badge: unread },
        { key: 'plus', label: 'Plus', icon: <MoreHorizontal size={26} />, tone: 'neutral', onClick: () => setPlusOpen(true) },
      ]

  const plusItems: PlusItem[] = [
    ...(mode === 'GERE'
      ? [
          { key: 'jackpots', label: 'Jackpots', icon: <Trophy size={22} />, to: '/jackpots' },
        ]
      : [{ key: 'alertes', label: 'Alertes', icon: <Bell size={22} />, to: '/notifications' }]),
    { key: 'profil', label: 'Paramètres', icon: <UserCircle size={22} />, to: '/parametres' },
    ...(canInstall ? [{ key: 'installer', label: 'Installer', icon: <Download size={22} />, onClick: triggerInstall }] : []),
  ]

  // ─── Navigation depuis le fil ────────────────────────────────────────────
  const openActivite = (it: ActiviteItem) => {
    if (it.cotisationId) navigate(`/recu/${it.tontineId}/${it.cotisationId}`)
    else navigate(`/tontine/${it.tontineId}`)
  }

  const filterOptions = tontinesDuMode.map((t) => ({ id: t.id, nom: t.nom, detail: `${formatF(t.montant)} · ${t.nombreMembresActuels} membres` }))
  const payOptions = (cotisant.data?.aPayer ?? []).map((t) => ({
    id: t.tontineId,
    nom: t.nom,
    detail: `${t.cotisationDue?.montant != null ? formatF(t.cotisationDue.montant) : 'Montant libre'} · ${dueDetail(t.cotisationDue?.dateLimite)}`,
  }))

  // ─── Desktop (≥ 1024 px) : tableau de bord web ───────────────────────────
  if (desktop) {
    return (
      <HomeDesktop
        prenom={prenom}
        online={online}
        mode={mode}
        onModeChange={setSavedMode}
        deuxModes={roles.deuxModes}
        pastilles={{ COTISE: aPayerTotal, GERE: aValiderTotal }}
        nouvelInscrit={nouvelInscrit}
        tontines={tontinesDuMode}
        tontineId={tontineId}
        onTontineChange={(id) => {
          setTontineId(id)
          if (mode === 'GERE' && id) { choixManuel.current = true; setDerniereGeree(id) }
        }}
        hidden={hidden}
        onToggleHidden={() => setHiddenPref(hidden ? '0' : '1')}
        cotisant={cotisant.data}
        gestion={gestion.data}
        chargement={roles.isLoading || (mode === 'GERE' ? gestion.isLoading : roles.cotise && cotisant.isLoading)}
        activite={{ items: activite.data, isLoading: activite.isLoading || roles.isLoading, isError: activite.isError, onRetry: () => activite.refetch() }}
        onOpenActivite={openActivite}
        actionCard={actionAFaire || nouvelInscrit ? actionCard : null}
        qr={qr}
        onPayer={() => (aPayerTotal > 1 && !tontineId ? navigate('/payer') : openPay(tontineId ?? cotisant.data?.aPayer[0]?.tontineId))}
        aPayerTotal={aPayerTotal}
        aValiderTotal={aValiderTotal}
      />
    )
  }

  // ─── Mobile / PWA / tablette : accueil-hub façon Wave ────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {!online && (
        <div role="status" className="sticky top-0 z-30 bg-neutral-900 text-white text-sm px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff size={16} /> Hors connexion · données de la dernière visite
        </div>
      )}

      {/* Mobile : une colonne. Tablette (md) : 2 colonnes. */}
      <div className="md:max-w-5xl md:mx-auto md:px-6 md:pt-6 md:grid md:grid-cols-2 md:gap-6 md:items-start">
        <div>
          <h1 className="sr-only">Accueil</h1>
          <HomeHeader
            mode={mode}
            onModeChange={setSavedMode}
            deuxModes={roles.deuxModes}
            pastilles={{ COTISE: aPayerTotal, GERE: aValiderTotal }}
            filterLabel={nouvelInscrit || tontinesDuMode.length < 2 ? null : tontineChoisie?.nom ?? (mode === 'GERE' ? tontineGereeParDefaut?.nom ?? null : 'Toutes mes tontines')}
            onOpenFilter={() => setFilterOpen(true)}
            amountLabel={mode === 'GERE' ? 'Collecté ce tour' : 'Total cotisé'}
            amount={amount}
            amountLoading={amountLoading}
            hidden={hidden}
            onToggleHidden={() => setHiddenPref(hidden ? '0' : '1')}
            onAmountClick={nouvelInscrit ? undefined : () => setMontantsOpen(true)}
            unread={unread}
          />

          <div className="px-4 -mt-10 space-y-4 md:px-0">
            <QrCard
              title={qr.title}
              subtitle={qr.subtitle}
              url={qr.url}
              shareText={qr.shareText}
              loading={qr.loading}
              shareLabel={mode === 'GERE' ? 'Inviter' : 'Partager'}
              onScan={() => navigate('/scanner')}
              onShare={mode === 'GERE' ? () => navigate(tontineQr ? `/partager?tontine=${tontineQr.id}` : '/partager') : undefined}
            />
            {actionCard}
            <ServiceGrid items={services} />
          </div>
        </div>

        <div className="px-4 mt-4 md:px-0 md:mt-0 min-w-0">
          {nouvelInscrit ? (
            <section className="bg-white rounded-3xl shadow-sm p-4">
              <h2 className="text-[17px] font-semibold text-neutral-900">Comment ça marche ?</h2>
              <ol className="mt-3 space-y-3 text-sm text-neutral-700">
                <li><b>1.</b> Créez une tontine ou faites-vous ajouter par un proche.</li>
                <li><b>2.</b> Cotisez à chaque tour.</li>
                <li><b>3.</b> Recevez le jackpot quand vient votre tour.</li>
              </ol>
            </section>
          ) : (
            <ActivityFeed
              mode={mode}
              items={activite.data}
              isLoading={activite.isLoading || roles.isLoading}
              isError={activite.isError}
              onRetry={() => activite.refetch()}
              onOpen={openActivite}
            />
          )}
        </div>

      </div>

      {/* Feuilles */}
      <TontinePickerSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Choisir une tontine"
        options={filterOptions}
        allowAll={mode !== 'GERE'}
        selectedId={tontineId}
        onSelect={(id) => {
          setTontineId(id)
          if (mode === 'GERE' && id) { choixManuel.current = true; setDerniereGeree(id) }
        }}
      />
      <TontinePickerSheet
        isOpen={rubriqueCible !== null}
        onClose={() => setRubriqueCible(null)}
        options={filterOptions}
        onSelect={(id) => { if (id && rubriqueCible) navigate(`/tontine/${id}/${rubriqueCible}`) }}
      />
      <TontinePickerSheet
        isOpen={payPickerOpen}
        onClose={() => setPayPickerOpen(false)}
        options={payOptions}
        onSelect={(id) => openPay(id)}
      />
      <MontantsSheet
        isOpen={montantsOpen}
        onClose={() => setMontantsOpen(false)}
        mode={mode}
        cotisant={cotisant.data}
        gestion={gestion.data}
        hidden={hidden}
      />
      <PlusSheet isOpen={plusOpen} onClose={() => setPlusOpen(false)} items={plusItems} />

    </div>
  )
}
