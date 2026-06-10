import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { userService } from '@/services/userService'
import { AdminUserResponse, UpdateUserRolesRequest } from '@/types/user'
import { Search, MoreHorizontal, UserCheck, UserX, Edit2, Clock } from 'lucide-react'

type UserAction = { type: 'enable' | 'disable'; userId: string; nom: string } | null
type RolesAction = { userId: string; nom: string; currentRoles: string[] } | null

const ALL_ROLES = ['USER', 'MEMBER', 'ADMIN', 'SUPER_ADMIN']

const ROLE_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Membre', value: 'MEMBER' },
]

const PAGE_SIZE = 10

const STATUS_TABS = [
  { label: 'Tous', value: '' },
  { label: 'Inscrits', value: 'ACTIVE' },
  { label: 'En attente', value: 'PRE_ENROLLED' },
]

function UserInitials({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-primary-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-500', 'bg-teal-600']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <span className={`w-8 h-8 rounded-full ${colors[idx]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </span>
  )
}

function ActionsMenu({ user, onEdit, onToggle }: {
  user: AdminUserResponse
  onEdit: () => void
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isPreEnrolled = user.accountStatus === 'PRE_ENROLLED'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 z-20 overflow-hidden text-sm">
            {!isPreEnrolled && (
              <>
                <button
                  onClick={() => { setOpen(false); onEdit() }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 text-neutral-700 transition-colors"
                >
                  <Edit2 size={14} /> Modifier rôles
                </button>
                <button
                  onClick={() => { setOpen(false); onToggle() }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 transition-colors border-t border-neutral-100 ${user.active ? 'text-red-600' : 'text-primary-600'}`}
                >
                  {user.active ? <><UserX size={14} /> Désactiver</> : <><UserCheck size={14} /> Réactiver</>}
                </button>
              </>
            )}
            {isPreEnrolled && (
              <div className="px-4 py-3 text-xs text-neutral-400">
                Aucune action disponible — compte non activé
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleTab, setRoleTab] = useState('')
  const [statusTab, setStatusTab] = useState('')
  const [userAction, setUserAction] = useState<UserAction>(null)
  const [rolesAction, setRolesAction] = useState<RolesAction>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', page],
    queryFn: () => userService.listUsers(page, PAGE_SIZE),
  })

  const { mutate: enableUser, isPending: isEnabling } = useMutation({
    mutationFn: (userId: string) => userService.enableUser(userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('Compte réactivé'); setUserAction(null) },
    onError: () => toast.error('Erreur lors de la réactivation'),
  })

  const { mutate: disableUser, isPending: isDisabling } = useMutation({
    mutationFn: (userId: string) => userService.disableUser(userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('Compte désactivé'); setUserAction(null) },
    onError: () => toast.error('Erreur lors de la désactivation'),
  })

  const { mutate: updateRoles, isPending: isUpdatingRoles } = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: UpdateUserRolesRequest }) =>
      userService.updateUserRoles(userId, request),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success('Rôles mis à jour'); setRolesAction(null) },
    onError: () => toast.error('Erreur lors de la mise à jour des rôles'),
  })

  const allUsers = usersData?.content || []
  const totalElements = usersData?.totalElements || 0
  const totalPages = usersData?.totalPages || 1

  const filtered = allUsers.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    const matchRole = !roleTab || u.roles.some((r) => r.replace('DINTHIALMA_', '') === roleTab)
    const matchStatus = !statusTab || u.accountStatus === statusTab
    return matchSearch && matchRole && matchStatus
  })

  const openRolesModal = (user: AdminUserResponse) => {
    const normalized = user.roles.map((r) => r.replace('DINTHIALMA_', ''))
    setSelectedRoles(normalized)
    setRolesAction({ userId: user.id, nom: `${user.firstName} ${user.lastName}`, currentRoles: normalized })
  }

  const handleConfirmAction = () => {
    if (!userAction) return
    if (userAction.type === 'enable') enableUser(userAction.userId)
    else disableUser(userAction.userId)
  }

  const handleSaveRoles = () => {
    if (!rolesAction) return
    updateRoles({ userId: rolesAction.userId, request: { roles: selectedRoles } })
  }

  const toggleRole = (role: string) => {
    if (role === 'USER') return
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const activeCount = allUsers.filter((u) => u.accountStatus !== 'PRE_ENROLLED').length
  const preEnrolledCount = allUsers.filter((u) => u.accountStatus === 'PRE_ENROLLED').length

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Utilisateurs</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {totalElements} comptes —{' '}
            <span className="text-primary-600 font-medium">{activeCount} inscrits</span>
            {preEnrolledCount > 0 && (
              <span className="text-orange-600 font-medium"> · {preEnrolledCount} en attente</span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-visible">
        {/* Filtres */}
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 space-y-3">
          {/* Barre de recherche */}
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, téléphone, email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
            />
          </div>

          {/* Onglets rôle + statut compte */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtre rôle */}
            <div className="flex items-center gap-1">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setRoleTab(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    roleTab === tab.value
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-neutral-200" />

            {/* Filtre statut compte */}
            <div className="flex items-center gap-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusTab(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    statusTab === tab.value
                      ? tab.value === 'PRE_ENROLLED'
                        ? 'bg-orange-500 text-white'
                        : 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                  {tab.value === 'PRE_ENROLLED' && preEnrolledCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${statusTab === 'PRE_ENROLLED' ? 'bg-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                      {preEnrolledCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto pb-16">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                {['Utilisateur', 'Téléphone', 'Rôles', 'Compte', 'Inscrit le', 'Statut', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10"><Spinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-neutral-400">Aucun utilisateur trouvé</td></tr>
              ) : (
                filtered.map((user) => {
                  const nom = `${user.firstName} ${user.lastName}`
                  const normalRoles = user.roles.map((r) => r.replace('DINTHIALMA_', ''))
                  const isPreEnrolled = user.accountStatus === 'PRE_ENROLLED'
                  return (
                    <tr key={user.id} className={`border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${isPreEnrolled ? 'opacity-80' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserInitials name={nom} />
                          <div>
                            <p className="font-semibold text-neutral-900">{nom}</p>
                            <p className="text-xs text-neutral-500">{user.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-700 font-mono text-xs">{user.phone}</td>
                      <td className="px-5 py-4">
                        {isPreEnrolled ? (
                          <span className="text-neutral-300 text-xs">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {normalRoles.filter((r) => r !== 'USER').map((r) => (
                              <span key={r} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full uppercase">
                                {r === 'SUPER_ADMIN' ? 'SUPER ADMIN' : r}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isPreEnrolled ? (
                          <span
                            title="Ce compte a été créé par un gestionnaire de tontine mais n'est pas encore activé"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 cursor-help"
                          >
                            <Clock size={10} /> En attente
                          </span>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-neutral-500 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {isPreEnrolled ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">
                            Non activé
                          </span>
                        ) : (
                          <Badge variant={user.active ? 'success' : 'error'}>
                            {user.active ? '● Actif' : '● Désactivé'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <ActionsMenu
                          user={user}
                          onEdit={() => openRolesModal(user)}
                          onToggle={() => setUserAction({
                            type: user.active ? 'disable' : 'enable',
                            userId: user.id,
                            nom,
                          })}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-neutral-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal rôles */}
      <Modal
        isOpen={!!rolesAction}
        onClose={() => setRolesAction(null)}
        title={`Rôles de ${rolesAction?.nom}`}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setRolesAction(null)} disabled={isUpdatingRoles}>Annuler</Button>
            <Button onClick={handleSaveRoles} loading={isUpdatingRoles}>Enregistrer</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">Le rôle USER est toujours conservé.</p>
          {ALL_ROLES.map((role) => (
            <label key={role} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              selectedRoles.includes(role) ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
            } ${role === 'USER' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
                disabled={role === 'USER'}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="font-medium text-sm">{role}</span>
            </label>
          ))}
        </div>
      </Modal>

      {/* Confirmation */}
      {userAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setUserAction(null)}
          onConfirm={handleConfirmAction}
          title={userAction.type === 'disable' ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
          message={userAction.type === 'disable'
            ? `${userAction.nom} ne pourra plus se connecter à la plateforme.`
            : `${userAction.nom} pourra à nouveau se connecter.`}
          confirmText={userAction.type === 'disable' ? 'Désactiver' : 'Réactiver'}
          isDangerous={userAction.type === 'disable'}
          isLoading={isEnabling || isDisabling}
        />
      )}
    </AppLayout>
  )
}
