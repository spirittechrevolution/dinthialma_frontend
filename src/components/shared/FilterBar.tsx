import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FilterField {
  key: string
  label: string
  type: 'text' | 'select'
  value: string
  onChange: (value: string) => void
  options?: Array<{ value: string; label: string }>
}

interface FilterBarProps {
  filters: FilterField[]
  onClear: () => void
  children?: ReactNode
}

export function FilterBar({ filters, onClear, children }: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value)

  return (
    <div className="flex gap-3 flex-wrap items-end">
      {filters.map((filter) => (
        <div key={filter.key} className="flex-1 min-w-[200px]">
          {filter.type === 'text' ? (
            <Input
              label={filter.label}
              placeholder={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
            />
          ) : (
            <Select
              label={filter.label}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options || []}
              placeholder={`Choisir ${filter.label}`}
            />
          )}
        </div>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X size={16} />
          Effacer
        </Button>
      )}

      {children}
    </div>
  )
}
