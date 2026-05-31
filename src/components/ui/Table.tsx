import { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T, value: any) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  rowClassName?: string
  onRowClick?: (row: T) => void
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Aucune donnée',
  page = 0,
  totalPages = 1,
  onPageChange,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-8 text-neutral-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={clsx(
                  'px-6 py-3 text-left text-sm font-semibold text-neutral-700',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              className={clsx(
                'border-b border-neutral-200 hover:bg-neutral-50 transition-colors',
                onRowClick && 'cursor-pointer',
                rowClassName
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const value = (row as any)[column.key]
                return (
                  <td
                    key={String(column.key)}
                    className={clsx('px-6 py-4 text-sm text-neutral-700', column.className)}
                  >
                    {column.render ? column.render(row, value) : value}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
          <div className="text-sm text-neutral-600">
            Page {page + 1} sur {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Précédent
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
