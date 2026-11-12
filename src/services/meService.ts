/**
 * Couche « moi » : données centrées sur l'utilisateur connecté (accueil Je cotise / Je gère,
 * À valider, fil d'activité, Mes jackpots), branchée sur les endpoints du backend
 * (B01, B04, B05, B06, B07, B09, B10 — voir docs/PLAN_INTEGRATION_BACKEND.md, lot 2).
 *
 * Le backend omet les champs `null` (non_null) : chaque réponse est normalisée ici
 * (champ absent → null) pour que les écrans n'aient jamais à distinguer les deux.
 */
import api from './api'
import { tontineService } from './tontineService'
import { cotisationService } from './cotisationService'
import { dashboardService } from './dashboardService'
import { toPage, type CustomResponse, type RawPage, type PageResponse, type CotisationStatut } from '@/types/common'
import type { Tontine } from '@/types/tontine'
import type { Cotisation } from '@/types/cotisation'
import type { TontineStats } from '@/types/dashboard'
import type {
  MaTontine, MonRole, CotisantSummary, CotisantTontineSummary, CotisationDue,
  GestionSummary, GestionTontineSummary, CotisationAValider,
  ActiviteItem, ActiviteType, ModeAccueil, MesJackpots, JackpotRecu, JackpotAVenir, ModeAttribution,
} from '@/types/me'

/** Taille de page utilisée pour lire une liste complète */
const PAGE = 100
/** Garde-fou : nombre maximum de pages lues pour une même liste */
const MAX_PAGES = 20

async function collectAll<T>(fetchPage: (page: number) => Promise<PageResponse<T>>, limite = Infinity): Promise<T[]> {
  const items: T[] = []
  for (let page = 0; page < MAX_PAGES && items.length < limite; page++) {
    const res = await fetchPage(page)
    items.push(...res.content)
    if (res.last || page + 1 >= res.totalPages) break
  }
  return items.slice(0, limite)
}

const num = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}
const numOuNull = (v: unknown): number | null => (v === undefined || v === null ? null : num(v))
const ouNull = <T>(v: T | undefined | null): T | null => (v === undefined ? null : v)

function avecRole(t: Tontine): MaTontine {
  return { ...t, monRole: (t.monRole ?? 'LECTURE') as MonRole }
}

// ─── Formes brutes des réponses /me (champs absents possibles) ───────────────
interface RawCotisantTontine {
  tontineId: string; nom: string; tontineType: Tontine['tontineType']; statut: CotisantTontineSummary['statut']
  frequence?: string; monMembreId?: string; monStatutMembre?: CotisantTontineSummary['monStatutMembre']
  ordreJackpot?: number; aRecuJackpot?: boolean
  totalCotiseValide?: number; totalEnAttente?: number; toursPayes?: number; toursTotal?: number
  totalJackpotsRecus?: number; nombreJackpotsRecus?: number
  cycleEnCours?: { cycleId: string; numeroCycle: number; dateDebut: string; dateFin: string }
  cotisationDue?: {
    montant?: number; montantLibre?: boolean; montantMinimum?: number; dateLimite: string
    statut: CotisationDue['statut']; cotisationId?: string; motifDernierRefus?: string
  }
  gestionnaire?: { firstName?: string; lastName?: string; phone?: string }
}
interface RawSummary {
  totalCotiseValide?: number; totalEnAttente?: number; totalJackpotsRecus?: number
  nombreCotisationsDues?: number; montantDu?: number; tontines?: RawCotisantTontine[]
}
interface RawActivite {
  id: string; type: ActiviteType; date: string; montant?: number; sens: 'EPARGNE' | 'GAIN'
  statut?: CotisationStatut; tontineId: string; tontineNom?: string; cycleId?: string; numeroCycle?: number
  cotisationId?: string; membreId?: string; membreNom?: string; libelle?: string
}
interface RawJackpots {
  totalRecu?: number
  recus?: (Omit<JackpotRecu, 'dateRemise'> & { dateRemise?: string })[]
  aVenir?: { tontineId: string; tontineNom: string; monMembreId?: string; modeAttribution: ModeAttribution
    position?: number; numeroCycleEstime?: number; dateEstimee?: string; montantEstime?: number }[]
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const meService = {
  /** B01 — mes tontines (créées + où je cotise) avec `monRole`. */
  async listMesTontines(): Promise<MaTontine[]> {
    const tontines = await collectAll((page) => tontineService.listTontines(page, PAGE))
    return tontines.map(avecRole)
  },

  /** B01 pour une seule tontine */
  async getMaTontine(tontineId: string): Promise<MaTontine> {
    return avecRole(await tontineService.getTontine(tontineId))
  },

  /** B04 — résumé « Je cotise » : `GET /v1/me/summary` (+ jackpots par tontine). */
  async getCotisantSummary(): Promise<CotisantSummary> {
    const { data } = await api.get<CustomResponse<RawSummary>>('/v1/me/summary')
    const raw = data.data ?? {}

    const tontines: CotisantTontineSummary[] = (raw.tontines ?? []).map((t) => ({
      tontineId: t.tontineId,
      nom: t.nom,
      tontineType: t.tontineType,
      statut: t.statut,
      frequence: ouNull(t.frequence),
      monMembreId: ouNull(t.monMembreId),
      monStatutMembre: ouNull(t.monStatutMembre),
      ordreJackpot: numOuNull(t.ordreJackpot),
      aRecuJackpot: !!t.aRecuJackpot,
      totalCotiseValide: num(t.totalCotiseValide),
      totalEnAttente: num(t.totalEnAttente),
      toursPayes: num(t.toursPayes),
      toursTotal: num(t.toursTotal),
      // Toujours 0 pour une tontine événementielle (pas de jackpot)
      totalJackpotsRecus: num(t.totalJackpotsRecus),
      nombreJackpotsRecus: num(t.nombreJackpotsRecus),
      cycleEnCours: t.cycleEnCours ?? null,
      cotisationDue: t.cotisationDue && t.cycleEnCours ? {
        cycleId: t.cycleEnCours.cycleId,
        numeroCycle: t.cycleEnCours.numeroCycle,
        montant: numOuNull(t.cotisationDue.montant),
        montantLibre: !!t.cotisationDue.montantLibre,
        montantMinimum: numOuNull(t.cotisationDue.montantMinimum),
        dateLimite: t.cotisationDue.dateLimite,
        statut: t.cotisationDue.statut,
        cotisationId: ouNull(t.cotisationDue.cotisationId),
        motifDernierRefus: ouNull(t.cotisationDue.motifDernierRefus),
      } : null,
      gestionnaire: {
        firstName: t.gestionnaire?.firstName ?? '',
        lastName: t.gestionnaire?.lastName ?? '',
        phone: t.gestionnaire?.phone ?? '',
      },
    }))

    const aPayer = tontines
      .filter((l) => l.cotisationDue?.statut === 'A_PAYER')
      .sort((a, b) => +new Date(a.cotisationDue!.dateLimite) - +new Date(b.cotisationDue!.dateLimite))

    return {
      totalCotiseValide: num(raw.totalCotiseValide),
      totalEnAttente: num(raw.totalEnAttente),
      totalJackpotsRecus: num(raw.totalJackpotsRecus),
      nombreCotisationsDues: num(raw.nombreCotisationsDues),
      montantDu: num(raw.montantDu),
      aPayer,
      tontines,
    }
  },

  /** B05 — résumé « Je gère » : `GET /v1/admin/my-dashboard` (toutes les pages). */
  async getGestionSummary(): Promise<GestionSummary> {
    const premiere = await dashboardService.getMyDashboard(0, PAGE)
    const stats: TontineStats[] = [...premiere.tontines.content]
    for (let page = 1; page < Math.min(premiere.tontines.totalPages, MAX_PAGES); page++) {
      stats.push(...(await dashboardService.getMyDashboard(page, PAGE)).tontines.content)
    }
    const tontines: GestionTontineSummary[] = stats.map((s) => {
      const c = s.cycleEnCours
      return {
        tontineId: s.tontineId ?? s.id,
        nom: s.nom,
        tontineType: s.tontineType as GestionTontineSummary['tontineType'],
        montant: numOuNull(s.montant),
        montantLibre: !!s.montantLibre,
        cotisationsEnAttente: num(s.cotisationsEnAttente),
        cotisationsEnRetard: num(s.cotisationsEnRetard),
        demandesEnAttente: num(s.demandesEnAttente),
        montantTotalValide: num(s.montantTotalValide),
        gagnantsADesigner: !!s.gagnantsADesigner,
        cycleEnCours: c ? {
          cycleId: c.cycleId,
          numeroCycle: c.numeroCycle,
          dateFin: c.dateFin,
          montantCollecte: num(c.montantCollecte),
          montantEnAttente: num(c.montantEnAttente),
          montantAttendu: numOuNull(c.montantAttendu),
          membresAyantPaye: num(c.membresAyantPaye),
          membresEnAttente: num(c.membresEnAttente),
          membresActifs: num(c.membresActifs),
        } : null,
      }
    })
    return {
      nombreTontinesGerees: num(premiere.nombreTontinesGerees),
      totalCollecteToursEnCours: num(premiere.totalCollecteToursEnCours),
      totalAttenduToursEnCours: premiere.totalAttenduToursEnCours,
      totalCotisationsEnAttente: num(premiere.totalCotisationsEnAttente),
      totalCotisationsEnRetard: num(premiere.totalCotisationsEnRetard),
      totalDemandesEnAttente: num(premiere.totalDemandesEnAttente),
      tontines,
    }
  },

  /** B06 — paiements à valider de mes tontines gérées, plus anciens d'abord. */
  async listCotisationsAValider(tontineId?: string): Promise<CotisationAValider[]> {
    const items = await collectAll(async (page) => {
      const { data } = await api.get<CustomResponse<RawPage<CotisationAValider>>>('/v1/me/gestion/cotisations', {
        params: { statut: ['EN_ATTENTE'], page, size: PAGE, sort: 'createdAt,asc', ...(tontineId ? { tontineId } : {}) },
      })
      return toPage(data.data)
    })
    return items.map((c) => ({ ...c, tontineNom: c.tontineNom ?? '' }))
  },

  /** B07 — paiements d'une tontine filtrés par statut (et recherche) côté serveur. */
  async listCotisationsParStatut(
    tontineId: string,
    statuts: CotisationStatut[],
    opts: { cycleId?: string; membreId?: string; q?: string } = {},
  ): Promise<Cotisation[]> {
    return collectAll((page) =>
      cotisationService.listCotisations(tontineId, opts.cycleId, page, PAGE, opts.membreId, { statut: statuts, q: opts.q }),
    )
  },

  /** B09 — fil d'activité (tri imposé : plus récent d'abord). */
  async listActivite(
    mode: ModeAccueil,
    /** `type` répétable (OU logique, filtré côté serveur) */
    opts: { tontineId?: string; statut?: CotisationStatut; type?: ActiviteType | ActiviteType[]; limit?: number } = {},
  ): Promise<ActiviteItem[]> {
    const limite = opts.limit ?? 50
    const items = await collectAll(async (page) => {
      const { data } = await api.get<CustomResponse<RawPage<RawActivite>>>('/v1/me/activite', {
        params: {
          mode, page, size: Math.min(PAGE, limite),
          ...(opts.tontineId ? { tontineId: opts.tontineId } : {}),
          ...(opts.statut ? { statut: opts.statut } : {}),
          ...(opts.type ? { type: opts.type } : {}),
        },
      })
      return toPage(data.data)
    }, limite)
    return items.map((a) => ({
      id: a.id,
      type: a.type,
      date: a.date,
      montant: num(a.montant),
      sens: a.sens,
      statut: ouNull(a.statut),
      tontineId: a.tontineId,
      tontineNom: a.tontineNom ?? '',
      cycleId: ouNull(a.cycleId),
      numeroCycle: numOuNull(a.numeroCycle),
      cotisationId: ouNull(a.cotisationId),
      membreId: ouNull(a.membreId),
      membreNom: ouNull(a.membreNom),
      libelle: ouNull(a.libelle),
    }))
  },

  /** B10 — mes jackpots reçus et à venir (tontines rotatives uniquement). */
  async getMesJackpots(): Promise<MesJackpots> {
    const { data } = await api.get<CustomResponse<RawJackpots>>('/v1/me/jackpots')
    const raw = data.data ?? {}
    return {
      totalRecu: num(raw.totalRecu),
      recus: (raw.recus ?? []).map((r) => ({ ...r, montantRecu: num(r.montantRecu), dateRemise: ouNull(r.dateRemise) })),
      aVenir: (raw.aVenir ?? []).map((v): JackpotAVenir => ({
        tontineId: v.tontineId,
        tontineNom: v.tontineNom,
        monMembreId: ouNull(v.monMembreId),
        modeAttribution: v.modeAttribution,
        position: numOuNull(v.position),
        numeroCycleEstime: numOuNull(v.numeroCycleEstime),
        dateEstimee: ouNull(v.dateEstimee),
        montantEstime: numOuNull(v.montantEstime),
      })),
    }
  },
}
