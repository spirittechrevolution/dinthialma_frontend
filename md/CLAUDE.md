# CLAUDE.md - Documentation Dinthialma Frontend

## Résumé du projet

**Dinthialma Frontend** est une application React/TypeScript complète pour la gestion des tontines africaines.

### Points clés

1. **Stack technique**
   - React 18 + TypeScript 5
   - Vite comme bundler
   - TanStack Query v5 pour le server state
   - React Router v6 avec lazy loading
   - Tailwind CSS pour le design system
   - **Axios** avec intercepteur JWT (token lu depuis localStorage, refresh automatique sur 401)
   - **localStorage** pour persister l'access token et le refresh token
   - Recharts pour les graphiques

2. **Architecture**
   - Composants UI réutilisables dans `src/components/ui/`
   - Services API centralisés avec intercepteur JWT
   - Hooks personnalisés pour chaque domaine métier
   - Router avec protection par rôle
   - Design system cohérent avec palette verte personnalisée

3. **Authentification**
   - Auth 100% pilotée par les APIs backend (POST /auth/login, POST /auth/logout, POST /auth/refresh)
   - 3 rôles : SUPER_ADMIN, ADMIN, MEMBER — stockés dans le payload JWT
   - Token JWT injecté automatiquement par l'intercepteur Axios request
   - Refresh automatique sur 401 avec file d'attente des requêtes en cours

4. **Entités principales**
   - Tontine : groupe de cotisation collective
   - TontineMembre : participant dans une tontine
   - CycleTontine : période de collecte
   - Cotisation : contribution mensuelle
   - User : profil utilisateur avec rôles

## Structure des fichiers

```
dinthialma_frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Composants primitifs
│   │   ├── layout/                # Layout principal (Sidebar, Topbar)
│   │   └── shared/                # Composants métier partagés
│   ├── pages/
│   │   ├── auth/                  # Page de connexion
│   │   ├── superadmin/            # Pages SUPER_ADMIN
│   │   ├── admin/                 # Pages ADMIN
│   │   └── member/                # Pages MEMBER
│   ├── services/                  # Appels API Axios
│   ├── hooks/                     # Hooks personnalisés
│   ├── types/                     # Types TypeScript
│   ├── router/                    # Configuration des routes
│   ├── lib/                       # tokenStorage, TanStack Query
│   ├── App.tsx                    # Component principal
│   └── main.tsx                   # Entry point
├── public/
├── tailwind.config.ts             # Palette verte
├── vite.config.ts
└── package.json
```

## Règles de développement

### 1. Composants réutilisables
- Tout composant UI dans `components/ui/` est **générique** et sans logique métier
- Props fortement typées avec TypeScript
- Pas de dépendances externes complexes

### 2. Pas de logique dans les pages
- Les pages délèguent aux hooks personnalisés
- Jamais d'appel Axios direct dans un composant
- Exemple : `useTontines()` gère cache, refetch, mutations

### 3. Gestion d'état
- **Server state** : TanStack Query (données API)
- **UI state** : useState/useContext localement
- Pas de Redux ou autre global store

### 4. Typage strict
- Pas de `any`
- Toutes les réponses API typées
- Interfaces miroir du domaine Java

### 5. Responsivité obligatoire
- Mobile-first
- Sidebar → Drawer sur < 768px
- Tableaux scrollables horizontalement

### 6. Loading / Error states
- Spinner pendant le chargement
- EmptyState si aucune donnée
- Badges de statut colorés

## Pages principales

### SUPER_ADMIN
- **Dashboard** : KPIs globaux, graphique statuts, 5 dernières tontines
- **Utilisateurs** : Tableau paginé, gestion des rôles
- **Toutes les Tontines** : Vue complète avec filtres

### ADMIN
- **Dashboard** : KPIs personnels, graphique cotisations par cycle
- **Mes Tontines** : Tableau filtrable par statut, bouton création
- **Détail Tontine** : Onglets (Infos, Membres, Cycles, Cotisations, Commissions)
- **Membres** : Actions (valider, suspendre, exclure)
- **Cycles** : Gestion des périodes
- **Cotisations** : Validation des paiements

### MEMBER
- **Dashboard** : Statut participation, prochain jackpot, cotisations en retard
- **Mes Tontines** : Grille affichant statut participation
- **Mes Cotisations** : Tableau historique, déclaration paiement

## Installation et démarrage

```bash
# Installation des dépendances
npm install

# Configuration
cp .env.example .env.local
# Modifier les variables Keycloak

# Développement
npm run dev

# Build
npm run build
```

## Variables d'environnement

```env
VITE_API_URL=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=dinthialma
VITE_KEYCLOAK_CLIENT_ID=dinthialma-frontend
```

## Couleurs du design system

```json
Primary (Vert): #22c55e (500), #16a34a (600)
Success: #22c55e
Warning: #f59e0b
Error: #ef4444
Info: #3b82f6
Neutral: 50-900
```

## Hooks disponibles

- `useAuth()` : Authentification et rôles
- `useTontines()` : Gestion des tontines
- `useMembres()` : Gestion des membres
- `useCycles()` : Gestion des cycles
- `useCotisations()` : Gestion des cotisations

## Routes protégées

- `/login` : Page de connexion (publique)
- `/dashboard` : Tableau de bord (authentifié)
- `/superadmin/*` : Routes SUPER_ADMIN uniquement
- `/admin/*` : Routes ADMIN uniquement
- `/member/*` : Routes MEMBER uniquement

Les utilisateurs non authentifiés sont redirigés vers Keycloak.
Les utilisateurs sans rôle requis voient une page 403.

## Prochaines étapes optionnelles

1. Ajouter des formulaires complets avec React Hook Form + Zod
2. Implémenter les modales d'édition
3. Ajouter les notifications (toast)
4. Tests unitaires avec Vitest
5. Animations avec Framer Motion
6. Internationalisation (i18n)
