/**
 * A3 — Paramètres (gabarit « Paramètres » de Wave) : sections Compte · Partager · Aide · Sécurité · Application.
 * Remplace l'ancienne page Profil.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import {
  User, Phone, Users2, Share2, HelpCircle, KeyRound, Lock, EyeOff, Download, LogOut, ChevronRight, ShieldCheck,
} from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useMesRoles } from '@/hooks/useMe'
import { useLocalPreference } from '@/hooks/useLocalPreference'
import { useOnline } from '@/hooks/useOnline'
import { usePWA } from '@/hooks/usePWA'
import { userService } from '@/services/userService'
import { authService } from '@/services/authService'
import { clearAll } from '@/lib/tokenStorage'
import { formatPhoneLocal, toLocalPhone } from '@/lib/phone'
import { messageErreur } from '@/lib/apiError'
import { jeCotise, jeGere } from '@/types/me'
import pkg from '../../../package.json'

type Feuille = 'infos' | 'numero' | 'motdepasse' | 'aide' | 'deconnexion' | 'changer' | 'ios' | null

export function ParametresPage() {
  const navigate = useNavigate()
  const online = useOnline()
  const { logout, logoutComplet } = useAuth()
  const roles = useMesRoles()
  const { canInstall, triggerInstall, isIOS, isInstalled } = usePWA()
  const [hiddenPref, setHiddenPref] = useLocalPreference<'0' | '1'>('dinthialma_hide_amount', '0', ['0', '1'] as const)
  const [feuille, setFeuille] = useState<Feuille>(null)
  const { data: profil, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => userService.getProfile() })

  const nom = profil ? `${profil.firstName} ${profil.lastName}`.trim() : ''
  const nbGere = roles.tontines.filter(jeGere).length
  const nbCotise = roles.tontines.filter(jeCotise).length
  const resume = [
    nbGere ? `Gestionnaire de ${nbGere} tontine${nbGere > 1 ? 's' : ''}` : null,
    nbCotise ? `Membre de ${nbCotise}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="Paramètres" />
      <main className="px-4 pb-10 max-w-lg mx-auto space-y-5">
        <section className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-4">
          {isLoading ? (
            <span className="w-16 h-16 rounded-full bg-neutral-100 animate-pulse" />
          ) : (
            <InitialsAvatar name={nom || '?'} size={64} />
          )}
          <div className="min-w-0">
            <p className="text-lg font-bold text-neutral-900 truncate">{nom || '—'}</p>
            <p className="text-sm text-neutral-500">{formatPhoneLocal(profil?.phone)}</p>
            {resume && <p className="text-sm text-neutral-600 mt-0.5">{resume}</p>}
            {profil?.pinConfigured && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-800">
                <ShieldCheck size={12} /> Code secret actif
              </span>
            )}
          </div>
        </section>

        <Section titre="Compte">
          <Ligne icon={<User size={20} />} label="Mes informations" onClick={() => setFeuille('infos')} />
          <Ligne icon={<Phone size={20} />} label="Numéro de téléphone" valeur={formatPhoneLocal(profil?.phone)} onClick={() => setFeuille('numero')} />
          <Ligne icon={<Users2 size={20} />} label="Changer de compte" onClick={() => setFeuille('changer')} />
        </Section>

        <Section titre="Partager">
          <Ligne icon={<Share2 size={20} />} label="Inviter un proche à rejoindre Dinthialma" onClick={() => navigate('/partager')} />
        </Section>

        <Section titre="Aide">
          <Ligne icon={<HelpCircle size={20} />} label="Comment ça marche" onClick={() => setFeuille('aide')} />
        </Section>

        <Section titre="Sécurité">
          <Ligne icon={<KeyRound size={20} />} label={profil?.pinConfigured ? 'Modifier mon code secret' : 'Créer mon code secret'} onClick={() => navigate('/pin/setup')} />
          <Ligne icon={<Lock size={20} />} label="Modifier mon mot de passe" onClick={() => setFeuille('motdepasse')} />
        </Section>

        <Section titre="Application">
          <label className="flex items-center gap-3 px-4 min-h-[56px]">
            <span className="text-neutral-600"><EyeOff size={20} /></span>
            <span className="flex-1 text-[15px] text-neutral-800">Masquer les montants</span>
            <input
              type="checkbox"
              checked={hiddenPref === '1'}
              onChange={(e) => setHiddenPref(e.target.checked ? '1' : '0')}
              className="w-6 h-6 accent-primary-700"
            />
          </label>
          {!isInstalled && (canInstall || isIOS) && (
            <Ligne icon={<Download size={20} />} label="Installer l'application" onClick={() => (canInstall ? triggerInstall() : setFeuille('ios'))} />
          )}
          <Ligne icon={<LogOut size={20} />} label="Se déconnecter" danger onClick={() => setFeuille('deconnexion')} />
        </Section>

        <p className="text-center text-xs text-neutral-400">Dinthialma · version {pkg.version}</p>
      </main>

      {/* Mes informations */}
      {feuille === 'infos' && profil && (
        <InfosSheet
          initial={{ firstName: profil.firstName, lastName: profil.lastName, email: profil.email ?? '' }}
          onClose={() => setFeuille(null)}
          online={online}
        />
      )}
      {feuille === 'numero' && <NumeroSheet onClose={() => setFeuille(null)} online={online} />}
      {feuille === 'motdepasse' && profil && <MotDePasseSheet phone={profil.phone} onClose={() => setFeuille(null)} online={online} />}

      <Modal isOpen={feuille === 'aide'} onClose={() => setFeuille(null)} title="Comment ça marche" size="sm">
        <ol className="space-y-4">
          {[
            ['Rejoignez ou créez', 'Un proche vous ajoute avec votre numéro, ou vous créez votre tontine.'],
            ['Cotisez à chaque tour', 'Payez par Wave, Orange Money, Free Money ou en espèces, puis appuyez sur « J\'ai payé ».'],
            ['Le gestionnaire valide', 'Vous recevez une alerte et un reçu.'],
            ['Recevez le jackpot', 'Quand vient votre tour, la cagnotte est pour vous.'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="w-8 h-8 rounded-full bg-primary-700 text-white font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span><b className="block text-neutral-900">{t}</b><span className="text-sm text-neutral-600">{d}</span></span>
            </li>
          ))}
        </ol>
      </Modal>

      <Modal isOpen={feuille === 'ios'} onClose={() => setFeuille(null)} title="Installer l'application" size="sm">
        <ol className="space-y-2 text-neutral-700">
          <li>1. Appuyez sur <b>Partager</b> en bas de Safari.</li>
          <li>2. Choisissez <b>Sur l'écran d'accueil</b>.</li>
        </ol>
      </Modal>

      <Modal isOpen={feuille === 'changer'} onClose={() => setFeuille(null)} title="Changer de compte ?" size="sm">
        <p className="text-neutral-600">Vous serez déconnecté et cet appareil sera oublié. Vous pourrez vous connecter avec un autre numéro.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={() => setFeuille(null)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
          <button onClick={() => logoutComplet()} className="h-12 rounded-full bg-primary-700 text-white font-bold">Changer</button>
        </div>
      </Modal>

      <Modal isOpen={feuille === 'deconnexion'} onClose={() => setFeuille(null)} title="Se déconnecter" size="sm">
        <div className="space-y-3">
          <button onClick={() => logout()} className="w-full rounded-2xl border-2 border-neutral-200 p-4 text-left">
            <b className="block text-neutral-900">Garder cet appareil</b>
            <span className="text-sm text-neutral-600">Vous reviendrez avec votre code secret.</span>
          </button>
          <button onClick={() => logoutComplet()} className="w-full rounded-2xl border-2 border-red-200 p-4 text-left">
            <b className="block text-red-700">Oublier cet appareil</b>
            <span className="text-sm text-neutral-600">Recommandé sur un téléphone partagé. Il faudra votre mot de passe.</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Feuilles ────────────────────────────────────────────────────────────────

const champ = 'mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600'

function InfosSheet({ initial, onClose, online }: { initial: { firstName: string; lastName: string; email: string }; onClose: () => void; online: boolean }) {
  const qc = useQueryClient()
  const [v, setV] = useState(initial)
  const erreurs = {
    firstName: v.firstName.trim().length < 2 ? 'Au moins 2 caractères' : v.firstName.trim().length > 50 ? '50 caractères maximum' : null,
    lastName: v.lastName.trim().length < 2 ? 'Au moins 2 caractères' : v.lastName.trim().length > 50 ? '50 caractères maximum' : null,
    email: v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? 'Email invalide' : null,
  }
  const invalide = Object.values(erreurs).some(Boolean)
  const { mutate, isPending } = useMutation({
    mutationFn: () => userService.updateProfile({ firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim() || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Enregistré'); onClose() },
    onError: () => toast.error("L'enregistrement a échoué"),
  })
  return (
    <Modal isOpen onClose={onClose} title="Mes informations" size="sm">
      <div className="space-y-3">
        {(['firstName', 'lastName'] as const).map((k) => (
          <label key={k} className="block">
            <span className="text-sm font-semibold text-neutral-700">{k === 'firstName' ? 'Prénom' : 'Nom'}</span>
            <input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} autoCapitalize="words" className={champ} />
            {erreurs[k] && <span className="text-sm text-red-700">{erreurs[k]}</span>}
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Email (facultatif)</span>
          <input value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} type="email" inputMode="email" className={champ} />
          {erreurs.email && <span className="text-sm text-red-700">{erreurs.email}</span>}
        </label>
        <button onClick={() => mutate()} disabled={invalide || isPending || !online} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

function NumeroSheet({ onClose, online }: { onClose: () => void; online: boolean }) {
  const [etape, setEtape] = useState<1 | 2>(1)
  const [numero, setNumero] = useState('')
  const [code, setCode] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const local = toLocalPhone(numero)
  const e164 = `+221${local}`

  const envoyer = async () => {
    if (local.length !== 9) { setErreur('Numéro à 9 chiffres'); return }
    setChargement(true); setErreur(null)
    try {
      await userService.requestPhoneChange({ newPhone: e164 })
      setEtape(2)
    } catch (err) {
      setErreur(messageErreur(err, "Impossible d'envoyer le code."))
    } finally { setChargement(false) }
  }
  const verifier = async () => {
    if (!/^\d{6}$/.test(code)) { setErreur('Code à 6 chiffres'); return }
    setChargement(true); setErreur(null)
    try {
      await userService.verifyPhoneChange({ newPhone: e164, code })
      toast.success('Numéro modifié — reconnectez-vous avec le nouveau numéro')
      clearAll()
      setTimeout(() => { window.location.href = '/login' }, 1200)
    } catch {
      setErreur('Code incorrect ou expiré.')
      setChargement(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Changer de numéro" size="sm">
      {etape === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">Un code sera envoyé par SMS sur le nouveau numéro.</p>
          <div className="flex gap-2">
            <span className="h-12 px-3 rounded-2xl bg-neutral-100 flex items-center font-semibold">+221</span>
            <input value={numero} onChange={(e) => setNumero(e.target.value.replace(/[^\d ]/g, ''))} inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" className="flex-1 h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600" />
          </div>
          {erreur && <p role="alert" className="text-sm text-red-700">{erreur}</p>}
          <button onClick={envoyer} disabled={chargement || !online} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
            {chargement ? 'Envoi…' : 'Recevoir le code'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">Code envoyé au <b>{formatPhoneLocal(local)}</b>. Vous devrez ensuite vous reconnecter.</p>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" autoFocus className={clsx(champ, 'text-center tracking-[0.4em] text-xl')} aria-label="Code reçu par SMS" />
          {erreur && <p role="alert" className="text-sm text-red-700">{erreur}</p>}
          <button onClick={verifier} disabled={chargement || code.length !== 6} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
            {chargement ? 'Vérification…' : 'Confirmer'}
          </button>
          <button onClick={() => { setEtape(1); setCode('') }} className="w-full h-11 text-sm font-semibold text-neutral-600">Modifier le numéro</button>
        </div>
      )}
    </Modal>
  )
}

function MotDePasseSheet({ phone, onClose, online }: { phone: string; onClose: () => void; online: boolean }) {
  const e164 = `+221${toLocalPhone(phone)}`
  const [etape, setEtape] = useState<1 | 2>(1)
  const [code, setCode] = useState('')
  const [mdp, setMdp] = useState('')
  const [voir, setVoir] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const envoyer = async () => {
    setChargement(true); setErreur(null)
    try { await authService.sendForgotPasswordOtp({ phone: e164 }) } catch { /* réponse identique (anti-énumération) */ }
    setChargement(false)
    setEtape(2)
  }
  const valider = async () => {
    if (!/^\d{6}$/.test(code)) { setErreur('Code à 6 chiffres'); return }
    if (mdp.length < 8) { setErreur('Au moins 8 caractères'); return }
    setChargement(true); setErreur(null)
    try {
      await authService.verifyForgotPasswordOtp({ phone: e164, code })
      await authService.resetPassword({ phone: e164, code, newPassword: mdp })
      toast.success('Mot de passe modifié')
      onClose()
    } catch {
      setErreur('Code incorrect ou expiré.')
    } finally { setChargement(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title="Modifier mon mot de passe" size="sm">
      {etape === 1 ? (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">Un code sera envoyé par SMS au <b>{formatPhoneLocal(phone)}</b>.</p>
          <button onClick={envoyer} disabled={chargement || !online} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
            {chargement ? 'Envoi…' : 'Recevoir le code'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="Code reçu" autoFocus className={clsx(champ, 'text-center tracking-[0.4em] text-xl')} aria-label="Code reçu par SMS" />
          <div className="relative">
            <input value={mdp} onChange={(e) => setMdp(e.target.value)} type={voir ? 'text' : 'password'} autoComplete="new-password" placeholder="Nouveau mot de passe" className={champ} aria-label="Nouveau mot de passe" />
            <button type="button" onClick={() => setVoir((x) => !x)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-sm font-semibold text-neutral-600">{voir ? 'Masquer' : 'Afficher'}</button>
          </div>
          {erreur && <p role="alert" className="text-sm text-red-700">{erreur}</p>}
          <button onClick={valider} disabled={chargement || !online} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
            {chargement ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button onClick={envoyer} disabled={chargement} className="w-full h-11 text-sm font-semibold text-neutral-600">Renvoyer le code</button>
        </div>
      )}
    </Modal>
  )
}

// ─── Mise en page ────────────────────────────────────────────────────────────

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-1 mb-2 text-sm font-semibold text-neutral-500">{titre}</h2>
      <div className="bg-white rounded-3xl shadow-sm divide-y divide-neutral-100 overflow-hidden">{children}</div>
    </section>
  )
}

function Ligne({ icon, label, valeur, onClick, danger }: { icon: JSX.Element; label: string; valeur?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-neutral-50">
      <span className={danger ? 'text-red-600' : 'text-neutral-600'}>{icon}</span>
      <span className={clsx('flex-1 text-[15px]', danger ? 'text-red-700 font-medium' : 'text-neutral-800')}>{label}</span>
      {valeur && <span className="text-sm text-neutral-500">{valeur}</span>}
      {!danger && <ChevronRight size={18} className="text-neutral-300" />}
    </button>
  )
}
