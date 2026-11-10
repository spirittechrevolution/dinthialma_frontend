import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Après un déploiement, les chunks Vite ont de nouveaux hashes.
// Si un utilisateur a l'ancienne version ouverte, les imports dynamiques échouent (404).
// On détecte ça et on recharge la page pour récupérer la nouvelle version.
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message ?? ''
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
