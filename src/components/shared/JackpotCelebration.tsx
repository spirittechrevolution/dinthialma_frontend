import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { GagnantInfo } from '@/types/cycle'

// ─── Confetti particle ─────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
}

const COLORS = ['#16a34a', '#22c55e', '#fbbf24', '#f59e0b', '#ffffff', '#86efac', '#fde68a']

function useConfetti(count = 40) {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
    }))
  )
  return particles
}

interface JackpotCelebrationProps {
  gagnants: GagnantInfo[]
  montantNet: number
  numeroCycle: number
  tontineNom?: string
  onClose?: () => void
}

export function JackpotCelebration({
  gagnants,
  montantNet,
  numeroCycle,
  tontineNom,
  onClose,
}: JackpotCelebrationProps) {
  const navigate = useNavigate()
  const particles = useConfetti(50)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Petite pause avant animation d'entrée
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    onClose ? onClose() : navigate(-1)
  }

  const montantParGagnant = gagnants.length > 1
    ? Math.floor(montantNet / gagnants.length)
    : montantNet

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600 overflow-hidden">

      {/* Confettis */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall pointer-events-none"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Contenu */}
      <div className={`flex flex-col items-center px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Icône trophée pulsante */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-amber-400/20 ring-2 ring-amber-400/50 flex items-center justify-center">
            <Trophy size={44} className="text-amber-300" />
          </div>
        </div>

        <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-widest">
          🎉 Jackpot distribué
        </p>

        {tontineNom && (
          <p className="text-white/60 text-xs mb-3">{tontineNom} · Cycle #{numeroCycle}</p>
        )}

        {/* Montant */}
        <p className="text-white text-5xl font-extrabold tracking-tight mb-1">
          {montantNet.toLocaleString('fr-FR')}
        </p>
        <p className="text-amber-300 text-lg font-bold mb-8">FCFA</p>

        {/* Gagnants */}
        {gagnants.length === 1 ? (
          <div className="flex flex-col items-center gap-1 mb-8">
            <div className="w-14 h-14 rounded-full bg-white/20 ring-2 ring-white/40 flex items-center justify-center text-white text-xl font-bold mb-2">
              {`${gagnants[0].firstName[0]}${gagnants[0].lastName[0]}`}
            </div>
            <p className="text-white text-xl font-bold">{gagnants[0].firstName} {gagnants[0].lastName}</p>
            <p className="text-white/60 text-sm">a reçu son jackpot</p>
          </div>
        ) : (
          <div className="mb-8">
            <p className="text-white/70 text-sm mb-3">{gagnants.length} gagnants · {montantParGagnant.toLocaleString('fr-FR')} FCFA chacun</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {gagnants.map((g) => (
                <div key={g.membreId} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold">
                    {g.firstName[0]}{g.lastName[0]}
                  </div>
                  <span className="text-white text-sm font-semibold">{g.firstName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleClose}
          className="bg-white text-primary-700 hover:bg-white/90 font-bold px-8"
          size="lg"
        >
          Continuer <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
