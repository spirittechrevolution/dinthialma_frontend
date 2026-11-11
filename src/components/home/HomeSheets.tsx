import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Check, ChevronRight, Search, Trophy } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { InitialsAvatar } from '@/components/ui/Section'
import { formatF, formatDateCourte } from '@/lib/format'
import type { CotisantSummary, GestionSummary, ModeAccueil } from '@/types/me'

// ─── « Pour quelle tontine ? » ───────────────────────────────────────────────

export interface TontineOption {
  id: string
  nom: string
  detail?: string
}

interface TontinePickerSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  options: TontineOption[]
  /** Affiche l'option « Toutes mes tontines » (filtre de l'accueil) */
  allowAll?: boolean
  selectedId?: string | null
  onSelect: (id: string | null) => void
}

/** Feuille « Pour quelle tontine ? » (gabarit Choisir) : recherche + liste. */
export function TontinePickerSheet({ isOpen, onClose, title = 'Pour quelle tontine ?', options, allowAll, selectedId, onSelect }: TontinePickerSheetProps) {
  const [q, setQ] = useState('')
  const filtered = options.filter((o) => !q || o.nom.toLowerCase().includes(q.toLowerCase()))
  const choose = (id: string | null) => { onSelect(id); setQ(''); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={() => { setQ(''); onClose() }} title={title} size="sm">
      {options.length > 6 && (
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chercher une tontine"
            className="w-full h-12 pl-10 pr-4 rounded-2xl bg-neutral-100 text-[16px] outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
      )}
      <ul className="-mx-2">
        {allowAll && !q && (
          <li>
            <button onClick={() => choose(null)} className="w-full flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-neutral-50 text-left">
              <span className="w-10 h-10 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center font-bold">∑</span>
              <span className="flex-1 font-semibold text-neutral-900">Toutes mes tontines</span>
              {!selectedId && <Check size={20} className="text-primary-700" />}
            </button>
          </li>
        )}
        {filtered.map((o) => (
          <li key={o.id}>
            <button onClick={() => choose(o.id)} className="w-full flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-neutral-50 text-left">
              <InitialsAvatar name={o.nom} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-neutral-900 truncate">{o.nom}</span>
                {o.detail && <span className="block text-sm text-neutral-500 truncate">{o.detail}</span>}
              </span>
              {selectedId === o.id && <Check size={20} className="text-primary-700" />}
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="px-2 py-6 text-center text-sm text-neutral-500">Aucune tontine</li>}
      </ul>
    </Modal>
  )
}

// ─── « Mes montants par tontine » / « Collecte par tontine » ─────────────────

interface MontantsSheetProps {
  isOpen: boolean
  onClose: () => void
  mode: ModeAccueil
  cotisant?: CotisantSummary
  gestion?: GestionSummary
  hidden: boolean
}

export function MontantsSheet({ isOpen, onClose, mode, cotisant, gestion, hidden }: MontantsSheetProps) {
  const montant = (v: number | null | undefined) => (hidden ? '••••' : formatF(v))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'COTISE' ? 'Mes montants par tontine' : 'Collecte par tontine'} size="sm">
      {mode === 'COTISE' ? (
        <>
          <ul className="-mx-2">
            {(cotisant?.tontines ?? []).map((t) => {
              const pct = t.toursTotal > 0 ? Math.round((t.toursPayes / t.toursTotal) * 100) : 0
              return (
                <li key={t.tontineId}>
                  <Link to={`/member/tontines/${t.tontineId}`} onClick={onClose} className="flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-neutral-50">
                    <InitialsAvatar name={t.nom} />
                    <span className="min-w-0 flex-1">
                      <span className="flex justify-between gap-2">
                        <span className="font-semibold text-neutral-900 truncate">{t.nom}</span>
                        <span className="font-bold tabular-nums">{montant(t.totalCotiseValide)}</span>
                      </span>
                      <span className="block text-sm text-neutral-500">{t.toursPayes}/{t.toursTotal} tours payés</span>
                      <span className="mt-1.5 block h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <span className="block h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-neutral-300" />
                  </Link>
                </li>
              )
            })}
          </ul>
          <Link to="/jackpots" onClick={onClose} className="mt-3 flex items-center gap-3 rounded-2xl bg-yellow-50 px-3 py-3">
            <Trophy size={20} className="text-yellow-700" />
            <span className="flex-1 font-semibold text-neutral-900">Jackpots reçus</span>
            <span className="font-bold text-primary-700 tabular-nums">{hidden ? '••••' : `+${formatF(cotisant?.totalJackpotsRecus)}`}</span>
            <ChevronRight size={18} className="text-neutral-400" />
          </Link>
        </>
      ) : (
        <ul className="-mx-2">
          {(gestion?.tontines ?? []).map((t) => {
            const c = t.cycleEnCours
            const pct = c && c.montantAttendu ? Math.min(100, Math.round((c.montantCollecte / c.montantAttendu) * 100)) : 0
            return (
              <li key={t.tontineId}>
                <Link to={`/admin/tontines/${t.tontineId}`} onClick={onClose} className="flex items-center gap-3 px-2 py-3 rounded-2xl hover:bg-neutral-50">
                  <InitialsAvatar name={t.nom} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="font-semibold text-neutral-900 truncate">{t.nom}</span>
                      <span className="font-bold tabular-nums">{c ? montant(c.montantCollecte) : '—'}</span>
                    </span>
                    <span className="block text-sm text-neutral-500">
                      {c
                        ? `Tour ${c.numeroCycle} · ${c.membresAyantPaye}/${c.membresActifs} ont payé${c.montantAttendu ? ` · sur ${montant(c.montantAttendu)}` : ''}`
                        : 'Aucun tour en cours'}
                    </span>
                    {t.cotisationsEnAttente > 0 && (
                      <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        {t.cotisationsEnAttente} à valider
                      </span>
                    )}
                    {c && c.montantAttendu ? (
                      <span className="mt-1.5 block h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <span className="block h-full bg-primary-600 rounded-full" style={{ width: `${pct}%` }} />
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight size={18} className="text-neutral-300" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}

// ─── « Plus de services » ────────────────────────────────────────────────────

export interface PlusItem {
  key: string
  label: string
  icon: JSX.Element
  to?: string
  onClick?: () => void
}

export function PlusSheet({ isOpen, onClose, items }: { isOpen: boolean; onClose: () => void; items: PlusItem[] }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plus de services" size="sm">
      <div className="grid grid-cols-4 gap-y-4 py-1">
        {items.map((it) => {
          const content = (
            <>
              <span className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center">{it.icon}</span>
              <span className="text-[13px] font-medium text-neutral-800 text-center leading-tight">{it.label}</span>
            </>
          )
          const cls = clsx('flex flex-col items-center gap-1.5 min-w-0 rounded-2xl')
          return it.to ? (
            <Link key={it.key} to={it.to} onClick={onClose} className={cls}>{content}</Link>
          ) : (
            <button key={it.key} type="button" onClick={() => { onClose(); it.onClick?.() }} className={cls}>{content}</button>
          )
        })}
      </div>
    </Modal>
  )
}

export function dueDetail(dateLimite: string | null | undefined): string {
  return dateLimite ? `avant le ${formatDateCourte(dateLimite)}` : ''
}
