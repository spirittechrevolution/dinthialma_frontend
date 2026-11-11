import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface RefusSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Nom du membre (titre de la feuille) */
  membreNom: string
  montant: string
  enCours: boolean
  onConfirmer: (motif: string) => void
}

const MOTIFS = ['Transfert non reçu', 'Montant incorrect', 'Mauvaise référence', 'Doublon']

/**
 * Refuser un paiement déclaré : motif obligatoire (≤ 500 caractères), envoyé au membre.
 * Un paiement refusé ne bloque pas le membre : il peut déclarer à nouveau sur le même tour.
 */
export function RefusSheet({ isOpen, onClose, membreNom, montant, enCours, onConfirmer }: RefusSheetProps) {
  const [motif, setMotif] = useState('')
  const valide = motif.trim().length > 0 && motif.length <= 500
  const fermer = () => { setMotif(''); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={fermer} title={`Refuser le paiement de ${membreNom} ?`} size="sm">
      <p className="text-sm text-neutral-600">{montant} · le membre verra le motif et pourra déclarer à nouveau.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MOTIFS.map((m) => (
          <button key={m} type="button" onClick={() => setMotif(m)}
            className={motif === m ? 'h-9 px-3 rounded-full bg-neutral-900 text-white text-sm font-medium' : 'h-9 px-3 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium'}>
            {m}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-semibold text-neutral-700">Motif</span>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="Expliquez pourquoi en quelques mots"
          className="mt-1 w-full px-4 py-3 rounded-2xl bg-neutral-100 text-[16px] resize-none outline-none focus:ring-2 focus:ring-primary-600"
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={fermer} className="h-12 rounded-full bg-neutral-100 font-semibold">Annuler</button>
        <button onClick={() => onConfirmer(motif.trim())} disabled={!valide || enCours} className="h-12 rounded-full bg-red-600 text-white font-bold disabled:opacity-50">
          {enCours ? 'Envoi…' : 'Refuser'}
        </button>
      </div>
    </Modal>
  )
}
