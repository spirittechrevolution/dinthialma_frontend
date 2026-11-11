/**
 * Comparaison de numéros de téléphone.
 *
 * Keycloak stocke « 221771234567 », l'API renvoie parfois « +221 77 123 45 67 » ou « 771234567 ».
 * On ne garde que les chiffres et on retire l'indicatif Sénégal pour comparer.
 *
 * ⚠️ Contournement temporaire : sert à retrouver « mon » membre / « mes » tontines tant que
 * l'API ne renvoie pas `monRole` / `monMembreId` (besoin B01 de docs/BESOINS_BACKEND.md).
 */
export function toLocalPhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '').replace(/^221/, '')
}

/** « 221771234567 » → « 77 123 45 67 » (affichage) */
export function formatPhoneLocal(phone: string | null | undefined): string {
  const l = toLocalPhone(phone)
  return l.length === 9 ? l.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') : l
}

export function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const la = toLocalPhone(a)
  return la.length > 0 && la === toLocalPhone(b)
}
