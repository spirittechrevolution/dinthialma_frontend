/**
 * T10 — Invitation à une tontine (/q/t/:code), ouverte par un QR ou un lien, même sans compte.
 *
 * Aperçu public : `GET /v1/public/invitations/{code}` (code insensible à la casse). Le JWT est envoyé
 * s'il existe : on sait alors si je suis déjà membre / gestionnaire, ou si ma demande est en attente.
 * « Demander à rejoindre » : `POST /v1/invitations/{code}/demandes` (connexion requise).
 * Sans compte : l'invitation est mémorisée et rouverte après connexion / inscription.
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Users, LogIn, UserPlus, CheckCircle2, RotateCw, Calendar, Clock } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/Section'
import { LogoIcon } from '@/components/ui/LogoIcon'
import { qrService } from '@/services/qrService'
import { getAccessToken, isTokenExpired } from '@/lib/tokenStorage'
import { formatF, formatDateCourte, safeSet } from '@/lib/format'
import { rythmeCourt } from '@/lib/tontineLabels'
import { parseApiError, messageErreur } from '@/lib/apiError'
import { INVITATION_EN_ATTENTE_KEY } from '@/lib/share'

export function InvitationPage() {
  const { id: code = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const token = getAccessToken()
  const connecte = !!token && !isTokenExpired(token)
  const [message, setMessage] = useState('')

  const apercu = useQuery({
    queryKey: ['invitation-apercu', code, connecte],
    queryFn: () => qrService.apercuInvitation(code),
    enabled: !!code,
    retry: false,
  })
  const demande = useMutation({ mutationFn: () => qrService.demanderAdhesion(code, message.trim() || undefined) })

  const memoriser = () => safeSet(INVITATION_EN_ATTENTE_KEY, `${location.pathname}${location.search}`)
  const a = apercu.data
  const codeErreurApercu = apercu.isError ? parseApiError(apercu.error).code : null
  const dejaMembre = demande.isError && parseApiError(demande.error).code === 'MEMBER_ALREADY_IN_TONTINE'
  const dejaDemande = demande.isError && parseApiError(demande.error).code === 'DEMANDE_DEJA_EN_ATTENTE'

  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-2">
          <LogoIcon size={28} />
          <span className="font-bold text-neutral-900">Dinthialma</span>
        </div>

        {apercu.isLoading ? (
          <div className="mt-6 h-64 rounded-3xl bg-white animate-pulse" aria-busy="true" />
        ) : apercu.isError ? (
          <section className="mt-6 bg-white rounded-3xl shadow-sm p-6 text-center">
            <p className="text-lg font-bold text-neutral-900">
              {codeErreurApercu === 'NOT_FOUND' ? "Cette invitation n'est plus valable" : "Impossible d'afficher l'invitation"}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {codeErreurApercu === 'NOT_FOUND' ? 'Demandez un nouveau lien au gestionnaire.' : 'Vérifiez votre connexion puis réessayez.'}
            </p>
            {codeErreurApercu !== 'NOT_FOUND' && (
              <button onClick={() => apercu.refetch()} className="mt-4 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
            )}
          </section>
        ) : a ? (
          <>
            <section className="mt-6 bg-white rounded-3xl shadow-sm p-6 text-center">
              <p className="text-sm font-semibold text-neutral-500">Vous êtes invité à rejoindre</p>
              <div className="mt-4 flex justify-center"><InitialsAvatar name={a.nom} size={64} /></div>
              <h1 className="mt-3 text-2xl font-extrabold text-neutral-900">{a.nom}</h1>
              <p className="mt-1 text-lg font-semibold text-neutral-700">
                {a.montantLibre
                  ? `Montant libre${a.montantMinimum ? ` · minimum ${formatF(a.montantMinimum)}` : ''}`
                  : `${formatF(a.montant)}${a.frequence ? ` / ${rythmeCourt(a.frequence)}` : ''}`}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                {a.gestionnairePrenom && <span className="inline-flex items-center gap-1.5"><Users size={15} /> Gérée par {a.gestionnairePrenom}</span>}
                {a.dateEcheance && <span className="inline-flex items-center gap-1.5"><Calendar size={15} /> {a.nomEvenement ?? 'Événement'} le {formatDateCourte(a.dateEcheance)}</span>}
                {a.placesRestantes != null && <span>{a.placesRestantes} place{a.placesRestantes > 1 ? 's' : ''} restante{a.placesRestantes > 1 ? 's' : ''}</span>}
              </div>
              {!a.ouverte && !a.tontineId && (
                <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Cette tontine n'accepte pas de nouveaux membres pour le moment.
                </p>
              )}
            </section>

            {connecte && a.tontineId ? (
              <section className="mt-4 bg-white rounded-3xl shadow-sm p-6 text-center">
                <span className="mx-auto w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center"><CheckCircle2 size={32} /></span>
                <p className="mt-3 text-lg font-bold text-neutral-900">{a.estGestionnaire ? 'Vous gérez cette tontine' : 'Vous êtes déjà membre'}</p>
                <button onClick={() => navigate(`/tontine/${a.tontineId}`, { replace: true })} className="mt-5 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold">Ouvrir la tontine</button>
              </section>
            ) : connecte && (a.demandeEnAttente || dejaDemande) && !demande.isSuccess ? (
              <section className="mt-4 bg-white rounded-3xl shadow-sm p-6 text-center">
                <span className="mx-auto w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Clock size={30} /></span>
                <p className="mt-3 text-lg font-bold text-neutral-900">Demande déjà envoyée</p>
                <p className="mt-1 text-sm text-neutral-500">Le gestionnaire ne l'a pas encore examinée. Vous serez prévenu dans vos alertes.</p>
                <button onClick={() => navigate('/tontines', { replace: true })} className="mt-5 w-full h-12 rounded-full bg-neutral-100 font-semibold text-neutral-800">Voir mes demandes</button>
              </section>
            ) : demande.isSuccess ? (
              <section className="mt-4 bg-white rounded-3xl shadow-sm p-6 text-center">
                <span className="mx-auto w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center animate-pop"><CheckCircle2 size={32} /></span>
                <p className="mt-3 text-lg font-bold text-neutral-900">Demande envoyée</p>
                <p className="mt-1 text-sm text-neutral-500">Le gestionnaire va l'examiner. Vous serez prévenu dans vos alertes.</p>
                <button onClick={() => navigate('/accueil', { replace: true })} className="mt-5 w-full h-12 rounded-full bg-primary-700 text-white font-bold">Retour à l'accueil</button>
              </section>
            ) : a.ouverte && (
              <section className="mt-4 space-y-3">
                {connecte ? (
                  <>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                      rows={2}
                      placeholder="Un mot pour le gestionnaire (facultatif)"
                      className="w-full px-4 py-3 rounded-2xl bg-white shadow-sm text-[16px] resize-none outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    {demande.isError && (
                      <p role="alert" className="px-1 text-sm font-medium text-red-700">
                        {messageErreur(demande.error, "La demande n'a pas pu être envoyée.")}
                      </p>
                    )}
                    {dejaMembre ? (
                      <button onClick={() => navigate('/tontines', { replace: true })} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold">Voir mes tontines</button>
                    ) : (
                      <button onClick={() => demande.mutate()} disabled={demande.isPending} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
                        {demande.isPending ? 'Envoi…' : 'Demander à rejoindre'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="px-2 text-center text-sm text-neutral-500">Connectez-vous ou créez un compte pour demander à rejoindre.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/register" onClick={memoriser} className="h-12 rounded-full bg-primary-700 text-white font-bold inline-flex items-center justify-center gap-2">
                        <UserPlus size={18} /> Créer un compte
                      </Link>
                      <Link to="/login" onClick={memoriser} className="h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
                        <LogIn size={18} /> Se connecter
                      </Link>
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
