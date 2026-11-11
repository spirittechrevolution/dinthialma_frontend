/**
 * Couche « moi » : données centrées sur l'utilisateur connecté, pour les écrans du brief v2
 * (accueil Je cotise / Je gère, À valider, fil d'activité, Mes jackpots).
 *
 * Chaque fonction correspond à un endpoint proposé dans docs/BESOINS_BACKEND.md.
 * En attendant sa livraison, elle reconstruit la même réponse à partir des endpoints existants
 * (plusieurs appels par tontine). Quand le backend livre, on remplace UNIQUEMENT le corps de la
 * fonction par un appel direct : les types (src/types/me.ts) et les écrans ne bougent pas.
 *
 * Les appels intermédiaires passent par le cache React Query avec les mêmes clés que les hooks
 * existants (tontines, membres, cycles, cotisations…) : pas de double téléchargement entre écrans,
 * et les invalidations faites par les mutations s'appliquent aussi ici.
 */
import type { QueryKey } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getAccessToken, getAuthUser, getUserPhone } from '@/lib/tokenStorage'
import { samePhone } from '@/lib/phone'
import { tontineService } from './tontineService'
import { membreService } from './membreService'
import { cycleService } from './cycleService'
import { cotisationService } from './cotisationService'
import { dashboardService } from './dashboardService'
import { CotisationStatut, CycleStatut, MembreStatut, TontineStatut } from '@/types/common'
import type { PageResponse } from '@/types/common'
import { TontineType } from '@/types/tontine'
import type { Tontine } from '@/types/tontine'
import type { Cycle } from '@/types/cycle'
import type { Membre } from '@/types/membre'
import type { Cotisation } from '@/types/cotisation'
import type { TontineStats } from '@/types/dashboard'
import type {
  MaTontine, MonRole, CotisantSummary, CotisantTontineSummary, CotisationDue,
  GestionSummary, GestionTontineSummary, CotisationAValider,
  ActiviteItem, ActiviteType, ModeAccueil, MesJackpots, JackpotRecu, JackpotAVenir, ModeAttribution,
} from '@/types/me'
import { jeCotise, jeGere } from '@/types/me'

/** Taille de page maximale acceptée par le backend */
const MAX = 200
/** Garde-fou : nombre maximum de pages lues pour une même liste */
const MAX_PAGES = 10
/** Durée pendant laquelle une donnée intermédiaire en cache est réutilisée sans rappel réseau */
const STALE_MS = 60_000

// ─── Outils ──────────────────────────────────────────────────────────────────

function cached<T>(queryKey: QueryKey, queryFn: () => Promise<T>): Promise<T> {
  return queryClient.fetchQuery({ queryKey, queryFn, staleTime: STALE_MS })
}

async function collectAll<T>(
  fetchPage: (page: number) => Promise<PageResponse<T>>,
): Promise<T[]> {
  const items: T[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetchPage(page)
    items.push(...res.content)
    if (res.last || page + 1 >= res.totalPages) break
  }
  return items
}

const num = (v: number | string | null | undefined): number => {
  const n = typeof v === 'string' ? parseFloat(v) : v ?? 0
  return Number.isFinite(n) ? (n as number) : 0
}

function currentUserPhone(): string {
  return getAuthUser(getAccessToken() ?? undefined)?.phone || getUserPhone() || ''
}

// Lectures mises en cache (clés identiques aux hooks existants)
const getTontinesPage = (page: number) =>
  cached(['tontines', page, MAX], () => tontineService.listTontines(page, MAX))
const getMembres = (tontineId: string) =>
  collectAll((page) => cached(['membres', tontineId, page, MAX], () => membreService.listMembres(tontineId, page, MAX)))
const getCycles = (tontineId: string) =>
  collectAll((page) => cached(['cycles', tontineId, page, MAX], () => cycleService.listCycles(tontineId, page, MAX)))
const getCotisations = (tontineId: string, cycleId?: string, membreId?: string) =>
  collectAll((page) =>
    cached(['cotisations', tontineId, cycleId, page, MAX, membreId], () =>
      cotisationService.listCotisations(tontineId, cycleId, page, MAX, membreId)))
/** Première page seulement (200 plus récents, tri createdAt desc) — suffisant pour un fil d'activité */
const getCotisationsRecentes = (tontineId: string, membreId?: string) =>
  cached(['cotisations', tontineId, undefined, 0, MAX, membreId], () =>
    cotisationService.listCotisations(tontineId, undefined, 0, MAX, membreId)).then((p) => p.content)
const getBeneficiaires = (tontineId: string) =>
  collectAll((page) =>
    cached(['beneficiaires-historique', tontineId, page, MAX], () =>
      cycleService.getBeneficiairesHistorique(tontineId, page, MAX)))
const getRecapCycle = (tontineId: string, cycleId: string) =>
  collectAll((page) =>
    cached(['recapCycle', tontineId, cycleId, page, MAX], () =>
      cotisationService.getRecapCycle(tontineId, cycleId, page, MAX)))
const getGestionStats = () =>
  collectAll((page) =>
    cached(['me', 'myDashboardRaw', page, MAX], () => dashboardService.getMyDashboard(page, MAX))
      .then((d) => d.tontines))

function modeAttribution(ordre: string | null | undefined): ModeAttribution {
  if (ordre === 'MANUEL') return 'CHOIX'
  if (ordre === 'ALEATOIRE') return 'TIRAGE'
  return 'ORDRE' // ROTATION
}

function nomComplet(p: { firstName?: string; lastName?: string } | null | undefined): string {
  return [p?.firstName, p?.lastName].filter(Boolean).join(' ')
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const meService = {
  /**
   * B01 — Mes tontines avec mon rôle et mon identifiant de membre.
   * Cible backend : champs `monRole`, `monMembreId`, `monStatutMembre` dans `GET /v1/tontines`.
   * Contournement : comparaison des numéros (créateur, liste des membres).
   * NB : pour un SUPER_ADMIN, `GET /v1/tontines` renvoie toute la plateforme ; les tontines où
   * il n'est ni créateur ni membre ressortent avec `monRole = 'LECTURE'`.
   */
  async listMesTontines(): Promise<MaTontine[]> {
    const phone = currentUserPhone()
    const tontines: Tontine[] = await collectAll(getTontinesPage)

    return Promise.all(
      tontines.map(async (t): Promise<MaTontine> => {
        const estCreateur = samePhone(t.creePar?.phone, phone)
        const membres: Membre[] = await getMembres(t.id)
        const moi = membres.find((m) => samePhone(m.user?.phone, phone))
        const monRole: MonRole =
          estCreateur && moi ? 'GESTIONNAIRE_ET_MEMBRE'
          : estCreateur ? 'GESTIONNAIRE'
          : moi ? 'MEMBRE'
          : 'LECTURE'
        return {
          ...t,
          monRole,
          monMembreId: moi?.id ?? null,
          monStatutMembre: moi?.statut ?? null,
          monOrdreJackpot: moi?.ordreJackpot ?? null,
          aRecuJackpot: moi?.aRecuJackpot ?? false,
        }
      }),
    )
  },

  /**
   * B04 — Résumé « Je cotise » (toutes mes tontines où je cotise).
   * Cible backend : `GET /v1/me/summary`.
   */
  async getCotisantSummary(mesTontines: MaTontine[]): Promise<CotisantSummary> {
    const tontines = mesTontines.filter((t) => jeCotise(t) && t.monMembreId)

    const lignes = await Promise.all(
      tontines.map(async (t): Promise<CotisantTontineSummary> => {
        const [cycles, cotisations, beneficiaires] = await Promise.all([
          getCycles(t.id),
          // membreId : indispensable si je suis aussi gestionnaire (sinon je reçois tout),
          // ignoré par le backend pour un simple membre (il ne voit que les siennes).
          getCotisations(t.id, undefined, t.monMembreId ?? undefined),
          getBeneficiaires(t.id),
        ])
        const mesCotisations = cotisations.filter((c) => c.membre?.membreId === t.monMembreId || !jeGere(t))
        const valides = mesCotisations.filter((c) => c.statut === CotisationStatut.VALIDE)
        const enAttente = mesCotisations.filter((c) => c.statut === CotisationStatut.EN_ATTENTE)
        const cycleEnCours = cycles.find((c: Cycle) => c.statut === CycleStatut.EN_COURS) ?? null

        let cotisationDue: CotisationDue | null = null
        if (cycleEnCours && t.monStatutMembre === MembreStatut.ACTIF) {
          const existante = mesCotisations.find((c) => c.cycleId === cycleEnCours.id)
          cotisationDue = {
            cycleId: cycleEnCours.id,
            numeroCycle: cycleEnCours.numeroCycle,
            montant: t.montantLibre ? t.montantMinimum ?? null : t.montant,
            montantLibre: !!t.montantLibre,
            montantMinimum: t.montantMinimum ?? null,
            dateLimite: cycleEnCours.dateFin,
            statut: !existante ? 'A_PAYER'
              : existante.statut === CotisationStatut.VALIDE ? 'VALIDE'
              : 'EN_ATTENTE',
          }
        }

        const toursEstimes = t.tontineType === TontineType.ROTATIVE
          ? Math.ceil(t.nombreMembres / Math.max(1, t.nombreGagnants || 1))
          : 0
        const totalJackpotsRecus = beneficiaires
          .flatMap((b) => b.gagnants ?? [])
          .filter((g) => g.membreId === t.monMembreId)
          .reduce((s, g) => s + num(g.montantRecu), 0)

        return {
          tontineId: t.id,
          nom: t.nom,
          tontineType: t.tontineType,
          monMembreId: t.monMembreId,
          totalCotiseValide: valides.reduce((s, c) => s + num(c.montant), 0),
          totalEnAttente: enAttente.reduce((s, c) => s + num(c.montant), 0),
          toursPayes: new Set(valides.map((c) => c.cycleId)).size,
          toursTotal: Math.max(cycles.length, toursEstimes),
          totalJackpotsRecus,
          cycleEnCours: cycleEnCours
            ? { cycleId: cycleEnCours.id, numeroCycle: cycleEnCours.numeroCycle, dateFin: cycleEnCours.dateFin }
            : null,
          cotisationDue,
          gestionnaire: {
            firstName: t.creePar?.firstName ?? '',
            lastName: t.creePar?.lastName ?? '',
            phone: t.creePar?.phone ?? '',
          },
        }
      }),
    )

    const aPayer = lignes
      .filter((l) => l.cotisationDue?.statut === 'A_PAYER')
      .sort((a, b) => +new Date(a.cotisationDue!.dateLimite) - +new Date(b.cotisationDue!.dateLimite))

    return {
      totalCotiseValide: lignes.reduce((s, l) => s + l.totalCotiseValide, 0),
      totalEnAttente: lignes.reduce((s, l) => s + l.totalEnAttente, 0),
      totalJackpotsRecus: lignes.reduce((s, l) => s + l.totalJackpotsRecus, 0),
      aPayer,
      tontines: lignes,
    }
  },

  /**
   * B05 — Résumé « Je gère » : collecté / attendu du tour en cours de chaque tontine gérée.
   * Cible backend : champs ajoutés à `GET /v1/admin/my-dashboard`.
   */
  async getGestionSummary(): Promise<GestionSummary> {
    const stats: TontineStats[] = await getGestionStats()

    const tontines = await Promise.all(
      stats.map(async (s): Promise<GestionTontineSummary> => {
        const id = s.tontineId ?? s.id
        let cycleEnCours: GestionTontineSummary['cycleEnCours'] = null
        if (s.cycleEnCours) {
          const recap = await getRecapCycle(id, s.cycleEnCours.cycleId)
          const actifs = recap.filter((r) => r.statutMembre === MembreStatut.ACTIF)
          const valides = recap.filter((r) => r.statutCotisation === CotisationStatut.VALIDE)
          cycleEnCours = {
            cycleId: s.cycleEnCours.cycleId,
            numeroCycle: s.cycleEnCours.numeroCycle,
            dateFin: s.cycleEnCours.dateFin,
            montantCollecte: valides.reduce((sum, r) => sum + num(r.montant), 0),
            montantAttendu: s.montantLibre || s.montant == null ? null : num(s.montant) * actifs.length,
            membresAyantPaye: valides.length,
            membresAyantDeclare: recap.filter((r) => r.cotisationId != null).length,
            membresActifs: actifs.length,
          }
        }
        return {
          tontineId: id,
          nom: s.nom,
          tontineType: s.tontineType as GestionTontineSummary['tontineType'],
          montant: s.montant ?? null,
          montantLibre: !!s.montantLibre,
          cotisationsEnAttente: num(s.cotisationsEnAttente),
          cotisationsEnRetard: num(s.cotisationsEnRetard),
          montantTotalValide: num(s.montantTotalValide),
          cycleEnCours,
        }
      }),
    )

    const attendus = tontines.map((t) => t.cycleEnCours?.montantAttendu).filter((v): v is number => v != null)
    return {
      totalCollecteToursEnCours: tontines.reduce((s, t) => s + (t.cycleEnCours?.montantCollecte ?? 0), 0),
      totalAttenduToursEnCours: attendus.length ? attendus.reduce((s, v) => s + v, 0) : null,
      totalCotisationsEnAttente: tontines.reduce((s, t) => s + t.cotisationsEnAttente, 0),
      totalCotisationsEnRetard: tontines.reduce((s, t) => s + t.cotisationsEnRetard, 0),
      tontines,
    }
  },

  /**
   * B06 — Paiements en attente de validation dans toutes mes tontines gérées (plus ancien d'abord).
   * Cible backend : `GET /v1/me/gestion/cotisations?statut=EN_ATTENTE`.
   * Contournement : seules les tontines signalées par le tableau de bord sont lues, et uniquement
   * leur tour en cours (la clôture d'un tour fait passer ses paiements en attente « en retard »).
   */
  async listCotisationsAValider(tontineId?: string): Promise<CotisationAValider[]> {
    const stats = (await getGestionStats())
      .filter((s) => num(s.cotisationsEnAttente) > 0)
      .filter((s) => !tontineId || (s.tontineId ?? s.id) === tontineId)

    const parTontine = await Promise.all(
      stats.map(async (s) => {
        const id = s.tontineId ?? s.id
        const cotisations = await getCotisations(id, s.cycleEnCours?.cycleId)
        return cotisations
          .filter((c) => c.statut === CotisationStatut.EN_ATTENTE)
          .map((c): CotisationAValider => ({ ...c, tontineNom: s.nom }))
      }),
    )
    return parTontine.flat().sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
  },

  /**
   * B07 — Paiements d'une tontine filtrés par statut.
   * Cible backend : paramètre `statut` sur `GET /v1/tontines/{id}/cotisations`.
   * Contournement : lecture complète (pages de 200) puis filtre local.
   */
  async listCotisationsParStatut(
    tontineId: string,
    statuts: CotisationStatut[],
    opts: { cycleId?: string; membreId?: string } = {},
  ): Promise<Cotisation[]> {
    const all = await getCotisations(tontineId, opts.cycleId, opts.membreId)
    return statuts.length ? all.filter((c) => statuts.includes(c.statut)) : all
  },

  /**
   * B09 — Fil d'activité (plus récent d'abord).
   * Cible backend : `GET /v1/me/activite?mode=…`.
   */
  async listActivite(
    mode: ModeAccueil,
    mesTontines: MaTontine[],
    opts: { tontineId?: string; limit?: number } = {},
  ): Promise<ActiviteItem[]> {
    const limit = opts.limit ?? 50
    const cible = mesTontines
      .filter((t) => (mode === 'COTISE' ? jeCotise(t) && t.monMembreId : jeGere(t)))
      .filter((t) => !opts.tontineId || t.id === opts.tontineId)

    const items = await Promise.all(
      cible.map(async (t): Promise<ActiviteItem[]> => {
        const membreId = mode === 'COTISE' ? t.monMembreId ?? undefined : undefined
        const [cotisations, beneficiaires] = await Promise.all([
          getCotisationsRecentes(t.id, membreId),
          mode === 'COTISE' ? getBeneficiaires(t.id) : Promise.resolve([]),
        ])

        const lignes: ActiviteItem[] = cotisations
          .filter((c) => mode === 'GERE' || !jeGere(t) || c.membre?.membreId === t.monMembreId)
          .map((c) => {
            const encaissee = !!c.enregistrePar && c.enregistrePar.id !== c.membre?.userId
            const type: ActiviteType =
              c.statut === CotisationStatut.EN_RETARD ? 'COTISATION_EN_RETARD'
              : c.statut === CotisationStatut.EN_ATTENTE ? 'COTISATION_DECLAREE'
              : encaissee ? 'COTISATION_ENCAISSEE'
              : 'COTISATION_VALIDEE'
            return {
              id: `cot-${c.id}`,
              type,
              date: c.dateValidation ?? c.createdAt,
              montant: num(c.montant),
              sens: 'EPARGNE',
              statut: c.statut,
              tontineId: t.id,
              tontineNom: t.nom,
              cycleId: c.cycleId,
              cotisationId: c.id,
              membreNom: nomComplet(c.membre) || null,
            }
          })

        for (const b of beneficiaires) {
          for (const g of b.gagnants ?? []) {
            if (g.membreId !== t.monMembreId) continue
            lignes.push({
              id: `jack-${b.cycleId}-${g.membreId}`,
              type: 'JACKPOT_RECU',
              date: g.dateJackpot ?? b.dateRemise,
              montant: num(g.montantRecu ?? b.montantParGagnant),
              sens: 'GAIN',
              statut: null,
              tontineId: t.id,
              tontineNom: t.nom,
              cycleId: b.cycleId,
              cotisationId: null,
              membreNom: nomComplet(g) || null,
            })
          }
        }
        return lignes
      }),
    )

    return items.flat().sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, limit)
  },

  /**
   * B10 — Mes jackpots reçus et à venir.
   * Cible backend : `GET /v1/me/jackpots`.
   * Estimation à venir : seulement pour une tontine rotative active, ordre « ROTATION », jackpot pas
   * encore reçu ; date = fin du tour correspondant s'il est déjà planifié.
   */
  async getMesJackpots(mesTontines: MaTontine[]): Promise<MesJackpots> {
    const tontines = mesTontines.filter((t) => jeCotise(t) && t.monMembreId)

    const parTontine = await Promise.all(
      tontines.map(async (t) => {
        const beneficiaires = await getBeneficiaires(t.id)
        const recus: JackpotRecu[] = beneficiaires.flatMap((b) =>
          (b.gagnants ?? [])
            .filter((g) => g.membreId === t.monMembreId)
            .map((g) => ({
              tontineId: t.id,
              tontineNom: t.nom,
              cycleId: b.cycleId,
              numeroCycle: b.numeroCycle,
              dateRemise: g.dateJackpot ?? b.dateRemise ?? null,
              montantRecu: num(g.montantRecu ?? b.montantParGagnant),
            })),
        )

        let aVenir: JackpotAVenir | null = null
        const dejaRecu = t.aRecuJackpot || recus.length > 0
        if (t.tontineType === TontineType.ROTATIVE && t.statut === TontineStatut.ACTIVE && !dejaRecu) {
          const mode = modeAttribution(t.ordreBeneficiaire)
          const gagnants = Math.max(1, t.nombreGagnants || 1)
          const numeroCycleEstime =
            mode === 'ORDRE' && t.monOrdreJackpot ? Math.ceil(t.monOrdreJackpot / gagnants) : null
          let dateEstimee: string | null = null
          if (numeroCycleEstime) {
            const cycles = await getCycles(t.id)
            dateEstimee = cycles.find((c) => c.numeroCycle === numeroCycleEstime)?.dateFin ?? null
          }
          aVenir = {
            tontineId: t.id,
            tontineNom: t.nom,
            position: t.monOrdreJackpot,
            numeroCycleEstime,
            dateEstimee,
            montantEstime: t.montant ? Math.round((t.montant * t.nombreMembres) / gagnants) : null,
            modeAttribution: mode,
          }
        }
        return { recus, aVenir }
      }),
    )

    const recus = parTontine.flatMap((p) => p.recus)
      .sort((a, b) => +new Date(b.dateRemise ?? 0) - +new Date(a.dateRemise ?? 0))
    const aVenir = parTontine.map((p) => p.aVenir).filter((v): v is JackpotAVenir => v !== null)
      .sort((a, b) => (a.dateEstimee ? +new Date(a.dateEstimee) : Infinity) - (b.dateEstimee ? +new Date(b.dateEstimee) : Infinity))

    return { totalRecu: recus.reduce((s, r) => s + r.montantRecu, 0), recus, aVenir }
  },
}
