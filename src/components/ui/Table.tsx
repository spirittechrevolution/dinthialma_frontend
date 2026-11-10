import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Pagination } from './Pagination'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T, value: any) => ReactNode
  className?: string
  /** Masquer cette colonne dans la vue carte mobile */
  hideOnMobile?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  page?: number
  totalPages?: number
  totalElements?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  rowClassName?: string
  onRowClick?: (row: T) => void
}

/**
 * Tableau responsive :
 * - Desktop : tableau classique
 * - Mobile : chaque ligne devient une carte (libellé / valeur), plus lisible au pouce
 */
export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Aucune donnée',
  page = 0,
  totalPages = 1,
  totalElements,
  pageSize,
  onPageChange,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return <div className="flex justify-center items-center py-10 text-sm text-neutral-500">{emptyMessage}</div>
  }

  const cell = (row: T, column: Column<T>) => {
    const value = (row as any)[column.key]
    return column.render ? column.render(row, value) : value
  }

  const [first, ...rest] = columns

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/70">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={clsx('px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500', column.className)}
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
                  'border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors',
                  onRowClick && 'cursor-pointer',
                  rowClassName
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className={clsx('px-5 py-3.5 text-sm text-neutral-800', column.className)}>
                    {cell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile : cartes */}
      <ul className="md:hidden divide-y divide-neutral-100">
        {data.map((row, index) => (
          <li
            key={row.id || index}
            className={clsx('px-4 py-3.5', onRowClick && 'active:bg-neutral-50 cursor-pointer', rowClassName)}
            onClick={() => onRowClick?.(row)}
          >
            {first && <div className="text-sm font-semibold text-neutral-900 mb-1.5">{cell(row, first)}</div>}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {rest
                .filter((c) => !c.hideOnMobile && c.header)
                .map((column) => (
                  <div key={String(column.key)} className="min-w-0">
                    <dt className="text-[11px] text-neutral-400">{column.header}</dt>
                    <dd className="text-sm text-neutral-800 truncate">{cell(row, column)}</dd>
                  </div>
                ))}
            </dl>
            {/* Colonnes sans titre (ex : actions) en bas de carte */}
            {rest.filter((c) => !c.hideOnMobile && !c.header).map((column) => (
              <div key={String(column.key)} className="mt-2" onClick={(e) => e.stopPropagation()}>
                {cell(row, column)}
              </div>
            ))}
          </li>
        ))}
      </ul>

      {onPageChange && totalPages > 1 && (
        <div className="border-t border-neutral-100">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
