/**
 * Moyens de paiement. Les valeurs viennent de la liste « METHODE_PAIEMENT » du backend ;
 * cette table sert de libellé par défaut et d'ordre d'affichage.
 */
export const PAYMENT_METHODS = [
  { value: 'WAVE', label: 'Wave', mobileMoney: true },
  { value: 'ORANGE_MONEY', label: 'Orange Money', mobileMoney: true },
  { value: 'FREE_MONEY', label: 'Free Money', mobileMoney: true },
  { value: 'CASH', label: 'Espèces', mobileMoney: false },
] as const

const LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CASH: 'Espèces',
  VIREMENT: 'Virement',
  MTN_MOMO: 'MTN MoMo',
}

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return LABELS[value] ?? value
}

export function isMobileMoney(value: string | null | undefined): boolean {
  return !!value && value !== 'CASH'
}

/** Dernier moyen utilisé sur cet appareil (présélection) */
export const LAST_METHOD_KEY = 'dinthialma_last_method'
