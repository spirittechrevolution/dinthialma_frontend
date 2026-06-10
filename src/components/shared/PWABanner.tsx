import { usePWA } from '@/hooks/usePWA'
import { X, Download, Share } from 'lucide-react'

export function PWABanner() {
  const { canInstall, isIOS, showIOSBanner, triggerInstall, dismissIOSBanner } = usePWA()

  // Bannière Android — bouton "Installer l'app"
  if (canInstall) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 flex items-center gap-3 animate-slideUp">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">Installer Dinthialma</p>
          <p className="text-xs text-neutral-500 truncate">Accès rapide depuis votre écran d'accueil</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={triggerInstall}
            className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Installer
          </button>
          <button
            onClick={dismissIOSBanner}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Bannière iOS — instructions manuelles
  if (isIOS && showIOSBanner) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 animate-slideUp">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-semibold text-neutral-900">Installer Dinthialma</p>
          <button
            onClick={dismissIOSBanner}
            className="w-6 h-6 rounded-lg text-neutral-400 hover:text-neutral-600 flex items-center justify-center"
          >
            <X size={13} />
          </button>
        </div>
        <p className="text-xs text-neutral-500 mb-3">
          Ajoutez l'app à votre écran d'accueil pour un accès rapide.
        </p>
        <div className="flex items-center gap-2 text-xs text-neutral-700">
          <span className="flex items-center gap-1">
            <span>1.</span>
            <Share size={13} className="text-blue-500" />
            <span>Appuyez sur</span>
            <span className="font-semibold text-blue-500">Partager</span>
          </span>
        </div>
        <p className="text-xs text-neutral-700 mt-1">
          2. Puis <span className="font-semibold">"Sur l'écran d'accueil"</span>
        </p>
      </div>
    )
  }

  return null
}
