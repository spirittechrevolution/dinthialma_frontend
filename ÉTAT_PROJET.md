# DINTHIALMA — État du projet frontend

> Dernière mise à jour : juin 2026

---

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 18 + TypeScript 5 |
| Routing | React Router DOM 6 |
| State serveur | TanStack React Query 5 |
| Formulaires | React Hook Form 7 + Zod |
| Styles | Tailwind CSS 3 (dark mode inclus) |
| HTTP | Axios (intercepteur auto-refresh token) |
| Charts | Recharts |
| Icônes | Lucide React |
| Toasts | Sonner |
| Build | Vite 5 |
| PWA | vite-plugin-pwa |

**Backend** : Spring Boot, API REST versionnée `/v1/*`  
**Auth** : Keycloak — JWT Bearer + refresh token + PIN local

---

## Rôles et accès

| Rôle | Description |
|---|---|
| `SUPER_ADMIN` | Administration globale de la plateforme |
| `ADMIN` | Gestionnaire de ses propres tontines |
| `MEMBER` | Membre participant à une ou plusieurs tontines |
| `USER` | Inscrit mais pas encore membre d'une tontine |

---

## Pages et fonctionnalités

### Authentification (`/login`, `/register`, `/pin`, `/forgot-password`)

- Inscription en 3 étapes avec OTP SMS
- Connexion par mot de passe ou PIN rapide
- Réinitialisation du mot de passe (OTP SMS)
- Configuration et réinitialisation du PIN
- Onboarding PWA (première ouverture mobile)
- Redirection intelligente au démarrage (token valide → dashboard, phone connu + PIN → écran PIN, sinon → login)

---

### Super Admin

#### Tableau de bord (`/dashboard`)
- Stats globales en temps réel : utilisateurs, tontines actives, cotisations du mois, variation vs mois précédent
- Activité des dernières 24h

#### Gestion des utilisateurs (`/superadmin/users`)
- Liste paginée de tous les utilisateurs
- Recherche par nom/téléphone
- Activer / désactiver un compte
- Modifier les rôles (MEMBER, ADMIN, SUPER_ADMIN)
- Voir le détail d'un utilisateur

#### Toutes les tontines (`/superadmin/tontines`)
- Liste de toutes les tontines de la plateforme
- Accès en lecture seule au détail de chaque tontine

#### Référentiels (`/superadmin/code-list`)
- Gestion des référentiels métier (fréquences, méthodes de paiement, etc.)
- Création, modification, suppression des entrées

---

### Admin / Gestionnaire

#### Tableau de bord (`/admin/dashboard`)
- Stats par tontine gérée (cotisations en attente, en retard, montant total validé)
- Aperçu du cycle en cours par tontine

#### Mes tontines (`/admin/tontines`)
- Liste des tontines créées
- Création d'une tontine (modale) :
  - **ROTATIVE** : montant fixe, fréquence, nombre de membres, ordre bénéficiaire, mode cycle (automatique/manuel)
  - **ÉVÉNEMENTIELLE** : date d'échéance, événement, montant libre ou fixe, montant minimum
- Accès rapide au détail

#### Détail d'une tontine — vue Admin (`/admin/tontines/:id`)

Onglets :

**Infos générales**
- Informations complètes de la tontine
- Activer / suspendre la tontine

**Membres**
- Liste des membres (ACTIF, SUSPENDU, SORTI)
- Ajouter un membre (recherche par téléphone, pré-inscription si sans compte)
- Suspendre / réactiver / retirer un membre

**Cycles**
- Liste de tous les cycles avec statuts (Ouvert, En Cours, Versé)
- Ouvrir un nouveau cycle (mode MANUEL)
- Clôturer le cycle en cours → calcul jackpot + commissions
- Désigner les bénéficiaires (aléatoire ou manuel, multi-gagnants)
- Récapitulatif cotisations par cycle (modal)
- Bouton "Cotisations" sur chaque cycle (EN_COURS ou Versé) → navigation directe vers l'onglet cotisations filtré

**Cotisations**
- Affichage par défaut : cycle EN_COURS
- Navigation depuis un cycle → filtre cycle pré-appliqué
- **Sélecteur membre** : filtrage server-side par membre → fiche résumé (nb validées / en attente / en retard + total versé)
- Section "Membres sans cotisation" uniquement sur le cycle EN_COURS
- Valider / refuser des cotisations
- Enregistrer un paiement admin (directement VALIDÉ)
- Modifier une cotisation (montant, méthode, référence)
- Support desktop (table) + mobile (cards)

**Commissions**
- Configurer des commissions par tontine (% du jackpot, frais fixes par cycle, frais d'adhésion)
- Ajouter / supprimer des commissions

#### Membres — vue globale (`/admin/membres`)
- Liste de tous les membres toutes tontines confondues
- Filtres par tontine
- Recherche par nom

#### Cycles — vue globale (`/admin/cycles`)
- Tous les cycles de toutes les tontines gérées
- Filtre par tontine
- Ouvrir un cycle, clôturer
- Bouton "Voir les cotisations" sur les cycles EN_COURS et Versés (navigation vers page cotisations filtrée)

#### Cotisations — vue globale (`/admin/cotisations`)
- Toutes les cotisations de toutes les tontines
- Filtre tontine + filtre statut + recherche membre/référence
- Indicateur cycle actif (EN_COURS par défaut, overridable depuis la page Cycles)
- **Sélecteur membre** : fiche résumé par membre avec total versé
- Valider / modifier des cotisations

---

### Membre

#### Tableau de bord membre (`/member/dashboard`)
- Mes cotisations récentes (filtrées sur mon téléphone)
- Statut de mes paiements

#### Mes tontines (`/member/tontines`)
- Liste des tontines auxquelles je participe

#### Détail d'une tontine — vue Membre (`/member/tontines/:id`)

Onglets :

**Infos générales** — informations de la tontine

**Membres** — liste des membres (lecture seule)

**Cycles**
- Liste des cycles avec statuts
- Bouton "Voir les cotisations" sur les cycles EN_COURS / Versés → switch vers l'onglet cotisations filtré sur ce cycle

**Cotisations**
- Affichage par défaut : cycle EN_COURS
- Membre voit uniquement ses propres cotisations (filtre téléphone côté client)
- Indicateur cycle + lien "Voir tout"
- Valider les paiements en attente (si gestionnaire de la tontine)

**Historique jackpots** — liste des bénéficiaires passés avec montants

#### Mes cotisations (`/member/cotisations`)
- Timeline de toutes mes cotisations (validées, en attente, en retard)
- Stats : total versé, cotisations en attente, jackpots reçus
- Déclarer un paiement (formulaire avec méthode de paiement visuelle)
- Pagination

---

## Fonctionnalités transversales

### Notifications
- Centre de notifications temps réel (polling 60s)
- Badge compteur non-lus
- Marquer comme lu / tout marquer comme lu
- Types : paiement reçu, validation, jackpot, retard, rappel, invitation, etc.

### Profil utilisateur (`/profile`)
- Modifier prénom / nom
- Changer de numéro de téléphone (validation OTP en 2 étapes)
- Voir ses rôles actifs

### Thème sombre/clair
- Toggle depuis la barre de navigation
- Persisté en localStorage

### PWA
- Installable sur Android (prompt natif)
- Instructions iOS (banner manuel)
- Fonctionne en mode standalone
- Onboarding première ouverture

### Stabilité déploiement
- `ChunkErrorBoundary` + `unhandledrejection` listener : rechargement automatique en cas de chunk périmé après un déploiement (évite les "Failed to fetch dynamically imported module")

---

## Architecture des données

### Types de tontines

```
ROTATIVE                          ÉVÉNEMENTIELLE
├── Montant fixe par cycle         ├── Montant libre ou fixe
├── Fréquence (journalière → trimest.)  ├── Montant minimum si libre
├── Ordre bénéficiaire            ├── Nom de l'événement
├── Nombre de membres             ├── Date d'échéance
├── Nombre de gagnants par cycle  └── Distribution finale tous membres
└── Mode cycle : AUTO / MANUEL
```

### Workflow cycle

```
EN_ATTENTE (Ouvert) → EN_COURS → TERMINE (Versé)
                         │
                         └── Clôture → Jackpot calculé
                                     → Commissions déduites
                                     → Cotisations EN_ATTENTE → EN_RETARD
                                     → Bénéficiaire(s) désigné(s)
```

### Workflow cotisation

```
Membre déclare → EN_ATTENTE → Admin valide → VALIDÉ
                           └── Cycle clôturé → EN_RETARD
Admin enregistre directement → VALIDÉ
```

---

## Endpoints API consommés

| Domaine | Base URL |
|---|---|
| Auth | `/v1/auth/*` |
| Profil | `/v1/profile` |
| Utilisateurs (SA) | `/v1/admin/dashboard/users/*` |
| Tontines | `/v1/tontines/*` |
| Membres | `/v1/tontines/:id/membres/*` |
| Cycles | `/v1/tontines/:id/cycles/*` |
| Cotisations | `/v1/tontines/:id/cotisations/*` (params : `cycleId`, `membreId`, `page`, `size`) |
| Dashboard SA | `/v1/admin/dashboard` |
| Dashboard Admin | `/v1/admin/my-dashboard` |
| Notifications | `/v1/notifications/*` |
| Référentiels | `/v1/code-list/*` |

---

## Design system

- **Composants UI** : Button, Input, Select, Modal, Badge, Table, Card, Spinner, Avatar, PhoneInput, EmptyState, Stat
- **Composants partagés** : AddMembreModal, AdminEditCotisationModal, AdminEnregistrerPaiementModal, ConfirmDialog, CreateTontineModal, CycleRecapModal, ChunkErrorBoundary, PWABanner, JackpotCelebration
- **Palette primaire** : vert (`primary-*`)
- **Responsive** : mobile-first, tables desktop → cards mobile
- **Toasts** : Sonner (top-right, richColors)
