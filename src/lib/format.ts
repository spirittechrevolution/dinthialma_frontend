/** 125000 → « 125 000 » */
export function formatMontant(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('fr-FR')
}

/** 125000 → « 125 000 FCFA » */
export function formatFCFA(value: number | null | undefined): string {
  return `${formatMontant(value)} FCFA`
}

/** ISO → « 12 nov. » (ou « 12 nov. 2025 » si autre année) */
export function formatDateCourte(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
}

/** ISO → « 12 nov. · 14:30 » */
export function formatDateHeure(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${formatDateCourte(iso)} · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

/** Lecture/écriture localStorage protégées (navigation privée, stockage bloqué). */
export function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}
