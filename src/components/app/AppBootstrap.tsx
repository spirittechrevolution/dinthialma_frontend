/**
 * Démarrage de l'application :
 * - configuration publique (B25) → écran « Mise à jour requise » si la version est trop ancienne ;
 * - préférences du compte (B22) chargées une fois connecté.
 */
import { ReactNode, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePublicConfig, versionInferieure } from '@/hooks/usePublicConfig'
import { chargerPreferences } from '@/lib/preferences'
import { LogoIcon } from '@/components/ui/LogoIcon'
import pkg from '../../../package.json'

export function AppBootstrap({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data: config } = usePublicConfig()
  const charge = useRef<string | null>(null)

  useEffect(() => {
    if (user && charge.current !== user.sub) {
      charge.current = user.sub
      chargerPreferences()
    }
  }, [user])

  if (config?.versionMinimaleApp && versionInferieure(pkg.version, config.versionMinimaleApp)) {
    return (
      <div className="min-h-[100dvh] bg-[#f2f3f5] flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-sm p-6 text-center">
          <div className="flex justify-center"><LogoIcon size={48} /></div>
          <p className="mt-4 text-xl font-bold text-neutral-900">Mise à jour requise</p>
          <p className="mt-2 text-sm text-neutral-600">
            Une nouvelle version de Dinthialma est disponible. Mettez à jour pour continuer.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full h-14 rounded-full bg-primary-700 text-white text-[17px] font-bold inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Mettre à jour
          </button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
