/**
 * A4 — Partager : un seul écran pour inviter, par QR ou par lien.
 * /partager              → inviter un proche à l'application
 * /partager?tontine=:id  → inviter dans une tontine (gestionnaire)
 * Boutons : WhatsApp (message prérempli) · Copier le lien · Plus (partage natif du téléphone).
 */
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { MessageCircle, Copy, Share2 } from 'lucide-react'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { useTontineVue } from '@/hooks/useTontineVue'
import { formatF } from '@/lib/format'
import { rythmeCourt } from '@/lib/tontineLabels'
import { appUrl, whatsappUrl } from '@/lib/share'
import { useInvitationTontine } from '@/hooks/useQr'
import { messageErreur } from '@/lib/apiError'
import { TontineStatut } from '@/types/common'

export function PartagerPage() {
  const [search] = useSearchParams()
  const tontineId = search.get('tontine') ?? ''
  const v = useTontineVue(tontineId)
  const t = tontineId ? v.tontine : undefined
  const invitation = useInvitationTontine(tontineId && v.vue === 'GERE' ? tontineId : null)

  if (tontineId && (v.isLoading || invitation.isLoading)) {
    return <Shell title="Inviter"><div className="mx-auto mt-6 w-72 h-72 rounded-3xl bg-white animate-pulse" aria-busy="true" /></Shell>
  }
  if (tontineId && (!t || v.vue !== 'GERE')) {
    return <Shell title="Inviter"><p className="pt-8 text-center text-sm text-neutral-500">Seul le gestionnaire peut inviter dans cette tontine.</p></Shell>
  }
  if (tontineId && invitation.isError) {
    return <Shell title="Inviter"><p className="pt-8 text-center text-sm text-neutral-500">{messageErreur(invitation.error, "Impossible de créer le lien d'invitation.")}</p></Shell>
  }

  const pourTontine = !!t
  const url = t ? invitation.data?.url ?? appUrl() : appUrl()
  const titre = t ? `Inviter dans ${t.nom}` : 'Inviter un proche'
  const detail = t ? (t.montantLibre ? 'Montant libre' : `${formatF(t.montant)} / ${rythmeCourt(t.frequence)}`) : 'Dinthialma, vos tontines simples et claires'
  const texte = t
    ? `Rejoins notre tontine ${t.nom} (${detail}) :`
    : 'Je gère mes tontines avec Dinthialma, rejoins-moi :'
  const message = `${texte} ${url}`

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié')
    } catch {
      toast.error('Copie impossible')
    }
  }
  const partagerNatif = async () => {
    try {
      await navigator.share({ title: titre, text: texte, url })
    } catch {
      /* feuille fermée */
    }
  }
  const natif = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Shell title={titre}>
      <section className="mt-2 bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center text-center">
        <div className="rounded-3xl border border-neutral-100 p-4">
          <QRCodeSVG value={url} size={232} level="M" />
        </div>
        <p className="mt-4 text-lg font-bold text-neutral-900">{t ? t.nom : 'Dinthialma'}</p>
        <p className="text-sm text-neutral-500">{detail}</p>
        {pourTontine && t?.statut !== TontineStatut.ACTIVE && (
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La tontine n'est pas encore lancée : les personnes invitées pourront vous contacter, vous les ajouterez ensuite.
          </p>
        )}
      </section>

      <div className="mt-4 space-y-3">
        <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold flex items-center justify-center gap-2">
          <MessageCircle size={20} /> WhatsApp
        </a>
        <div className={natif ? 'grid grid-cols-2 gap-3' : ''}>
          <button onClick={copier} className="w-full h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
            <Copy size={18} /> Copier le lien
          </button>
          {natif && (
            <button onClick={partagerNatif} className="w-full h-12 rounded-full bg-white shadow-sm font-semibold text-neutral-800 inline-flex items-center justify-center gap-2">
              <Share2 size={18} /> Plus
            </button>
          )}
        </div>
      </div>
    </Shell>
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
