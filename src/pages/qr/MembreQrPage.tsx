/**
 * /q/:token — QR membre scanné (Scanner ou appareil photo du téléphone).
 * Résolution par le backend : `GET /v1/qr/{token}` → identité (sans téléphone) + mes tontines
 * gérées où la personne est inscrite. Un QR de type TONTINE renvoie vers l'invitation.
 * Ajout direct à une de mes tontines gérées : `POST /v1/tontines/{id}/membres { qrToken }`
 * (le numéro n'est jamais exposé au scan).
 * Aucune action sans confirmation : l'écran Encaisser demande toujours de valider.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, CreditCard, RotateCw, QrCode, UserPlus, CheckCircle2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useAddMembre } from '@/hooks/useMembres'
import { TontineStatut } from '@/types/common'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { useMesTontines } from '@/hooks/useMe'
import { qrService } from '@/services/qrService'
import { parseApiError, messageErreur } from '@/lib/apiError'
import { jeGere, type MaTontine } from '@/types/me'

export function MembreQrPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const mes = useMesTontines()
  const gerees = (mes.data ?? []).filter(jeGere)
  const resolution = useQuery({
    queryKey: ['qr', token],
    queryFn: () => qrService.resoudre(token),
    enabled: !!token,
    retry: false,
  })
  const [cible, setCible] = useState<MaTontine | null>(null)
  const { mutate: ajouter, isPending: ajoutEnCours } = useAddMembre()

  const confirmerAjout = () => {
    if (!cible) return
    const tontine = cible
    ajouter(
      { tontineId: tontine.id, request: { qrToken: token } },
      {
        onSuccess: (membre) => {
          toast.success(`Ajouté à ${tontine.nom}`)
          setCible(null)
          navigate(`/tontine/${tontine.id}/membres/${membre.id}`)
        },
        onError: (err) => {
          const { code } = parseApiError(err)
          toast.error(
            code === 'NOT_FOUND' ? "Ce QR n'est plus valide. Demandez-lui de vous montrer son QR actuel."
              : code === 'FORBIDDEN' ? 'Action réservée au gestionnaire.'
              : messageErreur(err, "L'ajout a échoué. Réessayez."),
          )
          setCible(null)
          if (code === 'MEMBER_ALREADY_IN_TONTINE') resolution.refetch()
        },
      },
    )
  }

  // On attend aussi mes tontines : elles décident entre « Encaisser » direct et « Ajouter à… »
  if (resolution.isLoading || mes.isLoading) {
    return <Shell><div className="space-y-3" aria-busy="true"><div className="h-24 rounded-3xl bg-white animate-pulse" /><div className="h-40 rounded-3xl bg-white animate-pulse" /></div></Shell>
  }
  if (resolution.isError) {
    const { code } = parseApiError(resolution.error)
    return (
      <Shell>
        <Message
          titre={code === 'NOT_FOUND' ? 'QR inconnu ou remplacé' : 'Impossible de lire ce QR'}
          texte={code === 'NOT_FOUND' ? 'Ce QR a peut-être été régénéré par son propriétaire. Demandez-lui de l’afficher à nouveau.' : 'Vérifiez votre connexion puis réessayez.'}
        >
          {code !== 'NOT_FOUND' && (
            <button onClick={() => resolution.refetch()} className="h-12 px-5 rounded-full bg-neutral-100 font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
          )}
        </Message>
      </Shell>
    )
  }

  const r = resolution.data!
  if (r.type === 'TONTINE' && r.invitationCode) return <Navigate to={`/q/t/${r.invitationCode}`} replace />

  const nom = r.user ? `${r.user.firstName} ${r.user.lastName}`.trim() : 'Membre'
  const dejaDedans = new Set(r.dansMesTontines.map((m) => m.tontineId))
  const ajoutables = gerees.filter((t) => !dejaDedans.has(t.id) && t.statut !== TontineStatut.TERMINEE)
  const aEncaisser = r.dansMesTontines.filter((m) => m.statutMembre === 'ACTIF' && m.cycleEnCoursId && !m.aPayeCycleEnCours)

  // Une seule tontine où encaisser : l'écran Encaisser (qui demande confirmation) s'ouvre directement
  if (aEncaisser.length === 1 && r.dansMesTontines.length === 1 && ajoutables.length === 0) {
    return <Navigate to={`/encaisser/${aEncaisser[0].tontineId}?membre=${aEncaisser[0].membreId}`} replace />
  }

  return (
    <Shell>
      <section className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-3">
        <InitialsAvatar name={nom} size={52} />
        <div className="min-w-0">
          <p className="font-bold text-neutral-900 truncate">{nom}</p>
          {r.user?.accountStatus === 'PRE_ENROLLED' && <p className="text-sm text-neutral-500">Compte pas encore activé</p>}
        </div>
      </section>

      {r.dansMesTontines.length > 0 ? (
        <section className="mt-4">
          <h2 className="px-1 text-sm font-semibold text-neutral-600">Dans vos tontines</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {r.dansMesTontines.map((m) => {
              const peutEncaisser = m.statutMembre === 'ACTIF' && !!m.cycleEnCoursId && !m.aPayeCycleEnCours
              const contenu = (
                <>
                  {peutEncaisser ? <CreditCard size={20} className="text-primary-700" /> : <CheckCircle2 size={20} className="text-neutral-400" />}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900 truncate">{m.tontineNom}</span>
                    <span className="block text-sm text-neutral-500">
                      {m.statutMembre !== 'ACTIF' ? (m.statutMembre === 'SUSPENDU' ? 'Suspendu' : 'Sorti')
                        : !m.cycleEnCoursId ? 'Aucun tour en cours'
                        : m.aPayeCycleEnCours ? 'A déjà payé ce tour' : 'Encaisser son paiement'}
                    </span>
                  </span>
                  {peutEncaisser && <ChevronRight size={18} className="text-neutral-300" />}
                </>
              )
              return (
                <li key={m.tontineId}>
                  {peutEncaisser ? (
                    <Link to={`/encaisser/${m.tontineId}?membre=${m.membreId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">{contenu}</Link>
                  ) : (
                    <Link to={`/tontine/${m.tontineId}/membres/${m.membreId}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">{contenu}</Link>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {ajoutables.length > 0 ? (
        <section className="mt-4">
          <h2 className="px-1 text-sm font-semibold text-neutral-600">Ajouter à une de vos tontines</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {ajoutables.map((t) => (
              <li key={t.id}>
                <button onClick={() => setCible(t)} className="w-full text-left flex items-center gap-3 px-4 py-3 min-h-[64px]">
                  <UserPlus size={20} className="text-primary-700" />
                  <span className="flex-1 font-semibold text-neutral-900 truncate">{t.nom}</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : r.dansMesTontines.length === 0 && (
        <div className="mt-4">
          <Message titre="QR membre" texte={gerees.length === 0 ? 'Seul un gestionnaire peut ajouter cette personne ou encaisser son paiement.' : 'Aucune de vos tontines ne peut accueillir de nouveau membre.'}>
            <button onClick={() => navigate('/accueil')} className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold">Retour à l'accueil</button>
          </Message>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cible}
        onClose={() => setCible(null)}
        onConfirm={confirmerAjout}
        title="Ajouter ce membre ?"
        message={cible ? `${nom} sera ajouté(e) à « ${cible.nom} » et recevra une notification.` : ''}
        confirmText="Ajouter"
        isLoading={ajoutEnCours}
      />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title="QR membre" />
      <main className="px-4 pb-8 max-w-lg mx-auto">{children}</main>
    </div>
  )
}

function Message({ titre, texte, children }: { titre: string; texte: string; children?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
      <span className="mx-auto w-14 h-14 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center"><QrCode size={26} /></span>
      <p className="mt-3 text-lg font-bold text-neutral-900">{titre}</p>
      <p className="mt-1 text-sm text-neutral-500">{texte}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </section>
  )
}
