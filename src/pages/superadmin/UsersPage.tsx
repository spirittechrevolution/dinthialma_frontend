import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { userService } from '@/services/userService'
import { AdminUserResponse, UpdateUserRolesRequest } from '@/types/user'
import { UserCheck, UserX, Edit2 } from 'lucide-react'

type UserAction = { type: 'enable' | 'disable'; userId: string; nom: string } | null
type RolesAction = { userId: string; nom: string; currentRoles: string[] } | null

const ALL_ROLES = ['USER', 'MEMBER', 'ADMIN', 'SUPER_ADMIN']

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [userAction, setUserAction] = useState<UserAction>(null)
  const [rolesAction, setRolesAction] = useState<RolesAction>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', page],
    queryFn: () => userService.listUsers(page, 20),
  })

  const { mutate: enableUser, isPending: isEnabling } = useMutation({
    mutationFn: (userId: string) => userService.enableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success('Compte réactivé')
      setUserAction(null)
    },
    onError: () => toast.error('Erreur lors de la réactivation'),
  })

  const { mutate: disableUser, isPending: isDisabling } = useMutation({
    mutationFn: (userId: string) => userService.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success('Compte désactivé')
      setUserAction(null)
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  })

  const { mutate: updateRoles, isPending: isUpdatingRoles } = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: UpdateUserRolesRequest }) =>
      userService.updateUserRoles(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success('Rôles mis à jour')
      setRolesAction(null)
    },
    onError: () => toast.error('Erreur lors de la mise à jour des rôles'),
  })

  const users = usersData?.content || []
  const totalPages = usersData?.totalPages || 1

  const openRolesModal = (user: AdminUserResponse) => {
    // Normalise les rôles (l'API renvoie "DINTHIALMA_ADMIN" → on extrait la partie après "_")
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
    if (role === 'USER') return // USER ne peut pas être retiré
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const columns: Column<AdminUserResponse>[] = [
    {
      key: 'firstName',
      header: 'Nom',
      render: (row) => <span className="font-semibold">{row.firstName} {row.lastName}</span>,
    },
    { key: 'phone', header: 'Téléphone' },
    { key: 'email', header: 'Email', render: (row) => row.email || '—' },
    {
      key: 'roles',
      header: 'Rôles',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles.map((r) => (
            <Badge key={r} variant="default" className="text-xs">
              {r.replace('DINTHIALMA_', '')}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Statut',
      render: (row) => (
        <Badge variant={row.active ? 'success' : 'error'}>
          {row.active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'pinConfigured',
      header: 'PIN',
      render: (row) => (
        <Badge variant={row.pinConfigured ? 'info' : 'default'}>
          {row.pinConfigured ? 'Configuré' : 'Non configuré'}
        </Badge>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" title="Modifier les rôles" onClick={() => openRolesModal(row)}>
            <Edit2 size={16} />
          </Button>
          {row.active ? (
            <Button
              variant="danger"
              size="sm"
              title="Désactiver"
              onClick={() => setUserAction({ type: 'disable', userId: row.id, nom: `${row.firstName} ${row.lastName}` })}
            >
              <UserX size={16} />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              title="Réactiver"
              onClick={() => setUserAction({ type: 'enable', userId: row.id, nom: `${row.firstName} ${row.lastName}` })}
            >
              <UserCheck size={16} />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Gérez les comptes et les rôles de tous les utilisateurs"
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="Aucun utilisateur trouvé"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      {/* Modal modification des rôles */}
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
          <p className="text-sm text-neutral-500">
            Sélectionnez les rôles. Le rôle USER est toujours conservé.
          </p>
          {ALL_ROLES.map((role) => (
            <label key={role} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedRoles.includes(role) ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
            } ${role === 'USER' ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
                disabled={role === 'USER'}
                className="w-4 h-4 accent-primary-500"
              />
              <span className="font-medium">{role}</span>
            </label>
          ))}
        </div>
      </Modal>

      {/* Confirmation activation/désactivation */}
      {userAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setUserAction(null)}
          onConfirm={handleConfirmAction}
          title={userAction.type === 'disable' ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
          message={
            userAction.type === 'disable'
              ? `${userAction.nom} ne pourra plus se connecter à la plateforme.`
              : `${userAction.nom} pourra à nouveau se connecter.`
          }
          confirmText={userAction.type === 'disable' ? 'Désactiver' : 'Réactiver'}
          isDangerous={userAction.type === 'disable'}
          isLoading={isEnabling || isDisabling}
        />
      )}
    </AppLayout>
  )
}
