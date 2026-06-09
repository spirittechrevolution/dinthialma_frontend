import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { CreateTontineModal } from '@/components/shared/CreateTontineModal'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Plus, Users, BookCopy, ChevronRight, Sparkles, Hash } from 'lucide-react'

export function UserDashboard() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const prenom = user?.firstName || 'Utilisateur'

  return (
    <AppLayout>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-neutral-500">Bienvenue</p>
          <h1 className="text-lg font-extrabold text-neutral-900">{prenom} 👋</h1>
        </div>
      </div>

      {/* ── Hero card ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0d1f0f] via-primary-800 to-primary-600 rounded-3xl p-5 mb-4 shadow-lg relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <p className="text-white/70 text-xs font-medium">Votre espace Dinthialma</p>
          </div>

          <p className="text-white text-xl font-extrabold mb-1">Prêt à démarrer ?</p>
          <p className="text-white/60 text-xs mb-5">
            Créez votre propre tontine ou rejoignez un groupe existant.
          </p>

          {/* Stats à 0 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tontines', value: '0' },
              { label: 'Cotisations', value: '0' },
              { label: 'Jackpot', value: '0 FCFA' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl px-3 py-2.5 text-center">
                <p className="text-white font-extrabold text-base">{s.value}</p>
                <p className="text-white/55 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA principal ────────────────────────────────────────────── */}
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
        Que souhaitez-vous faire ?
      </p>

      <div className="space-y-3 mb-6">
        {/* Créer une tontine */}
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full flex items-center gap-4 bg-white border border-neutral-100 shadow-sm rounded-2xl p-4 hover:border-primary-200 hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Plus size={22} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900">Créer une tontine</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Devenez administrateur et invitez vos proches
            </p>
          </div>
          <ChevronRight size={16} className="text-neutral-300 flex-shrink-0" />
        </button>

        {/* Rejoindre avec un code */}
        <button
          onClick={() => setJoinOpen(true)}
          className="w-full flex items-center gap-4 bg-white border border-neutral-100 shadow-sm rounded-2xl p-4 hover:border-primary-200 hover:shadow-md transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Hash size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-900">Rejoindre une tontine</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Entrez le code d'invitation reçu de votre admin
            </p>
          </div>
          <ChevronRight size={16} className="text-neutral-300 flex-shrink-0" />
        </button>
      </div>

      {/* ── Comment ça marche ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-neutral-900 mb-3">Comment ça marche ?</p>
        <div className="space-y-3">
          {[
            { icon: <Plus size={14} />, color: 'bg-primary-50 text-primary-600', title: 'Créez ou rejoignez', desc: 'Formez un groupe de confiance avec votre entourage.' },
            { icon: <Users size={14} />, color: 'bg-blue-50 text-blue-600', title: 'Cotisez ensemble', desc: 'Chaque membre verse sa contribution à chaque cycle.' },
            { icon: <BookCopy size={14} />, color: 'bg-amber-50 text-amber-600', title: 'Recevez le jackpot', desc: 'À tour de rôle, chaque membre reçoit la cagnotte complète.' },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                {step.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800">{step.title}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modal : Créer une tontine ─────────────────────────────────── */}
      <CreateTontineModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* ── Modal : Rejoindre avec un code ───────────────────────────── */}
      <Modal
        isOpen={joinOpen}
        onClose={() => { setJoinCode(''); setJoinOpen(false) }}
        title="Rejoindre une tontine"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setJoinCode(''); setJoinOpen(false) }}>Annuler</Button>
            <Button
              disabled={joinCode.trim().length < 4}
              onClick={() => toast.info('Fonctionnalité bientôt disponible')}
            >
              Rejoindre
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">
            Entrez le code d'invitation que votre administrateur vous a transmis.
          </p>
          <Input
            label="Code d'invitation"
            placeholder="Ex : ABC123"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
        </div>
      </Modal>
    </AppLayout>
  )
}
