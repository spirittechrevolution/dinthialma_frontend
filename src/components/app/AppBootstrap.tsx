/**
 * Démarrage de l'application :
 * - configuration publique (B25) : écran bloquant si version < versionMinimaleApp,
 *   bandeau refermable si version < versionRecommandeeApp (format SemVer, en cas de doute rien) ;
 * - préférences du compte (B22) chargées une fois connecté.
 * La version de l'application est celle du package.json, embarquée au build.
 */
import { ReactNode, useEffect, useRef, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePublicConfig, versionInferieure } from '@/hooks/usePublicConfig'
import { chargerPreferences } from '@/lib/preferences'
import { LogoIcon } from '@/components/ui/LogoIcon'
import pkg from '../../../package.json'

const BANDEAU_FERME_KEY = 'dinthialma_maj_recommandee_fermee'

function lireBandeauFerme(): string | null {
  try { return localStorage.getItem(BANDEAU_FERME_KEY) } catch { return null }
}

export function AppBootstrap({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { data: config } = usePublicConfig()
  const charge = useRef<string | null>(null)
  const [bandeauFerme, setBandeauFerme] = useState(lireBandeauFerme)

  useEffect(() => {
    if (user && charge.current !== user.sub) {
      charge.current = user.sub
      chargerPreferences()
    }
  }, [user])

  if (versionInferieure(pkg.version, config?.versionMinimaleApp)) {
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

  const recommandee = config?.versionRecommandeeApp
  const afficherBandeau = !!recommandee && versionInferieure(pkg.version, recommandee) && bandeauFerme !== recommandee

  return (
    <>
      {afficherBandeau && (
        <div role="status" className="fixed top-0 inset-x-0 z-[60] bg-primary-800 text-white pt-[env(safe-area-inset-top)]">
          <div className="max-w-lg mx-auto flex items-center gap-2 pl-4 pr-1 min-h-[48px]">
            <p className="flex-1 text-sm font-medium">Nouvelle version disponible</p>
            <button onClick={() => window.location.reload()} className="h-9 px-3 rounded-full bg-white/15 text-sm font-semibold">
              Mettre à jour
            </button>
            <button
              aria-label="Fermer"
              onClick={() => {
                try { localStorage.setItem(BANDEAU_FERME_KEY, recommandee!) } catch { /* ignore */ }
                setBandeauFerme(recommandee!)
              }}
              className="w-11 h-11 rounded-full inline-flex items-center justify-center hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
