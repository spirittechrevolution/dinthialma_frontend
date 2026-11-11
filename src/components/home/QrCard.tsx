import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ScanLine, Share2, QrCode } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { shareLink } from '@/lib/share'

interface QrCardProps {
  title: string
  subtitle?: string
  /** Lien encodé ; null = aucune tontine choisie (mode Je gère + « Toutes ») */
  url: string | null
  shareText: string
  /** Quand url est null : action pour choisir une tontine */
  onChoose?: () => void
  /** Ouvre l'écran Scanner (bouton affiché si fourni) */
  onScan?: () => void
  /** Remplace le partage natif (ex. : ouvrir l'écran Partager) */
  onShare?: () => void
}

/**
 * Carte QR de l'accueil (équivalent de la carte « Scanner » de Wave).
 * Je cotise : mon QR membre. Je gère : QR d'invitation de la tontine choisie.
 * Toucher le QR l'agrandit ; « Scanner » ouvre la caméra ; « Partager » ouvre l'écran Partager ou le partage natif.
 */
export function QrCard({ title, subtitle, url, shareText, onChoose, onScan, onShare }: QrCardProps) {
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
      ) : (
        <span className="flex-shrink-0 w-[112px] h-[112px] rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center">
          <QrCode size={40} />
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
          {url ? (
            <button
              onClick={partager}
              className="h-11 px-3 rounded-full bg-primary-50 text-sm font-semibold text-primary-800 inline-flex items-center gap-1.5"
            >
              <Share2 size={16} /> Partager
            </button>
          ) : (
            onChoose && (
              <button
                onClick={onChoose}
                className="h-11 px-4 rounded-full bg-primary-50 text-sm font-semibold text-primary-800"
              >
                Choisir une tontine
              </button>
            )
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
              <Share2 size={18} /> Partager
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
