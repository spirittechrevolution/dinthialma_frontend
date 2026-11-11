import { toast } from 'sonner'

/** Invitation ouverte avant connexion, rouverte par l'accueil une fois connecté */
export const INVITATION_EN_ATTENTE_KEY = 'dinthialma_invitation_en_attente'

/** Lien public de l'application (invitation d'un proche) */
export function appUrl(): string {
  return window.location.origin
}

/**
 * Chemin interne correspondant à un QR scanné (§8 de PROMPT_ALIGNEMENT_FRONT) :
 * - URL complète `…/q/{token}` (membre) ou `…/q/t/{code}` (invitation) → dernier segment ;
 * - jeton brut `m_…` (membre) ou code `XXXX-XXXX` (invitation).
 * Renvoie null si ce n'est pas un QR Dinthialma.
 */
export function cheminQrDinthialma(texte: string): string | null {
  const t = texte.trim()
  if (/^m_[\w-]+$/i.test(t)) return `/q/${t}`
  if (/^[a-z0-9]{4}-?[a-z0-9]{4}$/i.test(t)) return `/q/t/${t}`
  try {
    const u = new URL(t)
    const m = u.pathname.match(/^\/q\/(t\/)?([^/]+)\/?$/)
    if (m) return m[1] ? `/q/t/${m[2]}` : `/q/${m[2]}`
  } catch {
    /* pas une URL */
  }
  return null
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
