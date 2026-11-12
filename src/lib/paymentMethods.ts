/**
 * Moyens de paiement. Les valeurs viennent de la liste « METHODE_PAIEMENT » du backend ;
 * cette table sert de libellé par défaut, d'ordre d'affichage et de repli hors ligne.
 */
export const PAYMENT_METHODS = [
  { value: 'WAVE', label: 'Wave', mobileMoney: true },
  { value: 'ORANGE_MONEY', label: 'Orange Money', mobileMoney: true },
  { value: 'PI_SPI', label: 'PI-SPI', mobileMoney: true },
  { value: 'CASH', label: 'Espèces', mobileMoney: false },
] as const

/**
 * Seuls moyens utilisables aujourd'hui. Les autres sont affichés grisés (« Bientôt »).
 * Pour en ouvrir un, l'ajouter ici.
 */
export const METHODES_DISPONIBLES = ['CASH']
export const METHODE_PAR_DEFAUT = 'CASH'

export function estDisponible(value: string | null | undefined): boolean {
  return !!value && METHODES_DISPONIBLES.includes(value)
}

/** Plus proposés au paiement (même si le référentiel les renvoie encore) ; libellé gardé pour l'historique */
export const METHODES_RETIREES = ['FREE_MONEY']

const LABELS: Record<string, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  PI_SPI: 'PI-SPI',
  CASH: 'Espèces',
  FREE_MONEY: 'Free Money',
  VIREMENT: 'Virement',
  MTN_MOMO: 'MTN MoMo',
}

/**
 * Logos officiels servis depuis /public/moyens-paiement/. Un fichier absent affiche un repli
 * (pastille aux initiales) : il suffit de déposer le fichier pour que le logo apparaisse.
 */
export const PAYMENT_LOGOS: Record<string, string> = {
  WAVE: '/moyens-paiement/wave.svg',
  ORANGE_MONEY: '/moyens-paiement/orange-money.svg',
  PI_SPI: '/moyens-paiement/pispi.svg',
  CASH: '/moyens-paiement/cash.svg',
}

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return LABELS[value] ?? value
}

export function isMobileMoney(value: string | null | undefined): boolean {
  return !!value && value !== 'CASH'
}

/** Ordre d'affichage : celui de PAYMENT_METHODS, puis les autres valeurs du référentiel */
export function ordreMethode(value: string): number {
  const i = PAYMENT_METHODS.findIndex((m) => m.value === value)
  return i === -1 ? PAYMENT_METHODS.length : i
}

/** Dernier moyen utilisé sur cet appareil (présélection) */
export const LAST_METHOD_KEY = 'dinthialma_last_method'
