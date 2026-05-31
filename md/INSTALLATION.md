# Guide d'Installation - Dinthialma Frontend

## Prérequis

- **Node.js** 18+ avec npm
- **Keycloak** en cours d'exécution (http://localhost:8081)
- **Backend Dinthialma** en cours d'exécution (http://localhost:8080)

## Étapes d'installation

### 1. Cloner et installer les dépendances

```bash
cd dinthialma_frontend
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```env
# API Backend
VITE_API_URL=http://localhost:8080

# Keycloak
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=dinthialma
VITE_KEYCLOAK_CLIENT_ID=dinthialma-frontend
```

**Assurez-vous que :**
- Keycloak est accessible à `http://localhost:8081`
- Le backend API est accessible à `http://localhost:8080`
- Le client Keycloak `dinthialma-frontend` est configuré avec :
  - **Valid Redirect URIs** : `http://localhost:3000/*`
  - **Web Origins** : `http://localhost:3000`
  - **Access Type** : `public`

### 3. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

### 4. Utiliser l'application

1. Vous serez automatiquement redirigé vers Keycloak pour vous connecter
2. Connectez-vous avec un compte utilisateur avec l'un des rôles :
   - `SUPER_ADMIN` - Accès complet
   - `ADMIN` - Gestion de tontines
   - `MEMBER` - Participation aux tontines

## Commandes disponibles

```bash
# Développement avec hot reload
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build
npm run preview

# Linting
npm run lint
```

## Structure du projet

```
src/
├── components/        # Composants React
│   ├── ui/           # Composants primitifs (Button, Input, etc.)
│   ├── layout/       # Layout principal (Sidebar, Topbar, AppLayout)
│   └── shared/       # Composants métier partagés
├── pages/            # Pages de l'application
│   ├── auth/         # Pages d'authentification
│   ├── superadmin/   # Pages SUPER_ADMIN
│   ├── admin/        # Pages ADMIN
│   └── member/       # Pages MEMBER
├── services/         # Services API Axios
├── hooks/            # Hooks personnalisés
├── types/            # Types TypeScript
├── router/           # Configuration des routes
├── lib/              # Configuration (Keycloak, TanStack Query)
├── App.tsx           # Composant principal
└── main.tsx          # Point d'entrée
```

## Architecture de l'authentification

### Flux Keycloak

1. L'utilisateur accède à l'application
2. Il est redirigé vers le portail de connexion Keycloak
3. Après authentification, un JWT est obtenu
4. Le token est stocké dans sessionStorage par Keycloak.js
5. Le token est injecté automatiquement dans chaque requête API (intercepteur)
6. Si le token expire, il est rafraîchi automatiquement

### Rôles

- **SUPER_ADMIN** : Gestion complète du système
- **ADMIN** : Création et gestion de tontines
- **MEMBER** : Participation aux tontines

Les pages sont protégées par des guards de rôle (`RoleRoute`).

## Troubleshooting

### "Cannot find module '@/...'"

Assurez-vous que `tsconfig.json` configure correctement l'alias `@/*` :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### "Keycloak is not initialized"

Le serveur Keycloak doit être lancé avant l'application frontend.

### "CORS error"

Vérifiez que :
- Keycloak a les bonnes **Web Origins** configurées
- Le backend accepte les requêtes depuis `http://localhost:3000`

### "Token expired"

L'application rafraîchit automatiquement les tokens. Si cela ne fonctionne pas, reconnectez-vous.

## Déploiement

### Build pour la production

```bash
npm run build
```

Cela crée un répertoire `dist/` avec les fichiers optimisés.

### Serveur de production

Vous pouvez servir les fichiers statiques avec :
- Nginx
- Express.js
- Apache
- Vercel / Netlify / etc.

**Important** : Configurez les redirections 404 vers `index.html` pour que React Router fonctionne.

Exemple avec Nginx :

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Technologies

| Outil | Version |
|-------|---------|
| React | 18.2 |
| TypeScript | 5.2 |
| Vite | 5.0 |
| Tailwind CSS | 3.3 |
| TanStack Query | 5.28 |
| React Router | 6.20 |
| Keycloak.js | 23.0 |
| Recharts | 2.10 |

## Support

Pour toute question ou problème :
1. Consultez la documentation du backend
2. Vérifiez la configuration Keycloak
3. Consultez les logs du navigateur (F12)
