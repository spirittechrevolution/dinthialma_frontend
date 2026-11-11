/**
 * Affichage des numéros de téléphone.
 * Le backend stocke et renvoie les numéros sans « + » (ex. « 221770000001 »).
 * Les rôles et identifiants de membre viennent du backend (monRole, monMembreId) :
 * plus aucune comparaison de numéros n'est faite côté front.
 */
export function toLocalPhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '').replace(/^221/, '')
}

/** « 221771234567 » → « 77 123 45 67 » */
export function formatPhoneLocal(phone: string | null | undefined): string {
  const l = toLocalPhone(phone)
  return l.length === 9 ? l.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4') : l
}
