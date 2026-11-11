import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Maximize2, Share2, QrCode } from 'lucide-react'
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
}

/**
 * Carte QR de l'accueil (équivalent de la carte « Scanner » de Wave).
 * Je cotise : mon QR membre. Je gère : QR d'invitation de la tontine choisie.
 * Le bouton « Scanner » arrivera avec l'écran Scanner (A5).
 */
export function QrCard({ title, subtitle, url, shareText, onChoose }: QrCardProps) {
  const [big, setBig] = useState(false)

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
        <div className="mt-3 flex gap-2">
          {url ? (
            <>
              <button
                onClick={() => setBig(true)}
                className="h-11 px-3 rounded-full bg-neutral-100 text-sm font-semibold text-neutral-800 inline-flex items-center gap-1.5"
              >
                <Maximize2 size={16} /> Agrandir
              </button>
              <button
                onClick={() => shareLink({ title, text: shareText, url })}
                className="h-11 px-3 rounded-full bg-primary-50 text-sm font-semibold text-primary-800 inline-flex items-center gap-1.5"
              >
                <Share2 size={16} /> Partager
              </button>
            </>
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
            <Button className="w-full" size="lg" onClick={() => shareLink({ title, text: shareText, url })}>
              <Share2 size={18} /> Partager
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
