import { toast } from 'sonner'

/** Lien public de l'application (invitation d'un proche) */
export function appUrl(): string {
  return window.location.origin
}

/** Lien encodé dans le QR membre — v1 : numéro en clair (B15 : identifiant opaque à venir) */
export function memberQrUrl(phone: string): string {
  return `${window.location.origin}/q/m/${phone.replace(/\D/g, '')}`
}

/** Lien d'invitation d'une tontine — v1 provisoire (B16 : code d'invitation à venir) */
export function tontineQrUrl(tontineId: string): string {
  return `${window.location.origin}/q/t/${tontineId}`
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
