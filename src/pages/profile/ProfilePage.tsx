import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { userService } from '@/services/userService'
import { authService } from '@/services/authService'
import { User, Lock, Phone, KeyRound } from 'lucide-react'

// ─── Schémas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  phone: z.string().min(8, 'Numéro requis'),
  code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/),
  newPassword: z.string().min(8, 'Au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

const phoneSchema = z.object({
  newPhone: z.string().min(8, 'Numéro invalide'),
})

const phoneVerifySchema = z.object({
  code: z.string().length(6, 'Code à 6 chiffres').regex(/^\d{6}$/),
})

const pinSchema = z.object({
  pin: z.string().length(6, 'PIN à 6 chiffres').regex(/^\d{6}$/),
  confirmPin: z.string(),
}).refine((d) => d.pin === d.confirmPin, {
  message: 'Les PIN ne correspondent pas',
  path: ['confirmPin'],
})

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>
type PhoneData = z.infer<typeof phoneSchema>
type PhoneVerifyData = z.infer<typeof phoneVerifySchema>
type PinData = z.infer<typeof pinSchema>

export function ProfilePage() {
  const queryClient = useQueryClient()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1)
  const [newPhoneValue, setNewPhoneValue] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // ─── Chargement du profil ─────────────────────────────────────────────────
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile(),
  })

  // ─── Mise à jour du profil ────────────────────────────────────────────────
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: ProfileData) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profil mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  // ─── Formulaires ──────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email ?? '',
    } : undefined,
  })

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })
  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) })
  const phoneVerifyForm = useForm<PhoneVerifyData>({ resolver: zodResolver(phoneVerifySchema) })
  const pinForm = useForm<PinData>({ resolver: zodResolver(pinSchema) })

  // ─── Reset mot de passe (depuis profil) ───────────────────────────────────
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

  // ─── Changement de numéro ─────────────────────────────────────────────────
  const onRequestPhoneChange = async ({ newPhone }: PhoneData) => {
    try {
      await userService.requestPhoneChange({ newPhone })
      setNewPhoneValue(newPhone)
      setPhoneStep(2)
      toast.success('Code OTP envoyé sur le nouveau numéro')
    } catch {
      toast.error('Erreur lors de la demande de changement')
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

  // ─── Configuration PIN ────────────────────────────────────────────────────
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

  return (
    <AppLayout>
      <PageHeader title="Mon Profil" description="Gérez vos informations personnelles et la sécurité de votre compte" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Infos personnelles ─────────────────────────────────────────── */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <User size={20} /> Informations personnelles
          </h2>
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
              label="Email (optionnel)"
              type="email"
              error={profileForm.formState.errors.email?.message}
              {...profileForm.register('email')}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone</label>
              <div className="flex gap-2">
                <input
                  value={profile?.phone ?? ''}
                  disabled
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 text-sm"
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowPhoneModal(true)}>
                  <Phone size={16} /> Modifier
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={isUpdating}>Enregistrer</Button>
            </div>
          </form>
        </Card>

        {/* ─── Sécurité ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Lock size={20} /> Sécurité
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Mot de passe</p>
                  <p className="text-xs text-neutral-500">Modifier votre mot de passe</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                  Modifier
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Code PIN</p>
                  <p className="text-xs text-neutral-500">
                    {profile?.pinConfigured ? 'PIN configuré ✓' : 'Non configuré'}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowPinModal(true)}>
                  {profile?.pinConfigured ? 'Modifier' : 'Configurer'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-neutral-700 mb-3">Rôles</h2>
            <div className="flex flex-wrap gap-2">
              {(profile?.roles ?? []).map((r) => (
                <span key={r} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {r.replace('DINTHIALMA_', '')}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Modal mot de passe ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setOtpSent(false); passwordForm.reset() }}
        title="Modifier le mot de passe"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPasswordModal(false); setOtpSent(false); passwordForm.reset() }}>
              Annuler
            </Button>
            <Button form="password-form" type="submit" loading={passwordForm.formState.isSubmitting}>
              {otpSent ? 'Réinitialiser' : 'Envoyer le code'}
            </Button>
          </div>
        }
      >
        <form id="password-form" onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="+221 77 000 00 00"
            icon={<Phone size={16} />}
            error={passwordForm.formState.errors.phone?.message}
            {...passwordForm.register('phone')}
          />
          {otpSent && (
            <>
              <Input
                label="Code OTP reçu par SMS"
                type="text"
                placeholder="123456"
                maxLength={6}
                icon={<KeyRound size={16} />}
                error={passwordForm.formState.errors.code?.message}
                {...passwordForm.register('code')}
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
            </>
          )}
        </form>
      </Modal>

      {/* ─── Modal changement de numéro ─────────────────────────────────────── */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => { setShowPhoneModal(false); setPhoneStep(1); phoneForm.reset(); phoneVerifyForm.reset() }}
        title="Changer de numéro"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => { setShowPhoneModal(false); setPhoneStep(1) }}>Annuler</Button>
            <Button
              form={phoneStep === 1 ? 'phone-form' : 'phone-verify-form'}
              type="submit"
              loading={phoneForm.formState.isSubmitting || phoneVerifyForm.formState.isSubmitting}
            >
              {phoneStep === 1 ? 'Envoyer le code' : 'Confirmer'}
            </Button>
          </div>
        }
      >
        {phoneStep === 1 ? (
          <form id="phone-form" onSubmit={phoneForm.handleSubmit(onRequestPhoneChange)} className="space-y-4">
            <p className="text-sm text-neutral-500">Un code OTP sera envoyé sur le nouveau numéro pour confirmer qu'il vous appartient.</p>
            <Input
              label="Nouveau numéro"
              type="tel"
              placeholder="+221 77 000 00 00"
              icon={<Phone size={16} />}
              error={phoneForm.formState.errors.newPhone?.message}
              {...phoneForm.register('newPhone')}
            />
          </form>
        ) : (
          <form id="phone-verify-form" onSubmit={phoneVerifyForm.handleSubmit(onVerifyPhoneChange)} className="space-y-4">
            <p className="text-sm text-neutral-500">Code envoyé au <strong>{newPhoneValue}</strong></p>
            <Input
              label="Code OTP"
              type="text"
              placeholder="123456"
              maxLength={6}
              icon={<KeyRound size={16} />}
              error={phoneVerifyForm.formState.errors.code?.message}
              {...phoneVerifyForm.register('code')}
            />
          </form>
        )}
      </Modal>

      {/* ─── Modal PIN ──────────────────────────────────────────────────────── */}
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
          <Input
            label="Code PIN"
            type="password"
            placeholder="••••••"
            maxLength={6}
            icon={<KeyRound size={16} />}
            error={pinForm.formState.errors.pin?.message}
            {...pinForm.register('pin')}
          />
          <Input
            label="Confirmer le PIN"
            type="password"
            placeholder="••••••"
            maxLength={6}
            error={pinForm.formState.errors.confirmPin?.message}
            {...pinForm.register('confirmPin')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
