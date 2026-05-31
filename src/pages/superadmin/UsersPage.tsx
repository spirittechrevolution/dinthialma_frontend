import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { userService } from '@/services/userService'
import { User, CreateUserRequest } from '@/types/user'
import { Plus } from 'lucide-react'

const schema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro invalide'),
  password: z.string().min(6, 'Au moins 6 caractères'),
})

type FormData = z.infer<typeof schema>

export function UsersPage() {
  const [page, setPage] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userService.getAllUsers(page, 20),
  })

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (request: CreateUserRequest) => userService.createUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur créé avec succès')
      reset()
      setIsOpen(false)
    },
    onError: () => toast.error('Erreur lors de la création de l\'utilisateur'),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const users = usersData?.content || []
  const totalPages = usersData?.totalPages || 1

  const onSubmit = (data: FormData) => {
    createUser(data)
  }

  const handleClose = () => {
    reset()
    setIsOpen(false)
  }

  const columns: Column<User>[] = [
    {
      key: 'firstName',
      header: 'Nom',
      render: (row) => (
        <span className="font-semibold">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Téléphone' },
    {
      key: 'isActive',
      header: 'Statut',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Gérer les utilisateurs et leurs rôles"
        action={
          <Button onClick={() => setIsOpen(true)}>
            <Plus size={20} />
            Nouvel Utilisateur
          </Button>
        }
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

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Créer un nouvel utilisateur"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>
              Annuler
            </Button>
            <Button form="create-user-form" type="submit" loading={isPending}>
              Créer
            </Button>
          </div>
        }
      >
        <form id="create-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              placeholder="Jean"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Nom"
              placeholder="Dupont"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="jean.dupont@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="+221 77 000 00 00"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </form>
      </Modal>
    </AppLayout>
  )
}
