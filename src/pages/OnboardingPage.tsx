import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken, getUserPhone, getPinConfigured, isTokenExpired } from '@/lib/tokenStorage'
import { LogoIcon } from '@/components/ui/LogoIcon'

// ─── Marquer l'onboarding comme vu ───────────────────────────────────────────
export function markOnboardingDone() {
  localStorage.setItem('dinthialma_onboarding_done', '1')
}

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem('dinthialma_onboarding_done') === '1'
}

// ─── Détecter si on est en mode PWA standalone mobile ─────────────────────────
export function isMobilePWA(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  return standalone && mobile
}

// ─── Slides de l'onboarding ───────────────────────────────────────────────────
const SLIDES = [
  {
    title: 'La tontine africaine\nréinventée',
    subtitle: 'Épargnez ensemble.\nGagnez en confiance.',
    feature: null,
  },
  {
    title: 'Gérez vos tontines\nen toute sérénité',
    subtitle: 'Créez, invitez vos proches et\nsuivez chaque cotisation en temps réel.',
    feature: '📊',
  },
  {
    title: 'Sécurisé et\ntransparent',
    subtitle: 'Code PIN, chiffrement AES-256\net notifications instantanées.',
    feature: '🔐',
  },
]

// ─── Logo centré slide 0 ─────────────────────────────────────────────────────
function LogoSlide() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="absolute w-28 h-28 rounded-full bg-primary-400/20 blur-xl" />
        <LogoIcon size={96} className="relative drop-shadow-[0_0_24px_rgba(34,197,94,0.55)]" />
      </div>
      <div className="text-center mt-1">
        <p className="text-white text-2xl font-bold tracking-wide leading-none">Dinthialma</p>
        <p className="text-neutral-400 text-sm mt-1">Gestion de tontines</p>
      </div>
    </div>
  )
}

// ─── Skyline africaine SVG ─────────────────────────────────────────────────────
function AfricanSkyline() {
  return (
    <svg
      viewBox="0 0 390 90"
      preserveAspectRatio="xMidYMax meet"
      className="w-full opacity-20"
      fill="white"
    >
      {/* Mosquée avec minaret */}
      <rect x="20" y="55" width="40" height="35" />
      <polygon points="40,30 20,55 60,55" />
      <rect x="37" y="10" width="6" height="22" />
      <circle cx="40" cy="8" r="4" />
      {/* Immeuble */}
      <rect x="70" y="40" width="30" height="50" />
      <rect x="75" y="45" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="87" y="45" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="75" y="58" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="87" y="58" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      {/* Grande tour */}
      <rect x="110" y="20" width="25" height="70" />
      <rect x="115" y="25" width="6" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="124" y="25" width="6" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="115" y="38" width="6" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="124" y="38" width="6" height="8" fill="rgba(0,0,0,0.3)" />
      <polygon points="122.5,5 110,20 135,20" />
      {/* Maison traditionnelle */}
      <rect x="145" y="60" width="35" height="30" />
      <polygon points="162.5,42 145,60 180,60" />
      {/* Palmeraie */}
      <rect x="188" y="65" width="4" height="25" />
      <ellipse cx="190" cy="60" rx="14" ry="10" />
      <ellipse cx="183" cy="65" rx="9" ry="7" />
      <ellipse cx="197" cy="65" rx="9" ry="7" />
      {/* Tour moderne */}
      <rect x="210" y="25" width="35" height="65" />
      <rect x="215" y="30" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      <rect x="230" y="30" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      <rect x="215" y="45" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      <rect x="230" y="45" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      <rect x="215" y="60" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      <rect x="230" y="60" width="10" height="10" fill="rgba(0,0,0,0.3)" />
      {/* Minaret 2 */}
      <rect x="255" y="45" width="8" height="45" />
      <polygon points="259,28 251,45 267,45" />
      <rect x="257" y="15" width="4" height="14" />
      <circle cx="259" cy="13" r="3" />
      {/* Immeuble bas */}
      <rect x="272" y="55" width="45" height="35" />
      <rect x="278" y="60" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="290" y="60" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      <rect x="302" y="60" width="8" height="8" fill="rgba(0,0,0,0.3)" />
      {/* Palme 2 */}
      <rect x="325" y="65" width="4" height="25" />
      <ellipse cx="327" cy="60" rx="14" ry="10" />
      {/* Tour finale */}
      <rect x="338" y="35" width="30" height="55" />
      <polygon points="353,18 338,35 368,35" />
      <rect x="344" y="42" width="7" height="7" fill="rgba(0,0,0,0.3)" />
      <rect x="355" y="42" width="7" height="7" fill="rgba(0,0,0,0.3)" />
      {/* Sol */}
      <rect x="0" y="88" width="390" height="2" />
    </svg>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1)
    }
  }

  const skip = () => {
    markOnboardingDone()
    redirectAfterOnboarding()
  }

  const redirectAfterOnboarding = () => {
    const access = getAccessToken()
    const phone  = getUserPhone()

    if (access && !isTokenExpired(access)) {
      navigate('/dashboard', { replace: true })
    } else if (phone && getPinConfigured() !== false) {
      navigate('/pin', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50)       goNext()   // swipe gauche → suivant
    if (delta < -50 && current > 0) setCurrent((c) => c - 1) // swipe droite → précédent
    touchStartX.current = null
  }

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a4a2e 0%, #0d1f0f 50%, #040f06 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Bouton skip */}
      {!isLast && (
        <button
          onClick={skip}
          className="absolute top-12 right-6 z-10 text-white/50 text-sm font-medium hover:text-white/80 transition-colors"
        >
          Passer
        </button>
      )}

      {/* Zone centrale — logo + texte */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

        {/* Slide 0 : logo brillant, slides 1-2 : emoji feature */}
        <div className="mb-8">
          {current === 0 ? (
            <LogoSlide />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-5xl ring-2 ring-white/20 shadow-lg">
              {slide.feature}
            </div>
          )}
        </div>

        {/* Titre */}
        <h1 className="text-white text-3xl font-extrabold leading-tight mb-4 drop-shadow-lg"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          {slide.title.split('\n').map((line, i) => (
            <span key={i}>{line}{i < slide.title.split('\n').length - 1 && <br />}</span>
          ))}
        </h1>

        {/* Sous-titre */}
        <p className="text-white/70 text-base leading-relaxed">
          {slide.subtitle.split('\n').map((line, i) => (
            <span key={i}>{line}{i < slide.subtitle.split('\n').length - 1 && <br />}</span>
          ))}
        </p>
      </div>

      {/* Bas de l'écran */}
      <div className="px-6 pb-12 flex flex-col items-center gap-5">

        {/* Dots pagination */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Boutons */}
        {isLast ? (
          /* Dernier slide : Se connecter + S'inscrire */
          <div className="w-full space-y-3">
            <button
              onClick={() => { markOnboardingDone(); navigate('/login', { replace: true }) }}
              className="w-full h-14 rounded-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold text-base shadow-lg shadow-primary-900/50 transition-all active:scale-[0.98]"
            >
              Se connecter
            </button>
            <button
              onClick={() => { markOnboardingDone(); navigate('/register', { replace: true }) }}
              className="w-full h-14 rounded-full border-2 border-white/60 text-white font-bold text-base hover:bg-white/10 active:bg-white/20 transition-all active:scale-[0.98]"
            >
              S'inscrire
            </button>
          </div>
        ) : (
          /* Slides 1-2 : bouton Suivant */
          <button
            onClick={goNext}
            className="w-full h-14 rounded-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold text-base shadow-lg shadow-primary-900/50 transition-all active:scale-[0.98]"
          >
            Suivant
          </button>
        )}
      </div>

      {/* Skyline africaine en bas */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <AfricanSkyline />
      </div>
    </div>
  )
}
