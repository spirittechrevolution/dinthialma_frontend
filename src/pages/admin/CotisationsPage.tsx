import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCotisations, useValiderCotisation } from '@/hooks/useCotisations'
import { useCycles } from '@/hooks/useCycles'
import { Cotisation } from '@/types/cotisation'
import { CotisationStatut } from '@/types/common'
import { CheckCircle } from 'lucide-react'

const statutVariants: Record<CotisationStatut, 'success' | 'warning' | 'error'> = {
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  EN_RETARD: 'error',
}

export function CotisationsPage() {
  const { tontineId } = useParams<{ tontineId: string }>()
  const [page, setPage] = useState(0)
  const [cycleFilter, setCycleFilter] = useState('')
  const [cotisationToValidate, setCotisationToValidate] = useState<string | null>(null)

  const { data: cotisationsData, isLoading } = useCotisations(
    tontineId || '',
    cycleFilter || undefined,
    page,
    20
  )
  const { data: cyclesData } = useCycles(tontineId || '', 0, 50)
  const { mutate: valider, isPending: isValidating } = useValiderCotisation()

  const cotisations = cotisationsData?.content || []
  const totalPages = cotisationsData?.totalPages || 1
  const cycles = cyclesData?.content || []

  const handleValider = () => {
    if (!cotisationToValidate || !tontineId) return
    valider(
      { tontineId, cotisationId: cotisationToValidate },
      {
        onSuccess: () => { toast.success('Cotisation validée'); setCotisationToValidate(null) },
        onError: () => toast.error('Erreur lors de la validation'),
      }
    )
  }

  const columns: Column<Cotisation>[] = [
    {
      key: 'membre',
      header: 'Membre',
      render: (row) => <span className="font-semibold">{row.membre.firstName} {row.membre.lastName}</span>,
    },
    { key: 'membre', header: 'Téléphone', render: (row) => row.membre.phone },
    {
      key: 'montant',
      header: 'Montant',
      render: (row) => <span className="text-primary-600 font-semibold">{row.montant.toLocaleString()} FCFA</span>,
    },
    { key: 'methodePaiement', header: 'Méthode', render: (row) => row.methodePaiement || '—' },
    { key: 'referenceTransaction', header: 'Référence', render: (row) => row.referenceTransaction || '—' },
    {
      key: 'statut',
      header: 'Statut',
      render: (row) => <Badge variant={statutVariants[row.statut]}>{row.statut}</Badge>,
    },
    {
      key: 'validePar',
      header: 'Validé par',
      render: (row) => row.validePar ? `${row.validePar.firstName} ${row.validePar.lastName}` : '—',
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => row.statut === CotisationStatut.EN_ATTENTE ? (
        <Button variant="secondary" size="sm" title="Valider" onClick={() => setCotisationToValidate(row.id)}>
          <CheckCircle size={16} />
        </Button>
      ) : null,
    },
  ]

  return (
    <AppLayout>
      <PageHeader title="Cotisations" description="Validez les paiements déclarés par les membres" />

      <Card noPadding>
        <div className="p-6 border-b border-neutral-200">
          <Select
            label="Filtrer par cycle"
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous les cycles' },
              ...cycles.map((c) => ({ value: c.id, label: `Cycle ${c.numeroCycle}` })),
            ]}
          />
        </div>
        <CardBody>
          <Table
            columns={columns}
            data={cotisations}
            isLoading={isLoading}
            emptyMessage="Aucune cotisation trouvée"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={!!cotisationToValidate}
        onClose={() => setCotisationToValidate(null)}
        onConfirm={handleValider}
        title="Valider ce paiement ?"
        message="Cette cotisation sera marquée comme VALIDÉE et prise en compte dans le jackpot à la clôture du cycle."
        confirmText="Valider"
        isLoading={isValidating}
      />
    </AppLayout>
  )
}
