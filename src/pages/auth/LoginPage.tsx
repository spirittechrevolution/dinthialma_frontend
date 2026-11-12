/**
 * Connexion en deux étapes (un écran, une question, comme Wave) :
 * 1. le numéro (formaté pendant la saisie, « Continuer » actif à 9 chiffres) ;
 * 2. le mot de passe (numéro rappelé en pastille, touchée = retour à l'étape 1).
 *
 * - Numéro déjà connu sur l'appareil → on arrive directement à l'étape 2.
 * - Pas de vérification d'existence du numéro à l'étape 1 (volontaire : ne pas permettre
 *   de tester quels numéros sont inscrits) ; l'erreur éventuelle arrive après le mot de passe.
 * - Le numéro reste dans le formulaire de l'étape 2 (champ caché `username`) pour que les
 *   gestionnaires de mots de passe enregistrent et remplissent correctement l'identifiant.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/common'
import { getHomePath } from '@/lib/homePath'
import { consommerRetour } from '@/lib/retour'
import { getUserPhone } from '@/lib/tokenStorage'
import { parseApiError, messageErreur } from '@/lib/apiError'
import { Button } from '@/components/ui/Button'
import { AuthShell, AuthAlert } from '@/components/auth/AuthShell'

const INDICATIF = '221'
const LONGUEUR = 9

/** « 771234567 » → « 77 123 45 67 » */
function formaterNumero(chiffres: string): string {
  const d = chiffres.slice(0, LONGUEUR)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}

/** Numéro mémorisé sur l'appareil (« 221771234567 ») → 9 chiffres locaux, sinon '' */
function numeroMemorise(): string {
  const n = (getUserPhone() ?? '').replace(/\D/g, '')
  if (n.length === INDICATIF.length + LONGUEUR && n.startsWith(INDICATIF)) return n.slice(INDICATIF.length)
  return ''
}

type Etape = 'numero' | 'motdepasse'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const memorise = useRef(numeroMemorise()).current
  const [numero, setNumero] = useState(memorise)
  const [etape, setEtape] = useState<Etape>(memorise ? 'motdepasse' : 'numero')
  const [sens, setSens] = useState<'avant' | 'arriere'>('avant')
  const [motDePasse, setMotDePasse] = useState('')
  const [voirMotDePasse, setVoirMotDePasse] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [essai, setEssai] = useState(0) // relance l'animation « tremblement » à chaque échec
  const [preInscrit, setPreInscrit] = useState<string | null>(null)

  const champNumero = useRef<HTMLInputElement>(null)
  const champMotDePasse = useRef<HTMLInputElement>(null)

  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null
  const succes = state?.registered
    ? 'Compte créé avec succès ! Connectez-vous.'
    : state?.passwordReset
      ? 'Mot de passe réinitialisé. Connectez-vous.'
      : null

  const numeroComplet = `+${INDICATIF}${numero}`
  const numeroValide = numero.length === LONGUEUR

  // Focus du champ de l'étape affichée (le clavier s'ouvre directement)
  useEffect(() => {
    const champ = etape === 'numero' ? champNumero.current : champMotDePasse.current
    champ?.focus({ preventScroll: true })
  }, [etape])

  // Après un échec, le champ est recréé (pour relancer le tremblement) : on y remet le curseur
  useEffect(() => {
    if (essai) champMotDePasse.current?.focus()
  }, [essai])

  const allerA = (e: Etape) => {
    setSens(e === 'motdepasse' ? 'avant' : 'arriere')
    setErreur(null)
    setEtape(e)
  }

  const continuer = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (numeroValide) allerA('motdepasse')
  }

  const redirectAfterLogin = (roles: UserRole[], pinConfigured?: boolean) => {
    if (pinConfigured === false) {
      navigate('/pin/setup', { replace: true })
      return
    }
    navigate(consommerRetour() ?? getHomePath(roles), { replace: true })
  }

  const seConnecter = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!motDePasse || enCours) return
    setErreur(null)
    setEnCours(true)
    try {
      const { user, pinConfigured } = await login(numeroComplet, motDePasse)
      if (user) redirectAfterLogin(user.roles, pinConfigured)
    } catch (err) {
      const { code } = parseApiError(err)
      if (code === 'ACCOUNT_PRE_ENROLLED') {
        setPreInscrit(numeroComplet)
        return
      }
      setErreur(messageErreur(err, 'Connexion impossible. Réessayez.'))
      setMotDePasse('')
      setEssai((n) => n + 1)
    } finally {
      setEnCours(false)
    }
  }

  // ─── Compte créé par un gestionnaire, pas encore activé ────────────────────
  if (preInscrit) {
    return (
      <AuthShell title="Compte non activé" subtitle="Finalisez votre inscription">
        <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
          <AlertCircle size={26} />
        </div>
        <p className="text-[15px] text-neutral-600 mb-4">
          Le numéro <strong className="text-neutral-900">{preInscrit}</strong> existe déjà sur la plateforme.
        </p>
        <div className="mb-6">
          <AuthAlert tone="info">
            Votre compte a été créé par votre gestionnaire. Inscrivez-vous pour accéder à vos tontines.
          </AuthAlert>
        </div>
        <Button className="w-full" size="lg" onClick={() => navigate('/register', { state: { phone: preInscrit } })}>
          S'inscrire maintenant <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => { setPreInscrit(null); setErreur(null); setMotDePasse('') }}
          className="w-full h-11 mt-3 text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          Retour à la connexion
        </button>
      </AuthShell>
    )
  }

  const lienInscription = (
    <p className="text-center text-[15px] text-neutral-500">
      Pas encore de compte ?{' '}
      <Link to="/register" className="text-primary-700 font-bold hover:underline">S'inscrire</Link>
    </p>
  )

  // ─── Étape 1 : le numéro ───────────────────────────────────────────────────
  if (etape === 'numero') {
    return (
      <AuthShell title="Bon retour" subtitle="Entrez votre numéro de téléphone." footer={lienInscription}>
        <div key="numero" className={sens === 'avant' ? 'animate-stepIn' : 'animate-stepBack'}>
          {succes && <div className="mb-4"><AuthAlert tone="success">{succes}</AuthAlert></div>}
          <form onSubmit={continuer} noValidate>
            <label htmlFor="login-numero" className="sr-only">Numéro de téléphone</label>
            <div className="flex items-center h-16 rounded-2xl bg-neutral-100 border-2 border-transparent focus-within:border-primary-600 focus-within:bg-white transition-colors">
              <span className="pl-4 pr-3 flex items-center gap-2 text-[17px] font-semibold text-neutral-700 border-r border-neutral-200 h-8" aria-hidden>
                <span className="text-xl leading-none">🇸🇳</span> +{INDICATIF}
              </span>
              <input
                ref={champNumero}
                id="login-numero"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="77 123 45 67"
                value={formaterNumero(numero)}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, LONGUEUR))}
                className="flex-1 min-w-0 h-full bg-transparent px-3 text-[20px] font-semibold tracking-wide tabular-nums text-neutral-900 placeholder:text-neutral-400 outline-none"
              />
            </div>
            <Button type="submit" className="w-full mt-5" size="lg" disabled={!numeroValide}>
              Continuer <ArrowRight size={18} />
            </Button>
          </form>
        </div>
      </AuthShell>
    )
  }

  // ─── Étape 2 : le mot de passe ─────────────────────────────────────────────
  return (
    <AuthShell
      title={memorise && numero === memorise ? 'Bon retour' : 'Votre mot de passe'}
      subtitle={memorise && numero === memorise ? 'Entrez votre mot de passe pour continuer.' : undefined}
      footer={lienInscription}
    >
      <div key="motdepasse" className={sens === 'avant' ? 'animate-stepIn' : 'animate-stepBack'}>
        {succes && <div className="mb-4"><AuthAlert tone="success">{succes}</AuthAlert></div>}

        {/* Numéro en pastille : toucher = revenir le modifier */}
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => allerA('numero')}
            className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0 hover:bg-neutral-200"
            aria-label="Changer de numéro"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => allerA('numero')}
            className="h-10 pl-4 pr-3 rounded-full bg-neutral-100 text-[15px] font-semibold text-neutral-800 tabular-nums inline-flex items-center gap-2 hover:bg-neutral-200"
          >
            +{INDICATIF} {formaterNumero(numero)} <Pencil size={14} className="text-neutral-500" />
          </button>
        </div>

        <form onSubmit={seConnecter} noValidate>
          {/* Identifiant pour les gestionnaires de mots de passe (non affiché) */}
          <input type="text" name="username" autoComplete="username" value={numeroComplet} readOnly hidden />

          <label htmlFor="login-mdp" className="sr-only">Mot de passe</label>
          <div
            key={essai}
            className={clsx(
              'flex items-center h-16 rounded-2xl border-2 transition-colors',
              erreur ? 'border-red-300 bg-red-50/40 animate-shake' : 'bg-neutral-100 border-transparent focus-within:border-primary-600 focus-within:bg-white',
            )}
          >
            <input
              ref={champMotDePasse}
              id="login-mdp"
              name="password"
              type={voirMotDePasse ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Mot de passe"
              value={motDePasse}
              onChange={(e) => { setMotDePasse(e.target.value); if (erreur) setErreur(null) }}
              aria-invalid={!!erreur}
              aria-describedby={erreur ? 'login-erreur' : undefined}
              className="flex-1 min-w-0 h-full bg-transparent pl-4 text-[18px] text-neutral-900 placeholder:text-neutral-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setVoirMotDePasse((v) => !v)}
              className="w-12 h-12 mr-1 rounded-full flex items-center justify-center text-neutral-500 hover:bg-black/5"
              aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {voirMotDePasse ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {erreur && <p id="login-erreur" role="alert" className="mt-2 px-1 text-sm font-medium text-red-700">{erreur}</p>}

          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-sm text-primary-700 font-semibold hover:underline py-2">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full mt-3" size="lg" loading={enCours} disabled={!motDePasse}>
            Se connecter
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
