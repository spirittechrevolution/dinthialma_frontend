/**
 * T10 — Invitation à une tontine (/q/t/:id), ouverte par un QR ou un lien, même sans compte.
 *
 * Déjà membre → fiche de la tontine. Sinon → infos portées par le lien + « Écrire au gestionnaire
 * sur WhatsApp » (v1). « Demander à rejoindre » arrivera avec l'API (B16 aperçu public, B17 demandes).
 * Sans compte : l'invitation est mémorisée et rouverte après connexion / inscription.
 */
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { MessageCircle, Users, LogIn, UserPlus } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/Section'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { useMaTontine } from '@/hooks/useMe'
import { getAccessToken, getAuthUser, isTokenExpired } from '@/lib/tokenStorage'
import { formatF, safeSet } from '@/lib/format'
import { formatPhoneLocal, toLocalPhone } from '@/lib/phone'
import { rythmeCourt } from '@/lib/tontineLabels'
import { lireInvitation, whatsappUrl, INVITATION_EN_ATTENTE_KEY } from '@/lib/share'

export function InvitationPage() {
  const { id = '' } = useParams()
  const [search] = useSearchParams()
  const location = useLocation()
  const token = getAccessToken()
  const connecte = !!token && !isTokenExpired(token)
  const moi = connecte ? getAuthUser(token ?? undefined) : null
  const ma = useMaTontine(connecte ? id : '')
  const inv = lireInvitation(search)

  // Déjà dans la tontine (membre ou gestionnaire) → sa fiche
  if (connecte && ma.data && ma.data.monRole !== 'LECTURE') return <Navigate to={`/tontine/${id}`} replace />

  const nom = inv.nom ?? 'une tontine'
  const montant = inv.montantLibre ? 'Montant libre' : inv.montant ? `${formatF(inv.montant)}${inv.frequence ? ` / ${rythmeCourt(inv.frequence)}` : ''}` : null
  const tel = inv.gestionnairePhone ? toLocalPhone(inv.gestionnairePhone) : null
  const message = `Bonjour${inv.gestionnairePrenom ? ` ${inv.gestionnairePrenom}` : ''}, je souhaite rejoindre la tontine ${nom}.${moi?.phone ? ` Mon numéro : ${formatPhoneLocal(moi.phone)}.` : ''}`
  const lienWhatsapp = tel ? `https://wa.me/221${tel}?text=${encodeURIComponent(message)}` : whatsappUrl(message)
  const memoriser = () => safeSet(INVITATION_EN_ATTENTE_KEY, `${location.pathname}${location.search}`)

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2">
          <LogoIcon size={28} />
          <span className="font-bold text-neutral-900">Dinthialma</span>
        </div>

        <section className="mt-6 bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-sm font-semibold text-neutral-500">Vous êtes invité à rejoindre</p>
          <div className="mt-4 flex justify-center"><InitialsAvatar name={nom} size={64} /></div>
          <h1 className="mt-3 text-2xl font-extrabold text-neutral-900">{nom}</h1>
          {montant && <p className="mt-1 text-lg font-semibold text-neutral-700">{montant}</p>}
          {inv.gestionnairePrenom && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-500"><Users size={15} /> Gérée par {inv.gestionnairePrenom}</p>
          )}
          {connecte && ma.isLoading && <p className="mt-4 text-sm text-neutral-400">Vérification…</p>}
        </section>

        <section className="mt-4 space-y-3">
          <a
            href={lienWhatsapp}
            target="_blank"
            rel="noreferrer"
            className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} /> {tel ? 'Écrire au gestionnaire' : 'Demander sur WhatsApp'}
          </a>
          <p className="px-2 text-center text-sm text-neutral-500">
            Le gestionnaire vous ajoutera avec votre numéro. Vous serez prévenu par SMS.
          </p>

          {!connecte && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link to="/register" onClick={memoriser} className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
                <UserPlus size={18} /> Créer un compte
              </Link>
              <Link to="/login" onClick={memoriser} className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
                <LogIn size={18} /> Se connecter
              </Link>
            </div>
          )}
          {connecte && (
            <Link to="/accueil" className="block text-center h-12 leading-[3rem] font-semibold text-neutral-600">Retour à l'accueil</Link>
          )}
        </section>
      </div>
    </div>
  )
}
