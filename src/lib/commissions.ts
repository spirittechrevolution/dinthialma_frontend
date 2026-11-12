import { formatF } from '@/lib/format'
import type { Commission } from '@/types/tontine'

/** Types de commission du gestionnaire (création de tontine et Réglages) */
export const TYPES_COMMISSION: { value: Commission['type']; label: string; unite: '%' | 'F' }[] = [
  { value: 'POURCENTAGE_JACKPOT', label: '% du jackpot', unite: '%' },
  { value: 'FRAIS_FIXES_PAR_CYCLE', label: 'Frais fixes par tour', unite: 'F' },
  { value: 'FRAIS_ADHESION', label: "Frais d'adhésion", unite: 'F' },
]

export const valeurCommission = (c: Pick<Commission, 'type' | 'valeur'>) =>
  c.type === 'POURCENTAGE_JACKPOT' ? `${c.valeur} %` : formatF(c.valeur)
