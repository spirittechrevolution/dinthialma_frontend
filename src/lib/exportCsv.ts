/**
 * Exports CSV (B24) : l'API exige le JWT, on ne peut donc pas utiliser un simple lien.
 * On télécharge le fichier (Blob) avec l'en-tête Authorization, puis on déclenche
 * l'enregistrement avec le nom donné par `Content-Disposition`.
 * CSV séparé par « ; », UTF-8 avec BOM (ouverture directe dans Excel), 10 000 lignes max.
 */
import api from '@/services/api'

function nomFichier(disposition: string | undefined, repli: string): string {
  if (!disposition) return repli
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8) return decodeURIComponent(utf8[1])
  const simple = disposition.match(/filename="?([^";]+)"?/i)
  return simple ? simple[1] : repli
}

export async function telechargerCsv(url: string, params: Record<string, unknown>, repli: string): Promise<void> {
  const res = await api.get<Blob>(url, { params: { format: 'csv', ...params }, responseType: 'blob' })
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8' })
  const lien = document.createElement('a')
  lien.href = URL.createObjectURL(blob)
  lien.download = nomFichier(res.headers['content-disposition'] as string | undefined, repli)
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(lien.href), 10_000)
}
