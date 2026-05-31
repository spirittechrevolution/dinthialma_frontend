import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAddMembre } from '@/hooks/useMembres'
import { userService } from '@/services/userService'
import { UserSearchResult } from '@/types/user'
import { AccountStatus } from '@/types/common'
import { Phone, User, Search, CheckCircle, Clock, ArrowLeft } from 'lucide-react'

type Step = 'search' | 'found' | 'not_found'

// ─── Zod : ordreJackpot optionnel — gère les strings vides ───────────────────

const optionalPosition = z.preprocess(
  (v) => (v === '' || v === null || v === undefined) ? undefined : Number(v),
  z.number().int().positive('La position doit être un entier positif').optional()
)

const searchSchema = z.object({
  phone: z.string().min(8, 'Numéro invalide'),
})

const positionSchema = z.object({
  ordreJackpot: optionalPosition,
})

const newMembreSchema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères'),
  ordreJackpot: optionalPosition,
})

type SearchForm = z.infer<typeof searchSchema>
type PositionForm = z.infer<typeof positionSchema>
type NewMembreForm = z.infer<typeof newMembreSchema>

// ─── Parsing des erreurs API ──────────────────────────────────────────────────

function parseAddError(err: unknown): string {
  if (!isAxiosError(err)) return "Erreur lors de l'ajout. Réessayez."
  const msg: string = err.response?.data?.message || ''
  const status = err.response?.status
  if (status === 409) {
    if (msg.toLowerCase().includes('position') || msg.toLowerCase().includes('ordre')) {
      return 'Cette position jackpot est déjà occupée. Choisissez une autre.'
    }
    return 'Ce membre est déjà dans cette tontine.'
  }
  if (status === 400) return msg || 'Informations manquantes ou invalides.'
  return "Erreur lors de l'ajout. Réessayez."
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddMembreModalProps {
  tontineId: string
  isOpen: boolean
  onClose: () => void
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AddMembreModal({ tontineId, isOpen, onClose }: AddMembreModalProps) {
  const [step, setStep] = useState<Step>('search')
  const [foundUser, setFoundUser] = useState<UserSearchResult | null>(null)
  const [phoneSearched, setPhoneSearched] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  const { mutate: addMembre, isPending: isAdding } = useAddMembre()

  const searchForm = useForm<SearchForm>({ resolver: zodResolver(searchSchema) })
  const positionForm = useForm<PositionForm>({ resolver: zodResolver(positionSchema) })
  const newMembreForm = useForm<NewMembreForm>({ resolver: zodResolver(newMembreSchema) })

  const resetAll = () => {
    setStep('search')
    setFoundUser(null)
    setPhoneSearched('')
    setSearchError(null)
    setAddError(null)
    searchForm.reset()
    positionForm.reset()
    newMembreForm.reset()
  }

  const handleClose = () => { resetAll(); onClose() }
  const handleBack = () => {
    setStep('search')
    setFoundUser(null)
    setAddError(null)
    positionForm.reset()
    newMembreForm.reset()
  }

  // ─── Étape 1 — Recherche par téléphone ──────────────────────────────────────

  const onSearch = async ({ phone }: SearchForm) => {
    setIsSearching(true)
    setSearchError(null)
    try {
      const user = await userService.searchByPhone(phone)
      setFoundUser(user)
      setPhoneSearched(phone)
      setStep('found')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setFoundUser(null)
        setPhoneSearched(phone)
        setStep('not_found')
      } else {
        setSearchError('Erreur lors de la recherche. Vérifiez le numéro.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  // ─── Étape 2A — Ajout utilisateur trouvé ────────────────────────────────────

  const onAddFound = ({ ordreJackpot }: PositionForm) => {
    setAddError(null)
    addMembre(
      { tontineId, request: { phone: phoneSearched, ordreJackpot } },
      {
        onSuccess: (result) => {
          const msg = result.user.accountStatus === AccountStatus.PRE_ENROLLED
            ? `Membre ajouté. Un SMS d'invitation a été envoyé au ${result.user.phone}.`
            : 'Membre ajouté avec succès.'
          toast.success(msg)
          handleClose()
        },
        onError: (err) => setAddError(parseAddError(err)),
      }
    )
  }

  // ─── Étape 2B — Ajout nouveau membre ────────────────────────────────────────

  const onAddNew = ({ firstName, lastName, ordreJackpot }: NewMembreForm) => {
    setAddError(null)
    addMembre(
      { tontineId, request: { phone: phoneSearched, firstName, lastName, ordreJackpot } },
      {
        onSuccess: (result) => {
          const msg = result.user.accountStatus === AccountStatus.PRE_ENROLLED
            ? `Membre ajouté. Un SMS d'invitation a été envoyé au ${result.user.phone}.`
            : 'Membre ajouté avec succès.'
          toast.success(msg)
          handleClose()
        },
        onError: (err) => setAddError(parseAddError(err)),
      }
    )
  }

  // ─── Titre dynamique ─────────────────────────────────────────────────────────

  const title =
    step === 'search' ? 'Ajouter un membre'
    : step === 'found' ? 'Utilisateur trouvé'
    : 'Nouveau membre'

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">

      {/* ── Étape 1 : saisie du numéro ──────────────────────────────────────── */}
      {step === 'search' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Entrez le numéro de téléphone du membre à ajouter.
          </p>
          <Input
            label="Numéro de téléphone *"
            type="tel"
            placeholder="+221 77 000 00 00"
            icon={<Phone size={16} />}
            error={searchForm.formState.errors.phone?.message}
            {...searchForm.register('phone')}
          />
          {searchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {searchError}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              loading={isSearching}
              onClick={searchForm.handleSubmit(onSearch)}
            >
              <Search size={15} className="mr-1.5" /> Rechercher
            </Button>
          </div>
        </div>
      )}

      {/* ── Étape 2A : utilisateur trouvé ──────────────────────────────────── */}
      {step === 'found' && foundUser && (
        <div className="space-y-4">
          {/* Fiche utilisateur */}
          <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-100 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
              {foundUser.firstName[0]}{foundUser.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900">
                {foundUser.firstName} {foundUser.lastName}
              </p>
              <p className="text-sm text-neutral-500 font-mono">{foundUser.phone}</p>
              <div className="mt-1.5">
                {foundUser.accountStatus === AccountStatus.PRE_ENROLLED ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                    <Clock size={10} /> En attente d'inscription
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} /> Compte actif
                  </span>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Position jackpot (optionnel)"
            type="number"
            min={1}
            placeholder="Laisser vide = fin de liste automatique"
            error={positionForm.formState.errors.ordreJackpot?.message}
            {...positionForm.register('ordreJackpot')}
          />

          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {addError}
            </div>
          )}

          <div className="flex gap-3 justify-between pt-2">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isAdding}>
              <ArrowLeft size={14} className="mr-1" /> Retour
            </Button>
            <Button
              type="button"
              loading={isAdding}
              onClick={positionForm.handleSubmit(onAddFound)}
            >
              Ajouter à la tontine
            </Button>
          </div>
        </div>
      )}

      {/* ── Étape 2B : numéro inconnu ──────────────────────────────────────── */}
      {step === 'not_found' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            Ce numéro n'est pas encore sur Dinthialma. Un SMS d'invitation sera envoyé automatiquement.
          </div>

          {/* Téléphone pré-rempli en lecture seule */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Téléphone</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-600 font-mono">
              <Phone size={15} className="text-neutral-400 flex-shrink-0" />
              {phoneSearched}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom *"
              placeholder="Fatou"
              icon={<User size={14} />}
              error={newMembreForm.formState.errors.firstName?.message}
              {...newMembreForm.register('firstName')}
            />
            <Input
              label="Nom *"
              placeholder="Sow"
              icon={<User size={14} />}
              error={newMembreForm.formState.errors.lastName?.message}
              {...newMembreForm.register('lastName')}
            />
          </div>

          <Input
            label="Position jackpot (optionnel)"
            type="number"
            min={1}
            placeholder="Laisser vide = fin de liste automatique"
            error={newMembreForm.formState.errors.ordreJackpot?.message}
            {...newMembreForm.register('ordreJackpot')}
          />

          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {addError}
            </div>
          )}

          <div className="flex gap-3 justify-between pt-2">
            <Button type="button" variant="ghost" onClick={handleBack} disabled={isAdding}>
              <ArrowLeft size={14} className="mr-1" /> Retour
            </Button>
            <Button
              type="button"
              loading={isAdding}
              onClick={newMembreForm.handleSubmit(onAddNew)}
            >
              Ajouter le membre
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
