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
import { Mail, Phone, Lock, KeyRound, Shield } from 'lucide-react'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  phone: z.string().min(8, 'Numéro requis'),
  code: z.string().length(6, '6 chiffres').regex(/^\d{6}$/),
  newPassword: z.string().min(8, 'Au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

const phoneSchema = z.object({ newPhone: z.string().min(8, 'Invalide') })
const phoneVerifySchema = z.object({ code: z.string().length(6, '6 chiffres').regex(/^\d{6}$/) })
const pinSchema = z.object({
  pin: z.string().length(6, '6 chiffres').regex(/^\d{6}$/),
  confirmPin: z.string(),
}).refine((d) => d.pin === d.confirmPin, { message: 'Les PIN ne correspondent pas', path: ['confirmPin'] })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>
type PhoneData = z.infer<typeof phoneSchema>
type PhoneVerifyData = z.infer<typeof phoneVerifySchema>
type PinData = z.infer<typeof pinSchema>

function getRoleLabel(roles: string[]) {
  const normalized = roles.map((r) => r.replace('DINTHIALMA_', ''))
  if (normalized.includes('SUPER_ADMIN')) return 'Super Admin'
  if (normalized.includes('ADMIN')) return 'Admin'
  if (normalized.includes('MEMBER')) return 'Membre'
  return 'Utilisateur'
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1)
  const [newPhoneValue, setNewPhoneValue] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  })

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: ProfileData) => userService.updateProfile(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profil mis à jour') },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: profile ? { firstName: profile.firstName, lastName: profile.lastName, email: profile.email ?? '' } : undefined,
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { phone: '+221' },
  })
  const phoneForm = useForm<PhoneData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { newPhone: '+221' },
  })
  const phoneVerifyForm = useForm<PhoneVerifyData>({ resolver: zodResolver(phoneVerifySchema) })
  const pinForm = useForm<PinData>({ resolver: zodResolver(pinSchema) })

  const onResetPassword = async (data: PasswordData) => {
    try {
      if (!otpSent) {
        await authService.sendForgotPasswordOtp({ phone: data.phone })
        setOtpSent(true)
        toast.success('Code OTP envoyé par SMS')
        return
      }
      await authService.resetPassword({ phone: data.phone, code: data.code, newPassword: data.newPassword })
      toast.success('Mot de passe modifié avec succès')
      setShowPasswordModal(false)
      setOtpSent(false)
      passwordForm.reset()
    } catch {
      toast.error('Code incorrect ou expiré')
    }
  }

  const onRequestPhoneChange = async ({ newPhone }: PhoneData) => {
    try {
      await userService.requestPhoneChange({ newPhone })
      setNewPhoneValue(newPhone)
      setPhoneStep(2)
      toast.success('Code OTP envoyé sur le nouveau numéro')
    } catch {
      toast.error('Erreur lors de la demande')
    }
  }

  const onVerifyPhoneChange = async ({ code }: PhoneVerifyData) => {
    try {
      await userService.verifyPhoneChange({ newPhone: newPhoneValue, code })
      toast.success('Numéro modifié — reconnexion requise')
      setShowPhoneModal(false)
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } catch {
      toast.error('Code incorrect ou expiré')
    }
  }

  const onSetupPin = async ({ pin, confirmPin }: PinData) => {
    try {
      await authService.setupPin({ pin, confirmPin })
      toast.success('PIN configuré avec succès')
      setShowPinModal(false)
      pinForm.reset()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch {
      toast.error('Erreur lors de la configuration du PIN')
    }
  }

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Spinner /></div></AppLayout>

  const initials = profile ? getInitials(profile.firstName, profile.lastName) : '?'
  const roleLabel = profile ? getRoleLabel(profile.roles ?? []) : ''

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Mon profil</h1>
        <p className="text-sm text-neutral-500 mt-1">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Infos personnelles */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 mb-4">
        {/* Avatar + nom */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-neutral-100">
          <div className="w-14 h-14 rounded-full bg-primary-600 text-white text-xl font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-neutral-900">{profile?.firstName} {profile?.lastName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield size={13} className="text-neutral-400" />
              <span className="text-sm text-neutral-500">{roleLabel}</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={profileForm.handleSubmit((d) => updateProfile(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            <Input
              label="Nom"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            icon={<Mail size={15} />}
            placeholder="email@exemple.com"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email')}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Téléphone</label>
            <div className="flex items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 text-sm">
              <Phone size={15} className="flex-shrink-0" />
              <span>{profile?.phone ?? '—'}</span>
            </div>
            <p className="text-xs text-primary-600 mt-1.5">
              Le changement de téléphone nécessite une vérification OTP.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => profileForm.reset()}>
              Annuler
            </Button>
            <Button type="submit" loading={isUpdating}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Sécurité</h2>
        <p className="text-sm text-neutral-500 mb-4">Gérez votre mot de passe et votre code PIN.</p>

        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
              <Lock size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-neutral-900">Mot de passe</p>
              <p className="text-xs text-neutral-500">Modifié il y a quelques jours</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
              Modifier
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
              <KeyRound size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-neutral-900">Code PIN</p>
              <p className="text-xs text-neutral-500">
                {profile?.pinConfigured ? 'PIN configuré ✓' : 'Non configuré'}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowPinModal(true)}>
              {profile?.pinConfigured ? 'Modifier' : 'Configurer'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal mot de passe */}
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
          <PhoneInput
            name="phone"
            control={passwordForm.control}
            label="Numéro de téléphone"
            type="tel"
            placeholder="77 000 00 00"
            icon={<Phone size={16} />}
            error={passwordForm.formState.errors.phone?.message}
          />
          {otpSent && (
            <>
              <Input label="Code OTP reçu par SMS" type="text" placeholder="123456" maxLength={6} icon={<KeyRound size={16} />}
                error={passwordForm.formState.errors.code?.message} {...passwordForm.register('code')} />
              <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" icon={<Lock size={16} />}
                error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
              <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
            </>
          )}
        </form>
      </Modal>

      {/* Modal changement numéro */}
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
            <PhoneInput
              name="newPhone"
              control={phoneForm.control}
              label="Nouveau numéro"
              type="tel"
              placeholder="77 000 00 00"
              icon={<Phone size={16} />}
              error={phoneForm.formState.errors.newPhone?.message}
            />
          </form>
        ) : (
          <form id="phone-verify-form" onSubmit={phoneVerifyForm.handleSubmit(onVerifyPhoneChange)} className="space-y-4">
            <p className="text-sm text-neutral-500">Code envoyé au <strong>{newPhoneValue}</strong></p>
            <Input label="Code OTP" type="text" placeholder="123456" maxLength={6} icon={<KeyRound size={16} />}
              error={phoneVerifyForm.formState.errors.code?.message} {...phoneVerifyForm.register('code')} />
          </form>
        )}
      </Modal>

      {/* Modal PIN */}
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
          <p className="text-sm text-neutral-500">Le PIN à 6 chiffres permet une connexion rapide.</p>
          <Input label="Code PIN" type="password" placeholder="••••••" maxLength={6} icon={<KeyRound size={16} />}
            error={pinForm.formState.errors.pin?.message} {...pinForm.register('pin')} />
          <Input label="Confirmer le PIN" type="password" placeholder="••••••" maxLength={6}
            error={pinForm.formState.errors.confirmPin?.message} {...pinForm.register('confirmPin')} />
        </form>
      </Modal>
    </AppLayout>
  )
}
