/**
 * /q/m/:phone — QR membre scanné (Scanner ou appareil photo du téléphone).
 * Gestionnaire : la personne est dans une de ses tontines → Encaisser (préremplie) ;
 * sinon → Ajouter un membre (numéro prérempli). Aucune action sans confirmation.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, UserPlus, CreditCard, RotateCw, QrCode } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { InitialsAvatar } from '@/components/ui/Section'
import { AddMembreModal } from '@/components/shared/AddMembreModal'
import { useMesTontines } from '@/hooks/useMe'
import { meService } from '@/services/meService'
import { userService } from '@/services/userService'
import { formatPhoneLocal, toLocalPhone } from '@/lib/phone'
import { jeGere } from '@/types/me'

export function MembreQrPage() {
  const { phone = '' } = useParams()
  const navigate = useNavigate()
  const local = toLocalPhone(phone)
  const e164 = `+221${local}`
  const mes = useMesTontines()
  const gerees = (mes.data ?? []).filter(jeGere)
  const [ajoutTontine, setAjoutTontine] = useState<string | null>(null)

  const personne = useQuery({
    queryKey: ['qr-membre', 'user', local],
    queryFn: () => userService.searchByPhone(e164),
    enabled: local.length === 9,
    retry: false,
    staleTime: 60_000,
  })
  const correspondances = useQuery({
    queryKey: ['me', 'qr-membre', local],
    queryFn: () => meService.trouverMembreDansMesTontines(local, mes.data ?? []),
    enabled: local.length === 9 && !!mes.data,
    staleTime: 60_000,
  })

  if (local.length !== 9) {
    return <Shell><Message titre="QR illisible" texte="Ce QR membre ne contient pas de numéro valide." /></Shell>
  }

  const loading = mes.isLoading || correspondances.isLoading || personne.isLoading
  if (loading) {
    return <Shell><div className="space-y-3" aria-busy="true"><div className="h-24 rounded-3xl bg-white animate-pulse" /><div className="h-40 rounded-3xl bg-white animate-pulse" /></div></Shell>
  }
  if (mes.isError || correspondances.isError) {
    return (
      <Shell>
        <Message titre="Impossible de vérifier ce QR" texte="Vérifiez votre connexion puis réessayez.">
          <button onClick={() => { mes.refetch(); correspondances.refetch() }} className="h-12 px-5 rounded-full bg-neutral-100 font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
        </Message>
      </Shell>
    )
  }

  const trouvees = correspondances.data ?? []
  const nom = personne.data ? `${personne.data.firstName} ${personne.data.lastName}`.trim() : ''
  const affichage = nom || formatPhoneLocal(local)

  // Une seule tontine : l'écran Encaisser (qui demande confirmation) s'ouvre directement
  if (trouvees.length === 1) {
    return <Navigate to={`/encaisser/${trouvees[0].tontine.id}?membre=${trouvees[0].membre.id}`} replace />
  }

  return (
    <Shell>
      <section className="bg-white rounded-3xl shadow-sm p-5 flex items-center gap-3">
        <InitialsAvatar name={affichage} size={52} />
        <div className="min-w-0">
          <p className="font-bold text-neutral-900 truncate">{affichage}</p>
          <p className="text-sm text-neutral-500">{formatPhoneLocal(local)}</p>
        </div>
      </section>

      {gerees.length === 0 ? (
        <div className="mt-4">
          <Message titre="QR membre" texte="Seul un gestionnaire peut encaisser un paiement ou ajouter cette personne à une tontine.">
            <button onClick={() => navigate('/accueil')} className="h-12 px-5 rounded-full bg-primary-700 text-white font-bold">Retour à l'accueil</button>
          </Message>
        </div>
      ) : trouvees.length > 1 ? (
        <section className="mt-4">
          <h2 className="px-1 text-sm font-semibold text-neutral-600">Encaisser dans quelle tontine ?</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {trouvees.map(({ tontine, membre }) => (
              <li key={tontine.id}>
                <Link to={`/encaisser/${tontine.id}?membre=${membre.id}`} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                  <CreditCard size={20} className="text-primary-700" />
                  <span className="flex-1 font-semibold text-neutral-900 truncate">{tontine.nom}</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-4">
          <p className="px-1 text-sm text-neutral-600">{affichage} n'est dans aucune de vos tontines.</p>
          <h2 className="mt-3 px-1 text-sm font-semibold text-neutral-600">L'ajouter à :</h2>
          <ul className="mt-2 bg-white rounded-3xl shadow-sm divide-y divide-neutral-100">
            {gerees.map((t) => (
              <li key={t.id}>
                <button onClick={() => setAjoutTontine(t.id)} className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left">
                  <UserPlus size={20} className="text-primary-700" />
                  <span className="flex-1 font-semibold text-neutral-900 truncate">{t.nom}</span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ajoutTontine && (
        <AddMembreModal
          key={ajoutTontine}
          tontineId={ajoutTontine}
          isOpen
          initialPhone={e164}
          onClose={() => setAjoutTontine(null)}
        />
      )}
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
