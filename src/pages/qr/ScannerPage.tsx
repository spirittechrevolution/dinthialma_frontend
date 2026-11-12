/**
 * A5 — Scanner : lit un QR Dinthialma et ouvre l'écran correspondant.
 * - QR membre (/q/{token}) → résolution par le backend (Encaisser…)
 * - QR tontine (/q/t/…) → page d'invitation (ou fiche si déjà membre)
 * Un scan ne déclenche jamais rien seul : il ouvre toujours un écran avec confirmation.
 *
 * Détection : BarcodeDetector (Chrome Android) sinon jsQR (Safari iOS…). Repli : chercher le membre.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import { X, Flashlight, Search, CameraOff } from 'lucide-react'
import { cheminQrDinthialma } from '@/lib/share'

type Etat = 'demarrage' | 'actif' | 'refuse' | 'indisponible'

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike
  }
}

export function ScannerPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [etat, setEtat] = useState<Etat>('demarrage')
  const [message, setMessage] = useState<string | null>(null)
  const [torche, setTorche] = useState<boolean | null>(null) // null = non disponible

  useEffect(() => {
    let stop = false
    let timer: ReturnType<typeof setTimeout>
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null

    const traiter = (texte: string) => {
      const chemin = cheminQrDinthialma(texte)
      if (!chemin) {
        setMessage("Ce QR n'est pas un QR Dinthialma")
        return false
      }
      navigator.vibrate?.(60)
      navigate(chemin, { replace: true })
      return true
    }

    const boucle = async () => {
      if (stop) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState >= 2) {
        try {
          let texte: string | null = null
          if (detector) {
            const codes = await detector.detect(video)
            texte = codes[0]?.rawValue ?? null
          } else {
            const w = video.videoWidth
            const h = video.videoHeight
            const scale = Math.min(1, 480 / Math.max(w, h)) // image réduite : plus rapide sur petit téléphone
            canvas.width = Math.round(w * scale)
            canvas.height = Math.round(h * scale)
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
              texte = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ?? null
            }
          }
          if (texte && traiter(texte)) return
        } catch {
          /* image illisible : on réessaie */
        }
      }
      timer = setTimeout(boucle, 250)
    }

    const demarrer = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setEtat('indisponible'); return }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const caps = (track.getCapabilities?.() ?? {}) as { torch?: boolean }
        if (caps.torch) setTorche(false)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setEtat('actif')
        boucle()
      } catch (err) {
        setEtat(err instanceof DOMException && err.name === 'NotAllowedError' ? 'refuse' : 'indisponible')
      }
    }
    demarrer()

    return () => {
      stop = true
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [navigate])

  const basculerTorche = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || torche === null) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torche } as MediaTrackConstraintSet] })
      setTorche(!torche)
    } catch {
      setTorche(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
      <canvas ref={canvasRef} className="hidden" />

      <header className="relative z-10 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center" aria-label="Fermer">
          <X size={24} />
        </button>
        {torche !== null && (
          <button onClick={basculerTorche} aria-pressed={torche} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center" aria-label="Lampe">
            <Flashlight size={22} className={torche ? 'text-yellow-300' : ''} />
          </button>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        {etat === 'refuse' || etat === 'indisponible' ? (
          <div className="max-w-xs">
            <span className="mx-auto w-16 h-16 rounded-full bg-white/10 flex items-center justify-center"><CameraOff size={30} /></span>
            <p className="mt-4 text-lg font-bold">{etat === 'refuse' ? 'Accès à la caméra refusé' : 'Caméra indisponible'}</p>
            <p className="mt-1 text-sm text-white/70">
              {etat === 'refuse' ? 'Autorisez la caméra dans les réglages du navigateur, ou cherchez le membre par son nom.' : 'Cherchez le membre par son nom ou son numéro.'}
            </p>
          </div>
        ) : (
          <>
            <div className="w-64 h-64 rounded-3xl border-4 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" aria-hidden="true" />
            <p className="mt-6 text-base font-semibold" role="status">
              {etat === 'demarrage' ? 'Ouverture de la caméra…' : 'Visez le QR Dinthialma'}
            </p>
          </>
        )}
        {message && <p role="alert" className="mt-3 rounded-full bg-red-600/90 px-4 py-2 text-sm font-semibold">{message}</p>}
      </main>

      <footer className="relative z-10 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-center">
          <button onClick={() => navigate('/encaisser', { replace: true })} className="h-12 px-5 rounded-full bg-white/15 backdrop-blur font-semibold inline-flex items-center gap-2">
            <Search size={18} /> Chercher un membre
          </button>
        </div>
      </footer>
    </div>
  )
}
