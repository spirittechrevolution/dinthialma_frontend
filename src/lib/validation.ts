import { z } from 'zod'

/**
 * Règles de validation alignées sur le backend (api-docs.json).
 * Les reprendre côté front évite des erreurs 400 génériques :
 * l'utilisateur voit un message clair avant même l'envoi.
 */

/** Format E.164 exigé par l'API : `^\+[1-9]\d{7,14}$` (ex : +221770000000) */
export const PHONE_REGEX = /^\+[1-9]\d{7,14}$/

export const zPhone = z
  .string()
  .regex(PHONE_REGEX, 'Numéro invalide (ex : 77 000 00 00)')

/** Prénom / nom — `min` 2, `max` selon l'endpoint (50 pour le profil, 100 à l'inscription) */
export const zNom = (max: number) =>
  z.string().trim().min(2, 'Au moins 2 caractères').max(max, `${max} caractères maximum`)
