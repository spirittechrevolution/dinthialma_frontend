import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSBanner, setShowIOSBanner] = useState(false)

  useEffect(() => {
    // Détection iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(ios)

    // Déjà installé (standalone) ?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsInstalled(standalone)

    // Afficher le bandeau iOS si pas encore installé et pas déjà fermé
    if (ios && !standalone) {
      const dismissed = localStorage.getItem('dinthialma-ios-banner-dismissed')
      if (!dismissed) setShowIOSBanner(true)
    }

    // Android / Chrome — capturer l'événement beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Détecter si l'utilisateur installe l'app
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const triggerInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  const dismissIOSBanner = () => {
    setShowIOSBanner(false)
    localStorage.setItem('dinthialma-ios-banner-dismissed', '1')
  }

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    isIOS,
    showIOSBanner,
    triggerInstall,
    dismissIOSBanner,
  }
}
