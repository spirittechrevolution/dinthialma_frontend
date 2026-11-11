import { UserRole } from '@/types/common'

/**
 * Accueil de l'utilisateur selon ses rôles — source unique utilisée par le démarrage,
 * les écrans de connexion / PIN, l'onboarding et les gardes de route.
 */
export function getHomePath(roles: readonly UserRole[] | undefined | null): string {
  const r = roles ?? []
  if (r.includes(UserRole.SUPER_ADMIN)) return '/superadmin/dashboard'
  if (r.includes(UserRole.ADMIN)) return '/admin/dashboard'
  if (r.includes(UserRole.MEMBER)) return '/member/dashboard'
  return '/user/dashboard'
}
