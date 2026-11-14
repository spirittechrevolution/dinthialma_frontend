import { lazy, Suspense, ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { ProtectedRoute } from './ProtectedRoute'
import { DesktopShell } from '@/components/layout/DesktopShell'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { RoleRoute } from './RoleRoute'
import { UserRole } from '@/types/common'
import { getAccessToken, getUserPhone, getPinConfigured, isTokenExpired, getAuthUser } from '@/lib/tokenStorage'
import { getHomePath } from '@/lib/homePath'
import { useAuth } from '@/hooks/useAuth'
import { isMobilePWA, hasSeenOnboarding } from '@/pages/OnboardingPage'

function S({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    }>
      {children}
    </Suspense>
  )
}

/**
 * Écran connecté membre / gestionnaire : protection + coque desktop (barre latérale ≥ 1024 px).
 * Le Suspense est à l'intérieur de la coque : la barre latérale reste affichée pendant le chargement d'un écran.
 */
function P({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DesktopShell><S>{children}</S></DesktopShell>
    </ProtectedRoute>
  )
}

/**
 * Même URL, écran différent selon la largeur : sur desktop, un détail (membre, tour) s'ouvre
 * dans le panneau de droite de sa liste ; sur mobile / PWA, en plein écran.
 */
function SelonEcran({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  return <>{useIsDesktop() ? desktop : mobile}</>
}

/**
 * Composant de démarrage — décide de la destination au lancement de l'app :
 *
 * 0. PWA mobile + première ouverture → onboarding
 * 1. Token valide                    → accueil du rôle
 * 2. Phone stocké + PIN configuré   → écran PIN
 * 3. Sinon                           → login complet
 */
function StartRoute() {
  const access = getAccessToken()
  const phone  = getUserPhone()

  // 0. PWA mobile, première ouverture → onboarding
  if (isMobilePWA() && !hasSeenOnboarding()) {
    return <Navigate to="/onboarding" replace />
  }

  // 1. Token valide → accueil correspondant au rôle
  if (access && !isTokenExpired(access)) {
    return <Navigate to={getHomePath(getAuthUser(access)?.roles)} replace />
  }

  // 2. Phone connu + PIN configuré (ou état inconnu = ancien localStorage) → écran PIN
  if (phone && getPinConfigured() !== false) {
    return <Navigate to="/pin" replace />
  }

  // 3. Sinon → login complet
  return <Navigate to="/login" replace />
}

/**
 * `/dashboard` (ancienne URL, favoris, PWA installées) → accueil du rôle réel.
 * Avant, cette route affichait le tableau de bord Super Admin à tout utilisateur connecté.
 */
function HomeRedirect() {
  const { user } = useAuth()
  const roles = user?.roles ?? getAuthUser(getAccessToken() ?? undefined)?.roles
  return <Navigate to={getHomePath(roles)} replace />
}

/** Anciennes adresses de détail tontine (/admin|/member|/superadmin/tontines/:id) → fiche unique */
function TontineRedirect() {
  const { id } = useParams()
  return <Navigate to={`/tontine/${id}`} replace />
}

// Publiques
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const PinLoginPage = lazy(() => import('@/pages/auth/PinLoginPage').then(m => ({ default: m.PinLoginPage })))
const PinSetupPage = lazy(() => import('@/pages/auth/PinSetupPage').then(m => ({ default: m.PinSetupPage })))
const PinResetPage = lazy(() => import('@/pages/auth/PinResetPage').then(m => ({ default: m.PinResetPage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

// Protégées
const ParametresPage = lazy(() => import('@/pages/parametres/ParametresPage').then(m => ({ default: m.ParametresPage })))

// Super Admin
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/Dashboard').then(m => ({ default: m.SuperAdminDashboard })))
const UsersPage = lazy(() => import('@/pages/superadmin/UsersPage').then(m => ({ default: m.UsersPage })))
const AllTontinesPage = lazy(() => import('@/pages/superadmin/AllTontinesPage').then(m => ({ default: m.AllTontinesPage })))
const AllContributionsPage = lazy(() => import('@/pages/superadmin/AllContributionsPage').then(m => ({ default: m.AllContributionsPage })))
const CodeListPage = lazy(() => import('@/pages/superadmin/CodeListPage').then(m => ({ default: m.CodeListPage })))

// Page détail tontine unifiée (SuperAdmin + Admin + Membre)

// Accueil-hub (brief v2)
const HomePage = lazy(() => import('@/pages/home/HomePage').then(m => ({ default: m.HomePage })))
const MesJackpotsPage = lazy(() => import('@/pages/home/MesJackpotsPage').then(m => ({ default: m.MesJackpotsPage })))
const PayerPage = lazy(() => import('@/pages/pay/PayerPage').then(m => ({ default: m.PayerPage })))
const RecuPage = lazy(() => import('@/pages/pay/RecuPage').then(m => ({ default: m.RecuPage })))
const AValiderPage = lazy(() => import('@/pages/gestion/AValiderPage').then(m => ({ default: m.AValiderPage })))
const EncaisserPage = lazy(() => import('@/pages/gestion/EncaisserPage').then(m => ({ default: m.EncaisserPage })))
const FicheTontinePage = lazy(() => import('@/pages/tontine/FicheTontinePage').then(m => ({ default: m.FicheTontinePage })))
const ToursPage = lazy(() => import('@/pages/tontine/ToursPage').then(m => ({ default: m.ToursPage })))
const TourPage = lazy(() => import('@/pages/tontine/TourPage').then(m => ({ default: m.TourPage })))
const MembresTontinePage = lazy(() => import('@/pages/tontine/MembresTontinePage').then(m => ({ default: m.MembresTontinePage })))
const MembreFichePage = lazy(() => import('@/pages/tontine/MembreFichePage').then(m => ({ default: m.MembreFichePage })))
const ReglagesTontinePage = lazy(() => import('@/pages/tontine/ReglagesTontinePage').then(m => ({ default: m.ReglagesTontinePage })))
const CreerTontinePage = lazy(() => import('@/pages/tontine/CreerTontinePage').then(m => ({ default: m.CreerTontinePage })))
const ModifierTontinePage = lazy(() => import('@/pages/tontine/ModifierTontinePage').then(m => ({ default: m.ModifierTontinePage })))
const ScannerPage = lazy(() => import('@/pages/qr/ScannerPage').then(m => ({ default: m.ScannerPage })))
const PartagerPage = lazy(() => import('@/pages/qr/PartagerPage').then(m => ({ default: m.PartagerPage })))
const MembreQrPage = lazy(() => import('@/pages/qr/MembreQrPage').then(m => ({ default: m.MembreQrPage })))
const InvitationPage = lazy(() => import('@/pages/qr/InvitationPage').then(m => ({ default: m.InvitationPage })))

// Admin

// Member
const MesTontinesPage = lazy(() => import('@/pages/tontine/MesTontinesPage').then(m => ({ default: m.MesTontinesPage })))
const HistoriquePage = lazy(() => import('@/pages/home/HistoriquePage').then(m => ({ default: m.HistoriquePage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })))

const router = createBrowserRouter([
  // ── Démarrage intelligent ─────────────────────────────────────────────────
  { path: '/', element: <StartRoute /> },

  // ── Onboarding PWA mobile (première ouverture) ────────────────────────────
  { path: '/onboarding', element: <S><OnboardingPage /></S> },

  // ── Auth publique ─────────────────────────────────────────────────────────
  { path: '/login', element: <S><LoginPage /></S> },
  { path: '/register', element: <S><RegisterPage /></S> },
  { path: '/forgot-password', element: <S><ForgotPasswordPage /></S> },

  // ── Flux PIN ──────────────────────────────────────────────────────────────
  { path: '/pin', element: <S><PinLoginPage /></S> },
  { path: '/pin/setup', element: <ProtectedRoute><S><PinSetupPage /></S></ProtectedRoute> },
  { path: '/pin/reset', element: <S><PinResetPage /></S> },

  // Accueil générique → redirige selon le rôle
  {
    path: '/dashboard',
    element: <ProtectedRoute><HomeRedirect /></ProtectedRoute>,
  },

  // Accueil-hub : membres, gestionnaires, nouveaux inscrits
  {
    path: '/accueil',
    element: <P><HomePage /></P>,
  },
  {
    path: '/jackpots',
    element: <P><MesJackpotsPage /></P>,
  },
  {
    path: '/payer',
    element: <P><PayerPage /></P>,
  },
  {
    path: '/payer/:tontineId',
    element: <P><PayerPage /></P>,
  },
  {
    path: '/recu/:tontineId/:cotisationId',
    element: <P><RecuPage /></P>,
  },
  // Gestionnaire : le rôle se vérifie par tontine (créateur), pas par le rôle global du jeton
  {
    path: '/a-valider',
    element: <P><AValiderPage /></P>,
  },
  {
    path: '/encaisser',
    element: <P><EncaisserPage /></P>,
  },
  {
    path: '/encaisser/:tontineId',
    element: <P><EncaisserPage /></P>,
  },
  {
    path: '/creer',
    element: <P><CreerTontinePage /></P>,
  },
  // QR : scanner, partager, liens encodés dans les QR (ouvrables par l'appareil photo du téléphone)
  {
    path: '/scanner',
    element: <P><ScannerPage /></P>,
  },
  {
    path: '/partager',
    element: <P><PartagerPage /></P>,
  },
  {
    path: '/q/:token',
    element: <P><MembreQrPage /></P>,
  },
  // Invitation : publique (ouverte depuis un QR même sans compte)
  { path: '/q/t/:id', element: <S><InvitationPage /></S> },
  // Fiche tontine (vue gestionnaire / membre / lecture selon la tontine)
  {
    path: '/tontine/:id',
    element: <P><FicheTontinePage /></P>,
  },
  {
    path: '/tontine/:id/tours',
    element: <P><ToursPage /></P>,
  },
  {
    path: '/tontine/:id/tours/:cycleId',
    element: <P><SelonEcran desktop={<ToursPage />} mobile={<TourPage />} /></P>,
  },
  {
    path: '/tontine/:id/membres',
    element: <P><MembresTontinePage /></P>,
  },
  {
    path: '/tontine/:id/membres/:membreId',
    element: <P><SelonEcran desktop={<MembresTontinePage />} mobile={<MembreFichePage />} /></P>,
  },
  {
    path: '/tontine/:id/reglages',
    element: <P><ReglagesTontinePage /></P>,
  },
  {
    path: '/tontine/:id/modifier',
    element: <P><ModifierTontinePage /></P>,
  },

  // Super Admin
  {
    path: '/superadmin/dashboard',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><SuperAdminDashboard /></S></RoleRoute>,
  },
  {
    path: '/superadmin/users',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><UsersPage /></S></RoleRoute>,
  },
  {
    path: '/superadmin/tontines',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><AllTontinesPage /></S></RoleRoute>,
  },
  {
    path: '/superadmin/tontines/:id',
    element: <TontineRedirect />,
  },
  {
    path: '/superadmin/cotisations',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><AllContributionsPage /></S></RoleRoute>,
  },
  {
    path: '/superadmin/code-list',
    element: <RoleRoute requiredRoles={[UserRole.SUPER_ADMIN]}><S><CodeListPage /></S></RoleRoute>,
  },

  // Admin
  {
    // Ancien tableau de bord gestionnaire → accueil-hub
    path: '/admin/dashboard',
    element: <Navigate to="/accueil" replace />,
  },
  { path: '/admin/tontines', element: <Navigate to="/tontines?section=gere" replace /> },
  { path: '/admin/tontines/:id', element: <TontineRedirect /> },
  // Anciennes pages globales gestionnaire → nouveaux écrans
  { path: '/admin/cotisations', element: <Navigate to="/a-valider" replace /> },
  { path: '/admin/membres', element: <Navigate to="/tontines?section=gere" replace /> },
  { path: '/admin/cycles', element: <Navigate to="/tontines?section=gere" replace /> },
  // User (rôle USER — pas encore membre)
  {
    // Ancien accueil nouvel inscrit → accueil-hub
    path: '/user/dashboard',
    element: <Navigate to="/accueil" replace />,
  },

  // Member (ADMIN inclus — un admin est souvent aussi membre de ses tontines)
  {
    // Ancien tableau de bord membre → accueil-hub
    path: '/member/dashboard',
    element: <Navigate to="/accueil" replace />,
  },
  { path: '/member/tontines', element: <Navigate to="/tontines?section=cotise" replace /> },
  {
    path: '/member/tontines/:id',
    element: <TontineRedirect />,
  },
  { path: '/member/cotisations', element: <Navigate to="/historique" replace /> },

  // Listes (brief v2)
  {
    path: '/tontines',
    element: <P><MesTontinesPage /></P>,
  },
  {
    path: '/historique',
    element: <P><HistoriquePage /></P>,
  },

  // Profil
  {
    path: '/parametres',
    element: <P><ParametresPage /></P>,
  },
  // Ancienne page profil → Paramètres
  { path: '/profile', element: <Navigate to="/parametres" replace /> },

  // Notifications (toutes les rôles)
  {
    path: '/notifications',
    element: <P><NotificationsPage /></P>,
  },

  // Catch-all → démarrage (accueil si connecté, PIN ou connexion sinon)
  { path: '*', element: <Navigate to="/" replace /> },
])

export function Router() {
  return <RouterProvider router={router} />
}
