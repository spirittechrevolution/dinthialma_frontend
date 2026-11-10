import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  /** Page courante (0-based, comme Spring Data) */
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Optionnel : affiche « 1–10 sur 42 » */
  totalElements?: number
  pageSize?: number
  className?: string
}

/** Construit la liste des pages visibles : 1 … 4 5 6 … 12 */
function buildPages(page: number, totalPages: number): (number | 'dots')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i)
  const pages: (number | 'dots')[] = [0]
  const start = Math.max(1, page - 1)
  const end = Math.min(totalPages - 2, page + 1)
  if (start > 1) pages.push('dots')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 2) pages.push('dots')
  pages.push(totalPages - 1)
  return pages
}

/**
 * Pagination simple et tactile.
 * - Mobile : « ‹  Page 2 / 5  › » (gros boutons faciles à toucher)
 * - Desktop : numéros de page avec ellipses
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalElements,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const isFirst = page <= 0
  const isLast = page >= totalPages - 1
  const go = (p: number) => {
    if (p < 0 || p > totalPages - 1 || p === page) return
    onPageChange(p)
  }

  const range =
    totalElements != null && pageSize
      ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalElements)} sur ${totalElements}`
      : null

  const navBtn =
    'h-10 w-10 inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none'

  return (
    <nav
      aria-label="Pagination"
      className={clsx('flex items-center justify-between gap-3 px-4 py-3', className)}
    >
      <p className="hidden sm:block text-xs text-neutral-500">
        {range ?? `Page ${page + 1} sur ${totalPages}`}
      </p>

      <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-end gap-2">
        <button type="button" className={navBtn} onClick={() => go(page - 1)} disabled={isFirst} aria-label="Page précédente">
          <ChevronLeft size={18} />
        </button>

        {/* Mobile : compteur compact */}
        <span className="sm:hidden text-sm font-semibold text-neutral-700">
          Page {page + 1} <span className="text-neutral-400 font-normal">/ {totalPages}</span>
        </span>

        {/* Desktop : numéros */}
        <div className="hidden sm:flex items-center gap-1">
          {buildPages(page, totalPages).map((p, i) =>
            p === 'dots' ? (
              <span key={`d${i}`} className="w-8 text-center text-neutral-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                aria-current={p === page ? 'page' : undefined}
                className={clsx(
                  'h-9 min-w-9 px-2 rounded-full text-sm font-semibold transition-colors',
                  p === page ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {p + 1}
              </button>
            )
          )}
        </div>

        <button type="button" className={navBtn} onClick={() => go(page + 1)} disabled={isLast} aria-label="Page suivante">
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  )
}
