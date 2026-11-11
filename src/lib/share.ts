import { toast } from 'sonner'

/** Invitation ouverte avant connexion, rouverte par l'accueil une fois connecté */
export const INVITATION_EN_ATTENTE_KEY = 'dinthialma_invitation_en_attente'

/** Lien public de l'application (invitation d'un proche) */
export function appUrl(): string {
  return window.location.origin
}

/** Lien encodé dans le QR membre — v1 : numéro en clair (B15 : identifiant opaque à venir) */
export function memberQrUrl(phone: string): string {
  return `${window.location.origin}/q/m/${phone.replace(/\D/g, '')}`
}

/**
 * Lien d'invitation d'une tontine — v1 provisoire (B16 : code d'invitation + aperçu public à venir).
 * Faute d'aperçu public côté API, le lien transporte ce qu'il faut afficher sur la page d'invitation :
 * nom, montant, rythme, prénom et numéro du gestionnaire (partagés par le gestionnaire lui-même).
 */
export function tontineQrUrl(t: {
  id: string
  nom: string
  montant?: number | null
  montantLibre?: boolean | null
  frequence?: string | null
  creePar?: { firstName?: string; phone?: string } | null
}): string {
  const p = new URLSearchParams()
  p.set('n', t.nom)
  if (t.montantLibre) p.set('l', '1')
  else if (t.montant) p.set('m', String(t.montant))
  if (t.frequence) p.set('f', t.frequence)
  if (t.creePar?.firstName) p.set('p', t.creePar.firstName)
  if (t.creePar?.phone) p.set('g', t.creePar.phone.replace(/\D/g, ''))
  return `${window.location.origin}/q/t/${t.id}?${p.toString()}`
}

/** Informations lues dans un lien d'invitation (voir tontineQrUrl) */
export function lireInvitation(search: URLSearchParams) {
  const m = Number(search.get('m'))
  return {
    nom: search.get('n') || null,
    montant: Number.isFinite(m) && m > 0 ? m : null,
    montantLibre: search.get('l') === '1',
    frequence: search.get('f') || null,
    gestionnairePrenom: search.get('p') || null,
    gestionnairePhone: search.get('g') || null,
  }
}

/** Un texte scanné est-il un lien Dinthialma ? Renvoie le chemin interne (/q/…) ou null. */
export function cheminQrDinthialma(texte: string): string | null {
  try {
    const u = new URL(texte.trim())
    if (u.origin !== window.location.origin && !/dinthialma/i.test(u.hostname)) return null
    return u.pathname.startsWith('/q/') ? `${u.pathname}${u.search}` : null
  } catch {
    return null
  }
}

/**
 * Partage natif du téléphone ; à défaut, copie du lien dans le presse-papiers.
 * Retourne false si rien n'a pu être fait.
 */
export async function shareLink(opts: { title: string; text: string; url: string }): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(opts)
      return true
    }
  } catch (err) {
    // L'utilisateur a fermé la feuille de partage : rien à signaler
    if (err instanceof DOMException && err.name === 'AbortError') return true
  }
  try {
    await navigator.clipboard.writeText(`${opts.text} ${opts.url}`.trim())
    toast.success('Lien copié')
    return true
  } catch {
    toast.error('Impossible de partager le lien')
    return false
  }
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
