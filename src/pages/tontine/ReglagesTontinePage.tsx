/**
 * T8 — Réglages / Infos de la tontine (gabarit « Paramètres »).
 * Gestionnaire : règles, commissions (ajouter / modifier / supprimer), partager le QR d'invitation,
 * actions sensibles (suspendre / relancer, supprimer le brouillon).
 * Membre / lecture : règles, gestionnaire à contacter, commissions en consultation.
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { clsx } from 'clsx'
import { Phone, Plus, Pencil, Trash2, RotateCw } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Modal } from '@/components/ui/Modal'
import { QrCard } from '@/components/home/QrCard'
import { useTontineVue } from '@/hooks/useTontineVue'
import {
  useCommissions, useCreateCommission, useUpdateCommission, useDeleteCommission,
  useSuspendreTontine, useActiverTontine, useDeleteTontine,
} from '@/hooks/useTontines'
import { useOnline } from '@/hooks/useOnline'
import { formatF, formatDateCourte } from '@/lib/format'
import { formatPhoneLocal, toLocalPhone } from '@/lib/phone'
import { rythmeCourt } from '@/lib/tontineLabels'
import { tontineQrUrl } from '@/lib/share'
import { parseApiError } from '@/lib/apiError'
import { ModeCycle, TontineStatut } from '@/types/common'
import { TontineType, type Commission } from '@/types/tontine'

const ORDRE: Record<string, string> = {
  ROTATION: 'Chacun son tour (ordre fixe)',
  ALEATOIRE: 'Tirage au sort',
  MANUEL: 'Choisi par le gestionnaire',
}

const TYPES_COMMISSION: { value: Commission['type']; label: string; unite: '%' | 'F' }[] = [
  { value: 'POURCENTAGE_JACKPOT', label: '% du jackpot', unite: '%' },
  { value: 'FRAIS_FIXES_PAR_CYCLE', label: 'Frais fixes par tour', unite: 'F' },
  { value: 'FRAIS_ADHESION', label: "Frais d'adhésion", unite: 'F' },
]

const valeurCommission = (c: Commission) =>
  c.type === 'POURCENTAGE_JACKPOT' ? `${c.valeur} %` : formatF(c.valeur)

type Sensible = 'suspendre' | 'relancer' | 'supprimer'

export function ReglagesTontinePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const v = useTontineVue(id)
  const t = v.tontine
  const gerant = v.vue === 'GERE'
  const { data: commissionsData, isLoading: comLoading } = useCommissions(id, 0, 50)
  const commissions = commissionsData?.content ?? []

  const [edition, setEdition] = useState<Commission | 'nouvelle' | null>(null)
  const [sensible, setSensible] = useState<Sensible | null>(null)
  const { mutate: suspendre, isPending: suspending } = useSuspendreTontine()
  const { mutate: activer, isPending: activating } = useActiverTontine()
  const { mutate: supprimer, isPending: deleting } = useDeleteTontine()
  const { mutate: supprimerCommission } = useDeleteCommission()

  if (v.isLoading) {
    return <Shell title="Réglages"><div className="space-y-4" aria-busy="true"><div className="h-64 rounded-3xl bg-white animate-pulse" /><div className="h-32 rounded-3xl bg-white animate-pulse" /></div></Shell>
  }
  if (v.isError || !t) {
    return (
      <Shell title="Réglages">
        <section className="bg-white rounded-3xl shadow-sm p-6 text-center">
          <p className="text-lg font-bold text-neutral-900">Tontine introuvable</p>
          <button onClick={() => v.refetch()} className="mt-4 h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-2"><RotateCw size={16} /> Réessayer</button>
        </section>
      </Shell>
    )
  }

  const isEvent = t.tontineType === TontineType.EVENEMENTIELLE
  const brouillon = t.statut === TontineStatut.BROUILLON
  const regles: [string, string][] = [
    ['Type', isEvent ? 'Pour un événement' : 'Chacun son tour'],
    ['Montant', t.montantLibre ? `Libre${t.montantMinimum ? ` · minimum ${formatF(t.montantMinimum)}` : ''}` : `${formatF(t.montant)} / ${rythmeCourt(t.frequence)}`],
    ...(isEvent
      ? [
          ...(t.nomEvenement ? [['Événement', t.nomEvenement] as [string, string]] : []),
          ['Date de l\'événement', formatDateCourte(t.dateEcheance)] as [string, string],
          ['Rappels', rythmeCourt(t.frequence)] as [string, string],
        ]
      : [
          ['Membres', `${t.nombreMembresActuels} / ${t.nombreMembres}`] as [string, string],
          ['Gagnants par tour', String(t.nombreGagnants || 1)] as [string, string],
          ['Ordre des gagnants', ORDRE[t.ordreBeneficiaire ?? ''] ?? t.ordreBeneficiaire ?? '—'] as [string, string],
          ['Tours', t.modeCycle === ModeCycle.MANUEL ? 'Démarrés par le gestionnaire' : 'Automatiques'] as [string, string],
        ]),
    ['Début', formatDateCourte(t.dateDebut)],
    ['Créée le', formatDateCourte(t.createdAt)],
  ]

  const tel = toLocalPhone(t.creePar?.phone)
  const gestionnaire = [t.creePar?.firstName, t.creePar?.lastName].filter(Boolean).join(' ')

  const executerSensible = () => {
    if (!sensible) return
    const ok = (msg: string) => () => { toast.success(msg); setSensible(null) }
    const ko = (err: unknown) => toast.error(parseApiError(err).serverMessage || 'L\'action a échoué. Réessayez.')
    if (sensible === 'suspendre') suspendre(id, { onSuccess: ok('Tontine suspendue'), onError: ko })
    else if (sensible === 'relancer') activer(id, { onSuccess: ok('Tontine relancée'), onError: ko })
    else supprimer(id, { onSuccess: () => { toast.success('Brouillon supprimé'); navigate('/accueil', { replace: true }) }, onError: ko })
  }

  const textesSensibles: Record<Sensible, { titre: string; texte: string; bouton: string; danger: boolean }> = {
    suspendre: { titre: 'Suspendre la tontine ?', texte: 'Les membres ne pourront plus cotiser tant qu\'elle est suspendue.', bouton: 'Suspendre', danger: true },
    relancer: { titre: 'Relancer la tontine ?', texte: 'Les membres pourront de nouveau cotiser.', bouton: 'Relancer', danger: false },
    supprimer: { titre: 'Supprimer le brouillon ?', texte: 'La tontine et ses réglages seront supprimés.', bouton: 'Supprimer', danger: true },
  }

  return (
    <Shell title={gerant ? `Réglages · ${t.nom}` : `Infos · ${t.nom}`}>
      <div className="space-y-5">
        <Section
          titre="Règles"
          action={gerant && brouillon ? (
            <button onClick={() => navigate(`/tontine/${id}/modifier`)} disabled={!online} className="h-9 px-3 rounded-full bg-primary-50 text-sm font-semibold text-primary-800 inline-flex items-center gap-1 disabled:opacity-50">
              <Pencil size={15} /> Modifier
            </button>
          ) : undefined}
        >
          <dl className="divide-y divide-neutral-100">
            {regles.map(([k, val]) => (
              <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-neutral-500">{k}</dt>
                <dd className="text-sm font-semibold text-neutral-900 text-right">{val}</dd>
              </div>
            ))}
          </dl>
          {t.description && <p className="px-4 pb-4 text-sm text-neutral-600">{t.description}</p>}
        </Section>

        {!gerant && (
          <Section titre="Gestionnaire">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1">
                <span className="block font-semibold text-neutral-900">{gestionnaire || '—'}</span>
                <span className="block text-sm text-neutral-500">{formatPhoneLocal(t.creePar?.phone)}</span>
              </span>
              {tel && (
                <a href={`tel:+221${tel}`} className="h-11 px-4 rounded-full bg-neutral-100 text-sm font-semibold inline-flex items-center gap-1.5"><Phone size={16} /> Appeler</a>
              )}
            </div>
          </Section>
        )}

        <Section
          titre="Commissions"
          action={gerant ? (
            <button onClick={() => setEdition('nouvelle')} disabled={!online} className="h-9 px-3 rounded-full bg-primary-50 text-sm font-semibold text-primary-800 inline-flex items-center gap-1 disabled:opacity-50">
              <Plus size={15} /> Ajouter
            </button>
          ) : undefined}
        >
          {comLoading ? (
            <div className="p-4"><div className="h-12 rounded-2xl bg-neutral-100 animate-pulse" /></div>
          ) : commissions.length === 0 ? (
            <p className="px-4 py-4 text-sm text-neutral-500">Aucune commission</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {commissions.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-neutral-900">{TYPES_COMMISSION.find((x) => x.value === c.type)?.label ?? c.type}</span>
                    {c.description && <span className="block text-sm text-neutral-500 truncate">{c.description}</span>}
                  </span>
                  <span className="font-bold tabular-nums">{valeurCommission(c)}</span>
                  {gerant && (
                    <>
                      <button onClick={() => setEdition(c)} disabled={!online} className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100" aria-label="Modifier la commission"><Pencil size={17} /></button>
                      <button
                        onClick={() => supprimerCommission({ tontineId: id, commissionId: c.id }, {
                          onSuccess: () => toast.success('Commission supprimée'),
                          onError: () => toast.error('Suppression impossible'),
                        })}
                        disabled={!online}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50"
                        aria-label="Supprimer la commission"
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {gerant && t.statut === TontineStatut.ACTIVE && (
          <QrCard
            title={`Inviter dans ${t.nom}`}
            subtitle="Faites scanner ce QR pour rejoindre"
            url={tontineQrUrl(t)}
            onShare={() => navigate(`/partager?tontine=${t.id}`)}
            shareText={`Rejoins notre tontine ${t.nom} (${formatF(t.montant)} / ${rythmeCourt(t.frequence)}) :`}
          />
        )}

        {gerant && (
          <Section titre="Actions sensibles">
            <div className="divide-y divide-neutral-100">
              {t.statut === TontineStatut.ACTIVE && (
                <button onClick={() => setSensible('suspendre')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-amber-800 disabled:opacity-50">Suspendre la tontine</button>
              )}
              {t.statut === TontineStatut.SUSPENDUE && (
                <button onClick={() => setSensible('relancer')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-primary-800 disabled:opacity-50">Relancer la tontine</button>
              )}
              {brouillon && (
                <button onClick={() => setSensible('supprimer')} disabled={!online} className="w-full h-14 px-4 text-left font-medium text-red-700 disabled:opacity-50">Supprimer le brouillon</button>
              )}
              {t.statut === TontineStatut.TERMINEE && <p className="px-4 py-4 text-sm text-neutral-500">Tontine terminée.</p>}
            </div>
          </Section>
        )}
      </div>

      {edition && (
        <CommissionSheet
          tontineId={id}
          commission={edition === 'nouvelle' ? null : edition}
          onClose={() => setEdition(null)}
        />
      )}

      <Modal isOpen={!!sensible} onClose={() => setSensible(null)} title={sensible ? textesSensibles[sensible].titre : ''} size="sm">
        {sensible && (
          <>
            <p className="text-neutral-600">{textesSensibles[sensible].texte}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setSensible(null)} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
              <button
                onClick={executerSensible}
                disabled={suspending || activating || deleting}
                className={clsx('h-12 rounded-full text-white font-bold disabled:opacity-50', textesSensibles[sensible].danger ? 'bg-red-600' : 'bg-primary-700')}
              >
                {suspending || activating || deleting ? '…' : textesSensibles[sensible].bouton}
              </button>
            </div>
          </>
        )}
      </Modal>
    </Shell>
  )
}

/** Feuille Commission : type (création seulement), valeur, description */
function CommissionSheet({ tontineId, commission, onClose }: { tontineId: string; commission: Commission | null; onClose: () => void }) {
  const [type, setType] = useState<Commission['type']>(commission?.type ?? 'POURCENTAGE_JACKPOT')
  const [valeur, setValeur] = useState(commission ? String(commission.valeur) : '')
  const [description, setDescription] = useState(commission?.description ?? '')
  const { mutate: creer, isPending: creating } = useCreateCommission()
  const { mutate: modifier, isPending: updating } = useUpdateCommission()
  const unite = TYPES_COMMISSION.find((x) => x.value === type)?.unite ?? 'F'
  const n = Number(valeur.replace(',', '.'))
  const invalide = !valeur || !Number.isFinite(n) || n <= 0 || (unite === '%' && n > 100)

  const enregistrer = () => {
    const done = { onSuccess: () => { toast.success(commission ? 'Commission modifiée' : 'Commission ajoutée'); onClose() }, onError: () => toast.error('Enregistrement impossible') }
    if (commission) modifier({ tontineId, commissionId: commission.id, request: { valeur: n, description: description.trim() || undefined } }, done)
    else creer({ tontineId, request: { type, valeur: n, description: description.trim() || undefined } }, done)
  }

  return (
    <Modal isOpen onClose={onClose} title={commission ? 'Modifier la commission' : 'Ajouter une commission'} size="sm">
      <div className="space-y-4">
        {!commission && (
          <div role="radiogroup" aria-label="Type de commission" className="space-y-2">
            {TYPES_COMMISSION.map((x) => (
              <button
                key={x.value}
                type="button"
                role="radio"
                aria-checked={type === x.value}
                onClick={() => setType(x.value)}
                className={clsx('w-full h-12 px-4 rounded-2xl border-2 text-left font-semibold', type === x.value ? 'border-primary-700 bg-primary-50' : 'border-neutral-200')}
              >
                {x.label}
              </button>
            ))}
          </div>
        )}
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Valeur ({unite === '%' ? '%' : 'FCFA'})</span>
          <input
            value={valeur}
            onChange={(e) => setValeur(e.target.value.replace(/[^\d.,]/g, ''))}
            inputMode="decimal"
            placeholder={unite === '%' ? '4' : '500'}
            className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
          />
        </label>
        {unite === '%' && n > 100 && <p className="text-sm text-red-700">100 % maximum.</p>}
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">Description (facultatif)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 120))}
            placeholder="Frais de gestion…"
            className="mt-1 w-full h-12 px-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
          />
        </label>
        <button onClick={enregistrer} disabled={invalide || creating || updating} className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold disabled:opacity-50">
          {creating || updating ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

function Section({ titre, action, children }: { titre: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="px-1 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500">{titre}</h2>
        {action}
      </div>
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">{children}</div>
    </section>
  )
}

function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-[100dvh] bg-[#f2f3f5]">
      <ScreenHeader title={title} />
      <main className="px-4 pb-8 max-w-lg mx-auto">{children}</main>
    </div>
  )
}
