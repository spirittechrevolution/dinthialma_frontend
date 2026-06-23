import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { userService } from '@/services/userService'
import { authService } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import {
  Mail, Phone, Lock, KeyRound, Shield, ChevronRight,
  LogOut, User, CheckCircle,
} from 'lucide-react'

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName:  z.string().min(2, 'Au moins 2 caractères'),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
})
const passwordSchema = z.object({
  phone:           z.string().min(8, 'Numéro requis'),
  code:            z.string().length(6, '6 chiffres').regex(/^\d{6}$/),
  newPassword:     z.string().min(8, 'Au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'],
})
const phoneSchema       = z.object({ newPhone: z.string().min(8, 'Invalide') })
const phoneVerifySchema = z.object({ code: z.string().length(6, '6 chiffres').regex(/^\d{6}$/) })
const pinSchema         = z.object({
  pin:        z.string().length(6, '6 chiffres').regex(/^\d{6}$/),
  confirmPin: z.string(),
}).refine((d) => d.pin === d.confirmPin, { message: 'Les PIN ne correspondent pas', path: ['confirmPin'] })

type ProfileData     = z.infer<typeof profileSchema>
type PasswordData    = z.infer<typeof passwordSchema>
type PhoneData       = z.infer<typeof phoneSchema>
type PhoneVerifyData = z.infer<typeof phoneVerifySchema>
type PinData         = z.infer<typeof pinSchema>

function getRoleLabel(roles: string[]) {
  const n = roles.map((r) => r.replace('DINTHIALMA_', ''))
  if (n.includes('SUPER_ADMIN')) return 'Super Admin'
  if (n.includes('ADMIN'))       return 'Admin'
  if (n.includes('MEMBER'))      return 'Membre'
  return 'Utilisateur'
}
function getInitials(first: string, last: string) {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase()
}

// ─── Ligne action sécurité ────────────────────────────────────────────────────
function SecurityRow({ icon, label, sub, onPress, badge }: {
  icon: React.ReactNode; label: string; sub?: string; onPress: () => void; badge?: string
}) {
  return (
    <button onClick={onPress}
      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{label}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 flex-shrink-0">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-neutral-300 flex-shrink-0" />
    </button>
  )
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { logout } = useAuth()

  const [showEdit,         setShowEdit]         = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPhoneModal,   setShowPhoneModal]   = useState(false)
  const [showPinModal,     setShowPinModal]     = useState(false)
  const [phoneStep,        setPhoneStep]        = useState<1 | 2>(1)
  const [newPhoneValue,    setNewPhoneValue]    = useState('')
  const [otpSent,          setOtpSent]          = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  })

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: ProfileData) => userService.updateProfile(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profil mis à jour'); setShowEdit(false) },
    onError:   () => toast.error('Erreur lors de la mise à jour'),
  })

  const profileForm  = useForm<ProfileData>({ resolver: zodResolver(profileSchema),
    values: profile ? { firstName: profile.firstName, lastName: profile.lastName, email: profile.email ?? '' } : undefined })
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema), defaultValues: { phone: '+221' } })
  const phoneForm    = useForm<PhoneData>({ resolver: zodResolver(phoneSchema), defaultValues: { newPhone: '+221' } })
  const phoneVerifyForm = useForm<PhoneVerifyData>({ resolver: zodResolver(phoneVerifySchema) })
  const pinForm      = useForm<PinData>({ resolver: zodResolver(pinSchema) })

  const onResetPassword = async (data: PasswordData) => {
    try {
      if (!otpSent) {
        await authService.sendForgotPasswordOtp({ phone: data.phone })
        setOtpSent(true)
        toast.success('Code OTP envoyé par SMS')
        return
      }
      await authService.resetPassword({ phone: data.phone, code: data.code, newPassword: data.newPassword })
      toast.success('Mot de passe modifié')
      setShowPasswordModal(false); setOtpSent(false); passwordForm.reset()
    } catch { toast.error('Code incorrect ou expiré') }
  }

  const onRequestPhoneChange = async ({ newPhone }: PhoneData) => {
    try {
      await userService.requestPhoneChange({ newPhone })
      setNewPhoneValue(newPhone); setPhoneStep(2)
      toast.success('Code envoyé sur le nouveau numéro')
    } catch { toast.error('Erreur lors de la demande') }
  }

  const onVerifyPhoneChange = async ({ code }: PhoneVerifyData) => {
    try {
      await userService.verifyPhoneChange({ newPhone: newPhoneValue, code })
      toast.success('Numéro modifié — reconnexion requise')
      setShowPhoneModal(false)
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } catch { toast.error('Code incorrect ou expiré') }
  }

  const onSetupPin = async ({ pin, confirmPin }: PinData) => {
    try {
      await authService.setupPin({ pin, confirmPin })
      toast.success('PIN configuré')
      setShowPinModal(false); pinForm.reset()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch { toast.error('Erreur lors de la configuration') }
  }

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const initials   = profile ? getInitials(profile.firstName, profile.lastName) : '?'
  const roleLabel  = profile ? getRoleLabel(profile.roles ?? []) : ''
  const fullName   = profile ? `${profile.firstName} ${profile.lastName}` : '—'

  return (
    <AppLayout>
      {/* ── Hero avatar ──────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-2 pb-6 mb-5">
        {/* Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-extrabold flex items-center justify-center shadow-lg ring-4 ring-white">
            {initials}
          </div>
        </div>
        <p className="text-lg font-bold text-neutral-900">{fullName}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Shield size={12} className="text-primary-600" />
          <span className="text-xs font-semibold text-primary-600">{roleLabel}</span>
        </div>
        {profile?.pinConfigured && (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
            <CheckCircle size={9} /> PIN configuré
          </span>
        )}
      </div>

      {/* ── Infos compte ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm mb-3 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-50">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Informations</p>
        </div>
        <div className="divide-y divide-neutral-50">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <User size={16} className="text-neutral-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-neutral-400">Nom complet</p>
              <p className="text-sm font-semibold text-neutral-900">{fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone size={16} className="text-neutral-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-neutral-400">Téléphone</p>
              <p className="text-sm font-semibold text-neutral-900">{profile?.phone ?? '—'}</p>
            </div>
            <button onClick={() => setShowPhoneModal(true)}
              className="text-xs font-semibold text-primary-600 hover:underline">
              Modifier
            </button>
          </div>
          {profile?.email && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Mail size={16} className="text-neutral-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-neutral-400">Email</p>
                <p className="text-sm font-semibold text-neutral-900">{profile.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions compte ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm mb-3 overflow-hidden">
        <div className="divide-y divide-neutral-50">
          <SecurityRow
            icon={<User size={17} />}
            label="Modifier mes informations"
            sub="Prénom, nom, email"
            onPress={() => setShowEdit(true)}
          />
          <SecurityRow
            icon={<Lock size={17} />}
            label="Changer mot de passe"
            sub="Sécurisez votre compte"
            onPress={() => setShowPasswordModal(true)}
          />
          <SecurityRow
            icon={<KeyRound size={17} />}
            label="Code PIN"
            sub="Configurer ou changer votre code PIN"
            badge={profile?.pinConfigured ? 'Actif' : undefined}
            onPress={() => setShowPinModal(true)}
          />
        </div>
      </div>

      {/* ── Déconnexion ──────────────────────────────────────────── */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 active:bg-red-200 transition-colors mb-6"
      >
        <LogOut size={16} />
        Se déconnecter
      </button>

      <p className="text-center text-xs text-neutral-400 mb-4">© 2026 Dinthialma · v1.0.0</p>

      {/* ── Modal édition profil ─────────────────────────────────── */}
      <Modal
        isOpen={showEdit}
        onClose={() => { setShowEdit(false); profileForm.reset() }}
        title="Modifier le profil"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowEdit(false); profileForm.reset() }}>Annuler</Button>
            <Button form="profile-form" type="submit" loading={isUpdating}>Enregistrer</Button>
          </div>
        }
      >
        <form id="profile-form" onSubmit={profileForm.handleSubmit((d) => updateProfile(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')} />
            <Input label="Nom"    error={profileForm.formState.errors.lastName?.message}  {...profileForm.register('lastName')} />
          </div>
          <Input label="Email" type="email" placeholder="email@exemple.com" icon={<Mail size={15} />}
            error={profileForm.formState.errors.email?.message} {...profileForm.register('email')} />
        </form>
      </Modal>

      {/* ── Modal mot de passe ───────────────────────────────────── */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setOtpSent(false); passwordForm.reset() }}
        title="Modifier le mot de passe"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPasswordModal(false); setOtpSent(false); passwordForm.reset() }}>Annuler</Button>
            <Button form="password-form" type="submit" loading={passwordForm.formState.isSubmitting}>
              {otpSent ? 'Réinitialiser' : 'Envoyer le code'}
            </Button>
          </div>
        }
      >
        <form id="password-form" onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
          <PhoneInput name="phone" control={passwordForm.control} label="Votre téléphone"
            type="tel" placeholder="77 000 00 00" icon={<Phone size={16} />}
            error={passwordForm.formState.errors.phone?.message} />
          {otpSent && (
            <>
              <Input label="Code OTP reçu par SMS" type="text" placeholder="123456" maxLength={6}
                icon={<KeyRound size={16} />} error={passwordForm.formState.errors.code?.message}
                {...passwordForm.register('code')} />
              <Input label="Nouveau mot de passe" type="password" placeholder="••••••••"
                icon={<Lock size={16} />} error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')} />
              <Input label="Confirmer" type="password" placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')} />
            </>
          )}
        </form>
      </Modal>

      {/* ── Modal changement numéro ──────────────────────────────── */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => { setShowPhoneModal(false); setPhoneStep(1); phoneForm.reset(); phoneVerifyForm.reset() }}
        title="Changer de numéro"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPhoneModal(false); setPhoneStep(1) }}>Annuler</Button>
            <Button form={phoneStep === 1 ? 'phone-form' : 'phone-verify-form'} type="submit"
              loading={phoneForm.formState.isSubmitting || phoneVerifyForm.formState.isSubmitting}>
              {phoneStep === 1 ? 'Envoyer le code' : 'Confirmer'}
            </Button>
          </div>
        }
      >
        {phoneStep === 1 ? (
          <form id="phone-form" onSubmit={phoneForm.handleSubmit(onRequestPhoneChange)} className="space-y-4">
            <p className="text-sm text-neutral-500">Un code OTP sera envoyé sur le nouveau numéro.</p>
            <PhoneInput name="newPhone" control={phoneForm.control} label="Nouveau numéro"
              type="tel" placeholder="77 000 00 00" icon={<Phone size={16} />}
              error={phoneForm.formState.errors.newPhone?.message} />
          </form>
        ) : (
          <form id="phone-verify-form" onSubmit={phoneVerifyForm.handleSubmit(onVerifyPhoneChange)} className="space-y-4">
            <p className="text-sm text-neutral-500">Code envoyé au <strong>{newPhoneValue}</strong></p>
            <Input label="Code OTP" type="text" placeholder="123456" maxLength={6} icon={<KeyRound size={16} />}
              error={phoneVerifyForm.formState.errors.code?.message} {...phoneVerifyForm.register('code')} />
          </form>
        )}
      </Modal>

      {/* ── Modal PIN ────────────────────────────────────────────── */}
      <Modal
        isOpen={showPinModal}
        onClose={() => { setShowPinModal(false); pinForm.reset() }}
        title={profile?.pinConfigured ? 'Modifier le PIN' : 'Configurer le PIN'}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPinModal(false); pinForm.reset() }}>Annuler</Button>
            <Button form="pin-form" type="submit" loading={pinForm.formState.isSubmitting}>Enregistrer</Button>
          </div>
        }
      >
        <form id="pin-form" onSubmit={pinForm.handleSubmit(onSetupPin)} className="space-y-4">
          <p className="text-sm text-neutral-500">Le PIN à 6 chiffres permet une connexion rapide sans mot de passe.</p>
          <Input label="Code PIN" type="password" placeholder="••••••" maxLength={6} icon={<KeyRound size={16} />}
            error={pinForm.formState.errors.pin?.message} {...pinForm.register('pin')} />
          <Input label="Confirmer le PIN" type="password" placeholder="••••••" maxLength={6}
            error={pinForm.formState.errors.confirmPin?.message} {...pinForm.register('confirmPin')} />
        </form>
      </Modal>
    </AppLayout>
  )
}
