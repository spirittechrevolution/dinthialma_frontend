import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ScanLine, Share2, UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { shareLink } from '@/lib/share'

interface QrCardProps {
  title: string
  subtitle?: string
  /** Lien encodé ; null = pas de QR à afficher (gestionnaire, filtre « Toutes mes tontines ») */
  url: string | null
  shareText: string
  /** Libellé du bouton de partage (défaut « Partager » ; gestionnaire : « Inviter ») */
  shareLabel?: string
  /** QR en cours de chargement */
  loading?: boolean
  /** Ouvre l'écran Scanner (bouton affiché si fourni) */
  onScan?: () => void
  /** Remplace le partage natif (ex. : ouvrir l'écran Partager) */
  onShare?: () => void
}

/**
 * Carte QR de l'accueil (équivalent de la carte « Scanner » de Wave).
 * Membre : mon QR membre. Gestionnaire : QR d'invitation de la tontine choisie dans le filtre du bandeau
 * (ou de l'unique tontine gérée) ; sur « Toutes mes tontines », pas de QR mais le bouton Inviter reste
 * (l'écran Partager fait choisir la tontine). Le choix de la tontine se fait uniquement dans le bandeau.
 * Toucher le QR l'agrandit ; « Scanner » ouvre la caméra ; le bouton de partage ouvre l'écran Partager ou le partage natif.
 */
export function QrCard({ title, subtitle, url, shareText, shareLabel = 'Partager', loading, onScan, onShare }: QrCardProps) {
  const [big, setBig] = useState(false)
  const partager = () => (onShare ? onShare() : url && shareLink({ title, text: shareText, url }))

  return (
    <section className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-4">
      {url ? (
        <button
          onClick={() => setBig(true)}
          className="flex-shrink-0 rounded-2xl border border-neutral-100 p-2 active:scale-95 transition"
          aria-label="Agrandir le QR"
        >
          <QRCodeSVG value={url} size={96} level="M" />
        </button>
      ) : loading ? (
        <span className="flex-shrink-0 w-[112px] h-[112px] rounded-2xl bg-neutral-100 animate-pulse" aria-busy="true" aria-label="Chargement du QR" />
      ) : (
        <span className="flex-shrink-0 w-[112px] h-[112px] rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center" aria-hidden>
          <UserPlus size={40} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-bold text-neutral-900">{title}</p>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {onScan && (
            <button
              onClick={onScan}
              className="h-11 px-3 rounded-full bg-primary-700 text-sm font-semibold text-white inline-flex items-center gap-1.5"
            >
              <ScanLine size={16} /> Scanner
            </button>
          )}
          {(url || onShare) && (
            <button
              onClick={partager}
              className="h-11 px-3 rounded-full bg-primary-50 text-sm font-semibold text-primary-800 inline-flex items-center gap-1.5"
            >
              {shareLabel === 'Inviter' ? <UserPlus size={16} /> : <Share2 size={16} />} {shareLabel}
            </button>
          )}
        </div>
      </div>

      {url && (
        <Modal isOpen={big} onClose={() => setBig(false)} title={title} size="sm">
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-3xl bg-white p-4 shadow-sm border border-neutral-100">
              <QRCodeSVG value={url} size={240} level="M" />
            </div>
            {subtitle && <p className="text-sm text-neutral-500 text-center">{subtitle}</p>}
            <Button className="w-full" size="lg" onClick={() => { setBig(false); partager() }}>
              {shareLabel === 'Inviter' ? <UserPlus size={18} /> : <Share2 size={18} />} {shareLabel}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
