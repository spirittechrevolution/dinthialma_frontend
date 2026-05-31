import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useTontineCycles, useStartNextCycle } from '@/hooks/useCycles'
import { CycleTontine } from '@/types/cycle'
import { CycleStatus } from '@/types/common'
import { Play } from 'lucide-react'

export function CyclesPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: cyclesData, isLoading } = useTontineCycles(tontineId || '', page, 20)
  const { mutate: startNextCycle, isPending } = useStartNextCycle()

  const cycles = cyclesData?.content || []
  const totalPages = cyclesData?.totalPages || 1

  const handleStartCycle = () => {
    startNextCycle(tontineId || '', {
      onSuccess: () => {
        toast.success('Nouveau cycle démarré avec succès')
        setIsConfirmOpen(false)
      },
      onError: () => toast.error('Erreur lors du démarrage du cycle'),
    })
  }

  const columns: Column<CycleTontine>[] = [
    {
      key: 'numeroCycle',
      header: 'Numéro',
      render: (row) => <span className="font-semibold">Cycle {row.numeroCycle}</span>,
    },
    {
      key: 'dateDebut',
      header: 'Début',
      render: (row) => new Date(row.dateDebut).toLocaleDateString('fr-FR'),
    },
    {
      key: 'dateFin',
      header: 'Fin',
      render: (row) => new Date(row.dateFin).toLocaleDateString('fr-FR'),
    },
    {
      key: 'montantCollecte',
      header: 'Collecté',
      render: (row) => (
        <span className="text-primary-600 font-semibold">
          {row.montantCollecte.toLocaleString()} FCFA
        </span>
      ),
    },
    { key: 'beneficiaireName', header: 'Bénéficiaire' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => {
        const variants: Record<CycleStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
          EN_COURS: 'info',
          TERMINE: 'success',
          ANNULE: 'error',
        }
        return <Badge variant={variants[row.statut]}>{row.statut}</Badge>
      },
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Cycles"
        action={
          <Button onClick={() => setIsConfirmOpen(true)}>
            <Play size={20} />
            Démarrer un cycle
          </Button>
        }
      />

      <Card noPadding>
        <CardBody>
          <Table
            columns={columns}
            data={cycles}
            isLoading={isLoading}
            emptyMessage="Aucun cycle créé"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleStartCycle}
        title="Démarrer le prochain cycle ?"
        message="Un nouveau cycle de collecte sera créé et activé pour cette tontine. Le cycle précédent sera clôturé s'il est encore en cours."
        confirmText="Démarrer"
        isLoading={isPending}
      />
    </AppLayout>
  )
}
