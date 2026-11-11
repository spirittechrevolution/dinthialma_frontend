/**
 * A1 — Accueil-hub (brief v2 « logique Wave »).
 *
 * Bandeau (réglages, alertes, bascule Je cotise / Je gère, filtre tontine, montant masquable),
 * carte QR, carte d'action unique, grille de 8 services, fil d'activité.
 * Les écrans pas encore refaits (Encaisser, À valider…) ouvrent provisoirement
 * les écrans existants ; il suffira de changer la destination dans `services`.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Wallet, Trophy, History, Plus, Share2, Bell, MoreHorizontal, CreditCard,
  CheckCircle2, Users, RefreshCw, Clock, PartyPopper, UserCircle, Download, ListChecks, WifiOff,
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
import { TontinePickerSheet, MontantsSheet, PlusSheet, dueDetail, type PlusItem } from '@/components/home/HomeSheets'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { formatF } from '@/lib/format'
import { appUrl, memberQrUrl, shareLink, tontineQrUrl } from '@/lib/share'
import { jeCotise, jeGere, type ActiviteItem, type ModeAccueil } from '@/types/me'

const MODES = ['COTISE', 'GERE'] as const

export function HomePage() {
  const navigate = useNavigate()
  const online = useOnline()
  const { user } = useAuth()
  const { canInstall, triggerInstall } = usePWA()
  const { data: unread = 0 } = useUnreadCount()

  // ─── Rôles et préférences ────────────────────────────────────────────────
  const roles = useMesRoles()
  const [savedMode, setSavedMode] = useLocalPreference<ModeAccueil>('dinthialma_home_mode', 'COTISE', MODES)
  const [hiddenPref, setHiddenPref] = useLocalPreference<'0' | '1'>('dinthialma_hide_amount', '0', ['0', '1'] as const)
  const hidden = hiddenPref === '1'

  // Mode effectif : on respecte le choix mémorisé seulement s'il est possible
  const mode: ModeAccueil = roles.deuxModes ? savedMode : roles.gere ? 'GERE' : 'COTISE'
  const [tontineId, setTontineId] = useState<string | null>(null)
  useEffect(() => { setTontineId(null) }, [mode])

  // ─── Données ─────────────────────────────────────────────────────────────
  const cotisant = useCotisantSummary(roles.cotise)
  const gestion = useGestionSummary(roles.gere)
  const activite = useActivite(mode, { tontineId: tontineId ?? undefined })

  const tontinesDuMode = roles.tontines.filter((t) => (mode === 'GERE' ? jeGere(t) : jeCotise(t)))
  const tontineChoisie = tontinesDuMode.find((t) => t.id === tontineId) ?? null
  const nouvelInscrit = !roles.isLoading && roles.tontines.length === 0

  // ─── Feuilles et modales ─────────────────────────────────────────────────
  const [filterOpen, setFilterOpen] = useState(false)
  const [montantsOpen, setMontantsOpen] = useState(false)
  const [plusOpen, setPlusOpen] = useState(false)
  const [payPickerOpen, setPayPickerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

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
  const aValiderTotal = gestion.data?.totalCotisationsEnAttente ?? 0
  const aPayerTotal = cotisant.data?.aPayer.length ?? 0

  // ─── Carte d'action (une seule, la plus urgente) ─────────────────────────
  const offlineReason = online ? undefined : 'Connexion requise'
  let actionCard: JSX.Element
  if (roles.isLoading || (mode === 'COTISE' && roles.cotise && cotisant.isLoading) || (mode === 'GERE' && gestion.isLoading)) {
    actionCard = <ActionCardSkeleton />
  } else if (nouvelInscrit) {
    actionCard = (
      <ActionCard
        icon={<Plus size={22} />} tone="ok"
        title="Créer ma première tontine"
        subtitle="Invité par un proche ? Montrez-lui votre QR."
        actionLabel="Créer" onAction={() => setCreateOpen(true)}
        disabled={!online} disabledReason={offlineReason}
      />
    )
  } else if (mode === 'GERE') {
    const lignes = (gestion.data?.tontines ?? []).filter((t) => !tontineId || t.tontineId === tontineId)
    const aValider = lignes.reduce((s, t) => s + t.cotisationsEnAttente, 0)
    const retard = lignes
      .filter((t) => t.cycleEnCours)
      .map((t) => ({ t, manquants: t.cycleEnCours!.membresActifs - t.cycleEnCours!.membresAyantDeclare }))
      .filter((x) => x.manquants > 0)
      .sort((a, b) => b.manquants - a.manquants)[0]

    if (aValider > 0) {
      const cible = lignes.filter((t) => t.cotisationsEnAttente > 0)
      actionCard = (
        <ActionCard
          icon={<CheckCircle2 size={22} />} tone="urgent"
          title={`${aValider} paiement${aValider > 1 ? 's' : ''} à valider`}
          subtitle={cible.length === 1 ? cible[0].nom : `${cible.length} tontines`}
          actionLabel="Valider"
          onAction={() => navigate('/admin/cotisations', { state: { tontineId: cible[0]?.tontineId } })}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else if (retard) {
      actionCard = (
        <ActionCard
          icon={<Clock size={22} />} tone="urgent"
          title={`${retard.manquants} n'${retard.manquants > 1 ? 'ont' : 'a'} pas payé`}
          subtitle={`${retard.t.nom} · Tour ${retard.t.cycleEnCours!.numeroCycle}`}
          actionLabel="Encaisser"
          onAction={() => navigate(`/admin/tontines/${retard.t.tontineId}`)}
          disabled={!online} disabledReason={offlineReason}
        />
      )
    } else {
      actionCard = <ActionCard icon={<PartyPopper size={22} />} tone="ok" title="Tout est à jour ✓" subtitle="Aucun paiement en attente" />
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
    } else {
      actionCard = <ActionCard icon={<PartyPopper size={22} />} tone="ok" title="Tout est à jour ✓" subtitle="Aucune cotisation à payer" />
    }
  }

  // ─── Carte QR ────────────────────────────────────────────────────────────
  const prenom = user?.firstName || ''
  const qr = mode === 'GERE'
    ? {
        title: tontineChoisie ? `Inviter dans ${tontineChoisie.nom}` : 'Inviter dans une tontine',
        subtitle: tontineChoisie ? 'Faites scanner ce QR pour rejoindre' : 'Choisissez la tontine à partager',
        url: tontineChoisie ? tontineQrUrl(tontineChoisie.id) : null,
        shareText: tontineChoisie
          ? `Rejoins notre tontine ${tontineChoisie.nom} (${formatF(tontineChoisie.montant)}) :`
          : '',
      }
    : {
        title: 'Mon QR membre',
        subtitle: 'À montrer à votre gestionnaire',
        url: user?.phone ? memberQrUrl(user.phone) : null,
        shareText: `${prenom ? `${prenom} sur` : 'Retrouvez-moi sur'} Dinthialma :`,
      }

  // ─── Grille de services ──────────────────────────────────────────────────
  const inviter = () => shareLink({
    title: 'Dinthialma',
    text: 'Je gère mes tontines avec Dinthialma, rejoins-moi :',
    url: appUrl(),
  })

  const services: ServiceItem[] = mode === 'GERE'
    ? [
        { key: 'encaisser', label: 'Encaisser', icon: <CreditCard size={26} />, tone: 'green', to: '/admin/cotisations', state: { tontineId: tontineId ?? undefined } },
        { key: 'valider', label: 'À valider', icon: <ListChecks size={26} />, tone: 'amber', to: '/admin/cotisations', state: { tontineId: tontineId ?? undefined }, badge: aValiderTotal },
        { key: 'tontines', label: 'Tontines', icon: <Wallet size={26} />, tone: 'blue', to: '/admin/tontines' },
        { key: 'membres', label: 'Membres', icon: <Users size={26} />, tone: 'violet', to: '/admin/membres' },
        { key: 'tours', label: 'Tours', icon: <RefreshCw size={26} />, tone: 'teal', to: '/admin/cycles' },
        { key: 'creer', label: 'Créer', icon: <Plus size={26} />, tone: 'rose', onClick: () => setCreateOpen(true) },
        { key: 'inviter', label: 'Inviter', icon: <Share2 size={26} />, tone: 'green', onClick: inviter },
        { key: 'plus', label: 'Plus', icon: <MoreHorizontal size={26} />, tone: 'neutral', onClick: () => setPlusOpen(true) },
      ]
    : [
        { key: 'payer', label: 'Payer', icon: <Send size={26} />, tone: 'green', onClick: () => (aPayerTotal > 1 && !tontineId ? setPayPickerOpen(true) : openPay(tontineId ?? cotisant.data?.aPayer[0]?.tontineId)) },
        { key: 'tontines', label: 'Tontines', icon: <Wallet size={26} />, tone: 'blue', to: '/member/tontines' },
        { key: 'jackpots', label: 'Jackpots', icon: <Trophy size={26} />, tone: 'amber', to: '/jackpots' },
        { key: 'historique', label: 'Historique', icon: <History size={26} />, tone: 'violet', to: '/member/cotisations' },
        { key: 'creer', label: 'Créer', icon: <Plus size={26} />, tone: 'rose', onClick: () => setCreateOpen(true) },
        { key: 'inviter', label: 'Inviter', icon: <Share2 size={26} />, tone: 'teal', onClick: inviter },
        { key: 'alertes', label: 'Alertes', icon: <Bell size={26} />, tone: 'green', to: '/notifications', badge: unread },
        { key: 'plus', label: 'Plus', icon: <MoreHorizontal size={26} />, tone: 'neutral', onClick: () => setPlusOpen(true) },
      ]

  const plusItems: PlusItem[] = [
    ...(mode === 'GERE'
      ? [
          { key: 'jackpots', label: 'Jackpots', icon: <Trophy size={22} />, to: '/jackpots' },
          { key: 'historique', label: 'Mes paiements', icon: <History size={22} />, to: '/member/cotisations' },
        ]
      : [{ key: 'alertes', label: 'Alertes', icon: <Bell size={22} />, to: '/notifications' }]),
    { key: 'profil', label: 'Mon profil', icon: <UserCircle size={22} />, to: '/profile' },
    ...(canInstall ? [{ key: 'installer', label: 'Installer', icon: <Download size={22} />, onClick: triggerInstall }] : []),
  ]

  // ─── Navigation depuis le fil ────────────────────────────────────────────
  const openActivite = (it: ActiviteItem) => {
    if (it.cotisationId) navigate(`/recu/${it.tontineId}/${it.cotisationId}`)
    else navigate(mode === 'GERE' ? `/admin/tontines/${it.tontineId}` : `/member/tontines/${it.tontineId}`)
  }

  const filterOptions = tontinesDuMode.map((t) => ({ id: t.id, nom: t.nom, detail: `${formatF(t.montant)} · ${t.nombreMembresActuels} membres` }))
  const payOptions = (cotisant.data?.aPayer ?? []).map((t) => ({
    id: t.tontineId,
    nom: t.nom,
    detail: `${t.cotisationDue?.montant != null ? formatF(t.cotisationDue.montant) : 'Montant libre'} · ${dueDetail(t.cotisationDue?.dateLimite)}`,
  }))

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {!online && (
        <div role="status" className="sticky top-0 z-30 bg-neutral-900 text-white text-sm px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff size={16} /> Hors connexion · données de la dernière visite
        </div>
      )}

      <div className="md:max-w-5xl md:mx-auto md:px-6 md:pt-6 md:grid md:grid-cols-2 md:gap-6 md:items-start">
        <div>
          <HomeHeader
            mode={mode}
            onModeChange={setSavedMode}
            deuxModes={roles.deuxModes}
            pastilles={{ COTISE: aPayerTotal, GERE: aValiderTotal }}
            filterLabel={nouvelInscrit || tontinesDuMode.length < 2 ? null : tontineChoisie?.nom ?? 'Toutes mes tontines'}
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
              onChoose={mode === 'GERE' ? () => setFilterOpen(true) : undefined}
            />
            {actionCard}
            <ServiceGrid items={services} />
          </div>
        </div>

        <div className="px-4 mt-4 md:px-0 md:mt-0">
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
        allowAll
        selectedId={tontineId}
        onSelect={setTontineId}
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

      {/* Parcours existant, en attendant le nouvel écran Créer (T9) */}
      <CreateTontineModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
