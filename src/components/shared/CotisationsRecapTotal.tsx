import { useState } from 'react'
import { useCotisationsRecapTotal } from '@/hooks/useCotisations'
import { Spinner } from '@/components/ui/Spinner'
import { MembreTotalCotisation } from '@/types/cotisation'
import { ArrowDown, ArrowUp, Users, Coins } from 'lucide-react'

interface Props {
  tontineId: string
}

export function CotisationsRecapTotal({ tontineId }: Props) {
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const { data = [], isLoading } = useCotisationsRecapTotal(tontineId)

  const sorted = [...data].sort((a, b) =>
    sortDir === 'desc' ? b.totalCotise - a.totalCotise : a.totalCotise - b.totalCotise
  )

  const grandTotal      = data.reduce((s, m) => s + m.totalCotise, 0)
  const totalPaiements  = data.reduce((s, m) => s + m.nombreCotisationsValidees, 0)
  const maxTotal        = data.length > 0 ? Math.max(...data.map((m) => m.totalCotise)) : 0

  if (isLoading) {
    return <div className="flex justify-center py-10"><Spinner /></div>
  }

  return (
    <div>
      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Coins size={13} className="text-primary-500" />
            <p className="text-xs text-primary-500 font-medium">Total collecté</p>
          </div>
          <p className="text-xl font-extrabold text-primary-700 leading-none">
            {grandTotal.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-primary-400 mt-0.5">FCFA</p>
        </div>
        <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={13} className="text-neutral-400" />
            <p className="text-xs text-neutral-400 font-medium">Paiements validés</p>
          </div>
          <p className="text-xl font-extrabold text-neutral-700 leading-none">{totalPaiements}</p>
          <p className="text-xs text-neutral-400 mt-0.5">au total</p>
        </div>
      </div>

      {/* ── Bouton tri ────────────────────────────────────────────────── */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          {sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
          Total {sortDir === 'desc' ? 'décroissant' : 'croissant'}
        </button>
      </div>

      {/* ── État vide ─────────────────────────────────────────────────── */}
      {data.length === 0 && (
        <p className="text-center py-10 text-neutral-400 text-sm">
          Aucun membre n'a encore de cotisation validée.
        </p>
      )}

      {/* ── Table desktop ─────────────────────────────────────────────── */}
      {sorted.length > 0 && (
        <>
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  {['#', 'Membre', 'Statut', 'Total cotisé', 'Paiements'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, idx) => (
                  <MembreRow key={m.membreId} m={m} rank={idx + 1} maxTotal={maxTotal} grandTotal={grandTotal} />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Cards mobile ──────────────────────────────────────────── */}
          <div className="sm:hidden space-y-2">
            {sorted.map((m, idx) => (
              <MembreCard key={m.membreId} m={m} rank={idx + 1} maxTotal={maxTotal} grandTotal={grandTotal} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Ligne desktop ────────────────────────────────────────────────────────────
function MembreRow({ m, rank, maxTotal, grandTotal }: {
  m: MembreTotalCotisation; rank: number; maxTotal: number; grandTotal: number
}) {
  const pct = grandTotal > 0 ? Math.round((m.totalCotise / grandTotal) * 100) : 0
  const barW = maxTotal > 0 ? (m.totalCotise / maxTotal) * 100 : 0

  return (
    <tr className="border-b border-neutral-50 hover:bg-neutral-50">
      <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{rank}</td>
      <td className="px-4 py-3">
        <p className="font-semibold text-neutral-900">{m.firstName} {m.lastName}</p>
        <p className="text-xs text-neutral-400">{m.phone}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            m.statutMembre === 'ACTIF' ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {m.statutMembre}
          </span>
          {m.accountStatus === 'PRE_ENROLLED' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
              Sans compte
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-bold text-neutral-900">{m.totalCotise.toLocaleString('fr-FR')} <span className="text-xs font-normal text-neutral-400">FCFA</span></p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary-400 rounded-full" style={{ width: `${barW}%` }} />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium w-7 text-right">{pct}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-neutral-700 text-center">
        {m.nombreCotisationsValidees}
      </td>
    </tr>
  )
}

// ─── Card mobile ──────────────────────────────────────────────────────────────
function MembreCard({ m, rank, maxTotal, grandTotal }: {
  m: MembreTotalCotisation; rank: number; maxTotal: number; grandTotal: number
}) {
  const pct = grandTotal > 0 ? Math.round((m.totalCotise / grandTotal) * 100) : 0
  const barW = maxTotal > 0 ? (m.totalCotise / maxTotal) * 100 : 0
  const initials = `${m.firstName[0] || ''}${m.lastName[0] || ''}`.toUpperCase()

  return (
    <div className="bg-white border border-neutral-100 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-neutral-200 text-neutral-500 text-[9px] font-bold flex items-center justify-center">
            {rank}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">{m.firstName} {m.lastName}</p>
          <p className="text-xs text-neutral-400">{m.phone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-extrabold text-primary-700">{m.totalCotise.toLocaleString('fr-FR')}</p>
          <p className="text-[10px] text-neutral-400">FCFA</p>
        </div>
      </div>

      {/* Barre progression + badges */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1.5 flex-1 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-400 rounded-full" style={{ width: `${barW}%` }} />
        </div>
        <span className="text-[10px] text-neutral-400 font-medium w-7 text-right">{pct}%</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            m.statutMembre === 'ACTIF' ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {m.statutMembre}
          </span>
          {m.accountStatus === 'PRE_ENROLLED' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
              Sans compte
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500">
          {m.nombreCotisationsValidees} paiement{m.nombreCotisationsValidees !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
