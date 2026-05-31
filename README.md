# Dinthialma Frontend

Application React pour la gestion des tontines africaines.

## Installation

```bash
npm install
```

## Configuration

1. Créez un fichier `.env.local` basé sur `.env.example`
2. Configurez les variables Keycloak

```env
VITE_API_URL=http://localhost:8080
```

## Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## Build

```bash
npm run build
```

## Structure du projet

- `src/components/` - Composants React réutilisables
  - `ui/` - Composants UI primitifs
  - `layout/` - Composants de layout
  - `shared/` - Composants partagés métier
- `src/pages/` - Pages de l'application
- `src/services/` - Services API
- `src/hooks/` - Hooks personnalisés
- `src/types/` - Types TypeScript
- `src/router/` - Configuration du routeur
- `src/lib/` - Configurations (Keycloak, TanStack Query)

## Authentification

L'authentification est gérée via Keycloak SSO. Les utilisateurs sont automatiquement redirigés vers le portail de connexion Keycloak.

## Rôles et Permissions

- **SUPER_ADMIN** : Accès complet à toutes les fonctionnalités
- **ADMIN** : Gestion de ses tontines et de ses membres
- **MEMBER** : Participation aux tontines

## Technologies

- React 18
- TypeScript
- Vite
- TanStack Query
- React Router v6
- Tailwind CSS
