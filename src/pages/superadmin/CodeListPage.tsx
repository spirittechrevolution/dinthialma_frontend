import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { codeListService, CodeListRequest } from '@/services/codeListService'
import { CodeListItem } from '@/types/common'
import { Plus, Edit2, Lock, Database } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

const ALL_TYPES = [
  'FREQUENCE_TONTINE',
  'METHODE_PAIEMENT',
  'STATUT_COTISATION',
  'ORDRE_BENEFICIAIRE',
  'ROLE_INTERNE',
] as const

type CodeListTypeEnum = typeof ALL_TYPES[number]

const TYPE_LABELS: Record<CodeListTypeEnum, string> = {
  FREQUENCE_TONTINE: 'Fréquences',
  METHODE_PAIEMENT: 'Méthodes de paiement',
  STATUT_COTISATION: 'Statuts cotisation',
  ORDRE_BENEFICIAIRE: 'Ordre bénéficiaire',
  ROLE_INTERNE: 'Rôles internes',
}

// ─── Schemas Zod ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  type: z.enum(ALL_TYPES, { required_error: 'Type requis' }),
  value: z.string().min(1, 'Valeur requise').max(100),
  description: z.string().min(1, 'Description requise').max(500),
})

const editSchema = z.object({
  value: z.string().min(1, 'Valeur requise').max(100),
  description: z.string().min(1, 'Description requise').max(500),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

// ─── Composant ────────────────────────────────────────────────────────────────

export function CodeListPage() {
  const [activeType, setActiveType] = useState<CodeListTypeEnum | 'TOUS'>('TOUS')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<CodeListItem | null>(null)
  const queryClient = useQueryClient()

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['codeLists'],
    queryFn: () => codeListService.list(0, 200),
  })

  const { mutate: createItem, isPending: isCreating } = useMutation({
    mutationFn: (req: CodeListRequest) => codeListService.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeLists'] })
      toast.success('Entrée créée')
      setIsCreateOpen(false)
      createForm.reset()
    },
    onError: () => toast.error('Erreur lors de la création'),
  })

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, req }: { id: string; req: Partial<CodeListRequest> }) =>
      codeListService.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeLists'] })
      toast.success('Entrée mise à jour')
      setEditItem(null)
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const allItems: CodeListItem[] = pageData?.content || []
  const displayed = activeType === 'TOUS'
    ? allItems
    : allItems.filter((item) => item.type === activeType)

  const countByType = (type: string) => allItems.filter((i) => i.type === type).length

  const openEdit = (item: CodeListItem) => {
    setEditItem(item)
    editForm.reset({ value: item.value, description: item.description })
  }

  const onCreateSubmit = (data: CreateForm) => createItem(data)
  const onEditSubmit = (data: EditForm) => {
    if (!editItem) return
    updateItem({ id: editItem.id, req: { value: data.value, description: data.description } })
  }

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Référentiels</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gérez les valeurs utilisées dans les listes déroulantes de l'application.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} className="mr-1.5" /> Ajouter une entrée
        </Button>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">

        {/* Tabs — mobile select */}
        <div className="sm:hidden px-5 py-3 border-b border-neutral-100">
          <select
            value={activeType}
            onChange={(e) => setActiveType(e.target.value as CodeListTypeEnum | 'TOUS')}
            className="w-full text-sm font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="TOUS">Tous ({allItems.length})</option>
            {ALL_TYPES.map((type) => (
              <option key={type} value={type}>{TYPE_LABELS[type]} ({countByType(type)})</option>
            ))}
          </select>
        </div>
        {/* Tabs — desktop buttons */}
        <div className="hidden sm:flex px-5 pt-4 pb-0 items-center gap-1 overflow-x-auto border-b border-neutral-100">
          <button
            onClick={() => setActiveType('TOUS')}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              activeType === 'TOUS'
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Tous ({allItems.length})
          </button>
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                activeType === type
                  ? 'bg-primary-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {TYPE_LABELS[type]} ({countByType(type)})
            </button>
          ))}
        </div>

        {/* Cards — mobile */}
        <div className="sm:hidden divide-y divide-neutral-50">
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-10 text-neutral-400">
              <Database size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune entrée dans ce référentiel</p>
            </div>
          ) : (
            displayed.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-mono rounded">{item.type}</span>
                    {item.systemAssign && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">
                        <Lock size={9} /> Système
                      </span>
                    )}
                  </div>
                  <p className="font-mono font-semibold text-neutral-800 text-sm">{item.value}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                </div>
                <button
                  onClick={() => openEdit(item)}
                  title="Modifier"
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors flex-shrink-0"
                >
                  <Edit2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Table — desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Type', 'Valeur technique', 'Description / Libellé', 'Système', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Spinner />
                  </td>
                </tr>
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-400">
                    <Database size={32} className="mx-auto mb-2 opacity-30" />
                    Aucune entrée dans ce référentiel
                  </td>
                </tr>
              ) : (
                displayed.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-mono rounded">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-neutral-800 text-sm">
                        {item.value}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700">{item.description}</td>
                    <td className="px-5 py-3.5">
                      {item.systemAssign ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          <Lock size={10} /> Système
                        </span>
                      ) : (
                        <span className="text-neutral-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(item)}
                        title="Modifier"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Créer ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); createForm.reset() }}
        title="Ajouter une entrée"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              type="button"
              disabled={isCreating}
              onClick={() => { setIsCreateOpen(false); createForm.reset() }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              loading={isCreating}
              onClick={createForm.handleSubmit(onCreateSubmit)}
            >
              Créer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Type select */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Type *
            </label>
            <select
              {...createForm.register('type')}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="">Choisir un type…</option>
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]} — {t}
                </option>
              ))}
            </select>
            {createForm.formState.errors.type && (
              <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.type.message}</p>
            )}
          </div>

          <Input
            label="Valeur technique *"
            placeholder="EX_VALEUR_TECHNIQUE"
            error={createForm.formState.errors.value?.message}
            {...createForm.register('value')}
          />
          <Input
            label="Description / Libellé *"
            placeholder="Libellé affiché à l'utilisateur"
            error={createForm.formState.errors.description?.message}
            {...createForm.register('description')}
          />

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            La valeur technique est utilisée dans le code. Elle doit être unique par type.
          </div>
        </div>
      </Modal>

      {/* ── Modal Modifier ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Modifier une entrée"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              type="button"
              disabled={isUpdating}
              onClick={() => setEditItem(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              loading={isUpdating}
              onClick={editForm.handleSubmit(onEditSubmit)}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        {editItem && (
          <div className="space-y-4">
            {/* Type (lecture seule) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Type</label>
              <div className="px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-600">
                {editItem.type}
              </div>
            </div>

            {editItem.systemAssign ? (
              <>
                {/* Valeur verrouillée pour les entrées système */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Valeur technique
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500">
                    <Lock size={13} className="text-neutral-400 flex-shrink-0" />
                    <span className="font-mono">{editItem.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    Valeur verrouillée — entrée gérée par le système.
                  </p>
                </div>
              </>
            ) : (
              <Input
                label="Valeur technique *"
                error={editForm.formState.errors.value?.message}
                {...editForm.register('value')}
              />
            )}

            <Input
              label="Description / Libellé *"
              error={editForm.formState.errors.description?.message}
              {...editForm.register('description')}
            />
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
