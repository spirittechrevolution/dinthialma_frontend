# Dinthialma — Inventaire exhaustif des fonctionnalités (front)

> Analyse du code source du front (branche `merge/main-into-develop`, novembre 2026).
> Aucune ligne de code n'a été modifiée. Les points incertains sont marqués `[À CONFIRMER]`.

**Produit** : application web + PWA de gestion de tontines (Sénégal, FCFA, numéros +221).
**Stack** : React 18 + TypeScript, React Router 6, TanStack Query 5, React Hook Form + Zod, Tailwind, Axios, Sonner (toasts), Recharts, vite-plugin-pwa.
**Backend** : API REST Spring Boot `/api/v1/*`, authentification Keycloak (JWT + refresh token + PIN).

---

## 0. Rôles

| Rôle | Qui | Accès principal |
|---|---|---|
| `SUPER_ADMIN` | Opérateur de la plateforme | Tout (le garde de rôle laisse passer le SUPER_ADMIN partout) |
| `ADMIN` | Gestionnaire (créateur) de tontines | Ses tontines + espace « membre » pour ses participations |
| `MEMBER` | Participant à une ou plusieurs tontines | Ses tontines, ses cotisations |
| `USER` | Inscrit, pas encore dans une tontine | Accueil « démarrer » uniquement |

Notions dérivées calculées côté front dans le détail d'une tontine :
- **Créateur** = `tontine.creePar.phone === user.phone`.
- **Peut gérer** (`canManage`) = créateur **et** rôle ADMIN.
- **Voit tout** = peut gérer **ou** SUPER_ADMIN. Sinon le membre ne voit que ses propres cotisations (son `membreId` est retrouvé en comparant les numéros de téléphone, indicatif 221 retiré).

---

## 1. Routes et pages

Garde `ProtectedRoute` = jeton d'accès présent et non expiré (sinon → `/login`).
Garde `RoleRoute` = rôle requis (SUPER_ADMIN toujours accepté) ; sinon écran « Accès refusé » affichant les rôles techniques.

| Chemin | Composant | Protection | Paramètres / état |
|---|---|---|---|
| `/` | `StartRoute` (redirection) | Publique | — |
| `/onboarding` | `OnboardingPage` | Publique | — |
| `/login` | `LoginPage` | Publique | `state.registered`, `state.passwordReset` |
| `/register` | `RegisterPage` | Publique | `state.phone` (pré-rempli pour compte pré-inscrit) |
| `/forgot-password` | `ForgotPasswordPage` | Publique | — |
| `/pin` | `PinLoginPage` | Publique (exige un téléphone mémorisé) | — |
| `/pin/setup` | `PinSetupPage` | ProtectedRoute | — |
| `/pin/reset` | `PinResetPage` | Publique | — |
| `/dashboard` | `SuperAdminDashboard` | **ProtectedRoute seulement** (pas de contrôle de rôle) ⚠️ | — |
| `/superadmin/users` | `UsersPage` | SUPER_ADMIN | — |
| `/superadmin/tontines` | `AllTontinesPage` | SUPER_ADMIN | — |
| `/superadmin/tontines/:id` | `TontineDetailPage` (unifiée) | SUPER_ADMIN | `id` |
| `/superadmin/cotisations` | `AllContributionsPage` | SUPER_ADMIN | — |
| `/superadmin/code-list` | `CodeListPage` | SUPER_ADMIN | — |
| `/admin/dashboard` | `AdminDashboard` | ADMIN | — |
| `/admin/tontines` | `TontinesPage` | ADMIN | — |
| `/admin/tontines/:id` | `TontineDetailPage` (unifiée) | ADMIN, SUPER_ADMIN | `id` |
| `/admin/membres` | `MembresPage` | ADMIN | — |
| `/admin/cycles` | `CyclesPage` | ADMIN | — |
| `/admin/cotisations` | `CotisationsPage` | ADMIN | `state.tontineId`, `state.cycleId` |
| `/admin/tontines/:tontineId/membres` | `MembresPage` | ADMIN | `tontineId` **ignoré par la page** (legacy) |
| `/admin/tontines/:tontineId/cycles` | `CyclesPage` | ADMIN | idem (legacy) |
| `/admin/tontines/:tontineId/cotisations` | `CotisationsPage` | ADMIN | idem (legacy) |
| `/user/dashboard` | `UserDashboard` | ProtectedRoute | — |
| `/member/dashboard` | `MemberDashboard` | MEMBER, ADMIN | — |
| `/member/tontines` | `MesTontinesPage` | MEMBER, ADMIN | `state.welcomeActivated` |
| `/member/tontines/:id` | `TontineDetailPage` (unifiée) | MEMBER, ADMIN | `id` |
| `/member/cotisations` | `MesCotisationsPage` | MEMBER, ADMIN | `state.openPay` (ouvre la modale de paiement) |
| `/profile` | `ProfilePage` | ProtectedRoute | — |
| `/notifications` | `NotificationsPage` | ProtectedRoute | — |
| `*` | → `/login` | — | (même si l'utilisateur est connecté) |

**Total : 24 composants de page distincts**, 31 routes (dont 3 legacy, 1 redirection, 1 catch-all).
Pages non routées (code mort) : `src/pages/admin/TontineDetailPage.tsx` (909 lignes, remplacée par la page unifiée).

### Logique de démarrage (`/`)
1. PWA mobile installée + onboarding jamais vu → `/onboarding`
2. Jeton valide → `/dashboard` (⚠️ tableau de bord **Super Admin**, quel que soit le rôle — voir §4)
3. Téléphone mémorisé + PIN configuré (ou inconnu) → `/pin`
4. Sinon → `/login`

---

## 2. Fonctionnalités

Légende fréquence : **élevée** = plusieurs fois par cycle / quotidienne ; **moyenne** = une fois par cycle ou par semaine ; **rare** = ponctuelle.

### A. Entrée, authentification, sécurité

#### F01 — Onboarding de bienvenue
- **Description** : 3 diapositives de présentation au premier lancement de la PWA mobile.
- **Rôles** : tous (non connectés). **Entrée** : premier lancement en mode installé sur mobile.
- **Parcours** : Diapo 1 (logo) → Diapo 2 (« Gérez vos tontines ») → Diapo 3 (« Sécurisé et transparent ») → boutons « Se connecter » / « S'inscrire ». « Passer » sur diapos 1–2, swipe gauche/droite.
- **Données** : textes statiques. Mention « chiffrement AES-256 » `[À CONFIRMER]` côté backend.
- **API** : aucune. Stockage local `dinthialma_onboarding_done`.
- **États** : aucun état réseau.
- **Fréquence** : rare (une fois par appareil).

#### F02 — Démarrage intelligent
- **Description** : choisit automatiquement l'écran d'arrivée selon la session mémorisée.
- **Rôles** : tous. **Entrée** : ouverture de l'app / `/`.
- **Parcours** : redirection immédiate (voir §1).
- **API** : aucune (lecture locale des jetons/du téléphone/du drapeau PIN).
- **Fréquence** : élevée (chaque ouverture).

#### F03 — Inscription par SMS (3 étapes)
- **Description** : créer un compte avec son numéro, un code SMS, puis nom et mot de passe.
- **Rôles** : visiteur. **Entrée** : lien « S'inscrire » (connexion, onboarding).
- **Parcours** : Étape 1 Téléphone → Étape 2 Code SMS (modifier le numéro / renvoyer) → Étape 3 Prénom, Nom, Email (optionnel), Mot de passe, Confirmation → redirection `/login` (succès affiché) ou, si le compte était pré-inscrit par un gestionnaire, directement `/member/tontines` avec bandeau « Votre compte est activé ».
- **Saisies / validations** : téléphone E.164 `^\+[1-9]\d{7,14}$` (préfixe +221 par défaut) ; code 6 chiffres ; prénom/nom 2–100 car. ; email valide ou vide ; mot de passe ≥ 8 ; confirmation identique.
- **API** : `POST /v1/auth/register/send-otp`, `POST /v1/auth/register/verify-otp`, `POST /v1/auth/register/complete`.
- **États** : chargement bouton ; erreurs « Ce numéro est déjà utilisé » (409), « Code incorrect ou expiré », erreur générique ; succès → message sur la connexion. Pas d'état hors-ligne.
- **Fréquence** : rare.

#### F04 — Activation d'un compte pré-inscrit
- **Description** : un membre ajouté par son gestionnaire (sans compte) finalise son inscription.
- **Rôles** : visiteur pré-inscrit. **Entrée** : tentative de connexion → réponse 403 contenant « gestionnaire / pre_enrolled / pré-inscrit / pas encore inscrit ».
- **Parcours** : écran « Compte non activé » → « S'inscrire maintenant » → inscription (F03) avec numéro pré-rempli et bandeau d'info.
- **API** : `POST /v1/auth/login` (403) puis F03.
- **Remarque** : détection fragile par **texte du message d'erreur**.
- **Fréquence** : rare.

#### F05 — Connexion par mot de passe
- **Description** : se connecter avec téléphone + mot de passe.
- **Rôles** : tous. **Entrée** : `/login`.
- **Parcours** : Téléphone + Mot de passe (afficher/masquer) → si PIN non configuré : `/pin/setup` ; sinon accueil selon rôle (SA `/dashboard`, ADMIN `/admin/dashboard`, MEMBER `/member/dashboard`, USER `/user/dashboard`).
- **Saisies** : téléphone (pas de validation affichée), mot de passe requis.
- **API** : `POST /v1/auth/login` (`username`, `password`, `clientType` WEB/MOBILE, `deviceInfo`). Réponse : `access_token`, `refresh_token`, `pin_configured`.
- **États** : chargement bouton ; erreur unique « Identifiants incorrects » ; messages de succès après inscription / réinitialisation.
- **Fréquence** : moyenne (remplacée par le PIN au quotidien).

#### F06 — Déverrouillage par code PIN
- **Description** : reconnexion rapide avec un PIN à 6 chiffres sur un appareil connu.
- **Rôles** : tous. **Entrée** : démarrage automatique (`/pin`).
- **Parcours** : pavé numérique → soumission automatique au 6ᵉ chiffre → accueil selon rôle (USER → `/profile` ⚠️). Liens « PIN oublié ? », « Changer de compte ».
- **API** : `POST /v1/auth/login-pin` (`phone`, `pin`, `clientType`, `deviceInfo`).
- **États** : chargement ; secousse + vidage si erreur ; toasts : PIN incorrect, PIN expiré (→ réinitialisation), session expirée (→ connexion complète), compte introuvable (404), verrouillage (429), PIN trop simple.
- **Fréquence** : **élevée** (chaque retour dans l'app).

#### F07 — Création du PIN
- **Description** : choisir un PIN après la première connexion.
- **Rôles** : tous. **Entrée** : après connexion si `pin_configured=false`.
- **Parcours** : Créer (6 chiffres) → Confirmer → accueil. « Plus tard » possible (présent deux fois à l'écran).
- **API** : `POST /v1/auth/pin/setup` (`pin`, `confirmPin`).
- **États** : non-correspondance (secousse, retour étape 1), erreur, succès (toast).
- **Fréquence** : rare.

#### F08 — Réinitialisation du PIN (4 étapes)
- **Description** : recevoir un code SMS pour choisir un nouveau PIN.
- **Entrée** : « PIN oublié ? » (écran PIN) ou PIN expiré.
- **Parcours** : Téléphone (pré-rempli) → Code SMS (renvoyer) → Nouveau PIN → Confirmation → `/pin`.
- **API** : `POST /v1/auth/pin/reset/send-otp`, `POST /v1/auth/pin/reset/verify-otp`, `POST /v1/auth/pin/reset`.
- **États** : envoi silencieux (anti-énumération), code incorrect, non-correspondance, succès.
- **Fréquence** : rare.

#### F09 — Mot de passe oublié (3 étapes)
- **Parcours** : Téléphone → Code SMS → Nouveau mot de passe + confirmation → `/login` (message succès).
- **Validations** : code 6 chiffres, mot de passe ≥ 8, confirmation.
- **API** : `POST /v1/auth/forgot-password/send-otp`, `.../verify-otp`, `.../reset`.
- **Fréquence** : rare.

#### F10 — Changer de compte (déconnexion complète)
- **Description** : oublier l'appareil et revenir à la connexion par mot de passe.
- **Entrée** : écran PIN uniquement (« Changer de compte », présent deux fois).
- **API** : `POST /v1/auth/logout` (`refreshToken`, `clientType`) puis effacement local.
- **Fréquence** : rare.

#### F11 — Déconnexion « douce »
- **Description** : « Déconnexion » efface seulement le jeton d'accès ; le refresh token et le téléphone restent → retour à l'écran PIN.
- **Entrée** : menu avatar, barre latérale desktop, bas de la page Profil (3 emplacements).
- **API** : aucune.
- **Remarque** : sur appareil partagé, l'utilisateur croit être déconnecté alors que la session reste ouverte côté serveur.
- **Fréquence** : moyenne.

#### F12 — Renouvellement automatique de session
- **Description** : sur réponse 401, le front rafraîchit le jeton et rejoue les requêtes en file ; en cas d'échec → `/login`.
- **API** : `POST /v1/auth/refresh`.
- **Divers** : correction automatique des caractères accentués mal encodés (« mojibake ») dans toutes les réponses.
- **Fréquence** : élevée (invisible).

### B. Accueils (tableaux de bord)

#### F13 — Accueil « nouvel inscrit » (USER)
- **Description** : écran de démarrage pour un inscrit sans tontine.
- **Contenu** : salutation, carte « Prêt à démarrer ? » avec 3 statistiques à 0 (statiques), 2 boutons « Créer une tontine », « Rejoindre une tontine », bloc « Comment ça marche ? » (3 étapes).
- **API** : aucune (création via F18).
- **Fréquence** : rare (transitoire).

#### F14 — Rejoindre une tontine par code — **INACHEVÉE**
- **Parcours** : modale « Code d'invitation » (≥ 4 caractères, majuscules) → bouton « Rejoindre » affiche « Fonctionnalité bientôt disponible ».
- **API** : aucune. `[À CONFIRMER]` existence d'un endpoint d'adhésion par code côté backend (l'ajout se fait aujourd'hui uniquement par le gestionnaire, F25).
- **Fréquence** : —

#### F15 — Accueil membre
- **Description** : solde « Total cotisé » et prochaine cotisation de la **première tontine active** seulement.
- **Contenu** : carte solde (nom de la tontine, prochaine cotisation, date limite du cycle) + bouton « Payer ma cotisation » ; 4 actions rapides (Payer, Tontines, Historique, Créer) ; progression du cycle en cours (x/N cotisations validées, dates, jackpot estimé ou dernier jackpot) ; « Mes tontines » (3 premières) ; « Activité récente » (5 dernières cotisations).
- **API** : `GET /v1/tontines`, `GET /v1/tontines/{id}/membres` (pour un admin, afin de retrouver son `membreId`), `GET /v1/tontines/{id}/cotisations`, `GET /v1/tontines/{id}/cycles`.
- **États** : chargement plein écran ; vide (« Aucune tontine » + créer ; « Aucune cotisation ») ; pas d'erreur affichée ; pas d'hors-ligne.
- **Remarques** : calculs (total, progression) faits côté client sur les 50 dernières cotisations ; les montants des cotisations sont affichés en négatif « -5 000 F ».
- **Fréquence** : élevée.

#### F16 — Accueil gestionnaire (ADMIN)
- **Contenu** : carte « Montant validé » (toutes tontines) + bouton « Valider N paiements » ; 4 actions rapides (Créer, Paiements avec badge, Membres, Cycles) ; alerte « N cotisations en retard » ; « Mes tontines » (5) avec badge « N à valider » ; colonne desktop : lien « Mes participations » (espace membre) et **graphique « Volume collecté » avec données fictives codées en dur**.
- **API** : `GET /v1/admin/my-dashboard?page&size`.
- **États** : chargement ; vide (« Aucune tontine gérée » + créer) ; pas d'erreur affichée.
- **Fréquence** : élevée.

#### F17 — Accueil plateforme (SUPER_ADMIN)
- **Contenu** : carte « Cotisations validées ce mois » + lien cotisations en attente ; actions rapides (Tontines, Paiements, Utilisateurs, Réglages) ; alerte retards plateforme ; 5 dernières tontines ; activité 24 h (inscrits, cotisations), tontines suspendues, inscrits du mois ; répartition des tontines par statut.
- **API** : `GET /v1/admin/dashboard`, `GET /v1/tontines?page=0&size=5`.
- **États** : chargement ; vide (« Aucune tontine ») ; erreur non gérée (⚠️ un non-super-admin arrivant ici via `/dashboard` reçoit une erreur 403 silencieuse).
- **Fréquence** : moyenne.

### C. Tontines

#### F18 — Créer une tontine (assistant 2 étapes)
- **Rôles** : tous les connectés (USER, MEMBER, ADMIN). **Entrées** : bouton « Nouvelle tontine » (liste admin), actions rapides des accueils, bouton flottant mobile (FAB), accueil USER.
- **Parcours** : Étape 1 « Informations générales » : type (Rotative / Événementielle), nom, description, date de début → Étape 2 « Configuration » :
  - **Rotative** : fréquence (référentiel), montant, nombre de membres (2–100), gagnants par cycle (≥ 1), ordre des bénéficiaires (référentiel), mode de cycle (Automatique / Manuel).
  - **Événementielle** : fréquence des rappels, date de l'événement, nom de l'événement, montant libre ou fixe, montant minimum (facultatif).
  → « Créer ».
- **Validations** : nom 2–150 ; champs requis selon le type (voir ci-dessus).
- **API** : `POST /v1/tontines` ; référentiels `GET /v1/code-list/type/FREQUENCE_TONTINE`, `GET /v1/code-list/type/ORDRE_BENEFICIAIRE`.
- **États** : chargement bouton ; toast succès « Tontine créée ! **Reconnectez-vous** pour accéder à votre espace admin » (le rôle ADMIN n'est obtenu qu'après reconnexion) ; toast erreur.
- **Fréquence** : rare.

#### F19 — Liste des tontines gérées (ADMIN)
- **Contenu** : grille de cartes (statut, type, nom, description, montant / fréquence, membres x/N + barre, date de début, mode de cycle ou date d'événement) ; recherche texte ; filtres statut (Toutes / Active / Brouillon / Suspendue / Terminée) ; pagination 12.
- **API** : `GET /v1/tontines?page&size&sort=createdAt,desc`.
- **Remarque** : recherche et filtre appliqués **côté client sur la page courante** uniquement.
- **Fréquence** : moyenne.

#### F20 — Liste « Mes tontines » (MEMBER)
- **Contenu** : liste (avatar initiales, nom, statut, montant/fréquence, remplissage x/N, jackpot estimé) ; pagination 10 ; bandeau « Votre compte est activé ! » après activation.
- **API** : `GET /v1/tontines`.
- **États** : chargement, vide (« Aucune tontine »).
- **Fréquence** : moyenne.

#### F21 — Détail d'une tontine (page unifiée, 7 onglets)
- **Rôles** : SUPER_ADMIN (badge « lecture seule »), gestionnaire, membre (lecture seule).
- **Entrée** : listes de tontines, accueils, notifications.
- **En-tête** : retour, nom, statut, type, badge « Lecture seule » ; bouton « Suspendre » (gestionnaire, tontine active).
- **Carte principale** : cotisation (montant ou « Montant libre » + minimum), membres x/N, jackpot estimé + cycle en cours (rotative) ou date/compte à rebours J-x (événementielle) ; **une action principale contextuelle** : « Activer la tontine » (brouillon), « Valider N paiements », « Enregistrer un paiement », ou « Payer ma cotisation » (membre).
- **Onglets** : Infos · Membres (badge) · Cycles/Périodes · Paiements (badge à valider) · Récap (créateur/SA) · Jackpots (rotative) · Commissions (gestionnaire).
- **Onglet Infos** : description, infos événement, fréquence, mode des cycles, gagnants par cycle, ordre bénéficiaire, dates, créateur et son téléphone, dates de création/modification.
- **API** : `GET /v1/tontines/{id}`, `GET .../membres?size=100`, `GET .../cycles?size=100`, `GET .../commissions`, `GET .../cycles/beneficiaires`, jusqu'à 3 appels `GET .../cotisations` simultanés.
- **États** : chargement ; « Tontine introuvable » ; pas d'état d'erreur dédié.
- **Fréquence** : élevée (écran central du gestionnaire).

#### F22 — Activer une tontine
- **Entrée** : action principale de la carte (brouillon), gestionnaire. Confirmation « Activer cette tontine ? ».
- **API** : `PUT /v1/tontines/{id}/activer`. **Fréquence** : rare.

#### F23 — Suspendre une tontine
- **Entrée** : bouton secondaire en-tête (tontine active). Confirmation.
- **API** : `PUT /v1/tontines/{id}/suspendre`. **Fréquence** : rare.
- **Remarque** : « réactiver » une tontine suspendue réutilise « Activer » `[À CONFIRMER]` (bouton affiché seulement pour BROUILLON dans la carte).

### D. Membres

#### F24 — Lister les membres d'une tontine
- **Entrées** : onglet Membres du détail **et** page globale `/admin/membres` (doublon).
- **Contenu** : avatar, nom, téléphone, ordre jackpot, date d'adhésion, statut (Actif / Suspendu / Sorti), badge « Non inscrit » (pré-inscrit), indicateur « jackpot reçu ». Page globale : sélecteur de tontine (pastilles), recherche (page courante), pagination 20, tableau desktop / cartes mobile.
- **API** : `GET /v1/tontines/{id}/membres?page&size&sort=ordreJackpot,asc`.
- **Fréquence** : moyenne.

#### F25 — Ajouter un membre
- **Entrées** : onglet Membres, page Membres (« Ajouter »), FAB mobile dans une tontine gérée.
- **Parcours** : Téléphone → (a) **trouvé** : fiche utilisateur + position jackpot optionnelle → Ajouter ; (b) **introuvable** : prénom, nom, position optionnelle → Ajouter (pré-inscription + SMS d'invitation automatique).
- **Validations** : téléphone E.164 ; prénom/nom ≥ 2 ; position entier > 0 ou vide (fin de liste).
- **API** : `GET /v1/users/search?phone=`, `POST /v1/tontines/{id}/membres` (`phone`, `firstName?`, `lastName?`, `ordreJackpot?`).
- **États** : recherche en cours ; 404 → formulaire nouveau ; erreurs 409 « déjà membre » / « position occupée », 400 ; toast succès avec mention SMS.
- **Fréquence** : moyenne (en phase de constitution).

#### F26 — Suspendre / réactiver un membre
- **Entrées** : icônes dans l'onglet Membres ; menu « … » page Membres. Confirmation.
- **API** : `PATCH /v1/tontines/{id}/membres/{membreId}/statut` (`statut`). **Fréquence** : rare.

#### F27 — Retirer un membre
- Confirmation « sera définitivement retiré ». **API** : `DELETE /v1/tontines/{id}/membres/{membreId}` (suppression logique). **Fréquence** : rare.

### E. Cycles (tours) et jackpots

#### F28 — Lister les cycles
- **Entrées** : onglet Cycles/Périodes **et** page globale `/admin/cycles` (doublon).
- **Contenu** : cycle en cours épinglé en tête ; par cycle : numéro, statut (Ouvert / En cours / Versé), dates, Jackpot / Commission / Net, gagnants et montants reçus ; bouton « Voir les cotisations ».
- **API** : `GET /v1/tontines/{id}/cycles?page&size&sort=numeroCycle,asc`.
- **Fréquence** : moyenne.

#### F29 — Ouvrir un cycle (mode manuel)
- **Parcours** : « Nouveau cycle » → modale (tontine, **numéro de cycle — non transmis à l'API**, date de début, date de fin) → « Ouvrir le cycle ».
- **API** : `POST /v1/tontines/{id}/cycles` (`dateDebut`, `dateFin`).
- **Remarque** : aucune validation date fin > date début ; le bouton est proposé même en mode automatique `[À CONFIRMER]`.
- **Fréquence** : moyenne (une fois par cycle, mode manuel).

#### F30 — Clôturer un cycle / une période
- **Parcours** : « Clôturer ce cycle » → confirmation (« jackpot calculé, commissions déduites, cotisations EN_ATTENTE → EN_RETARD ») → toast. Événementielle : modale « Distribution finale » listant le montant net par membre.
- **API** : `PUT /v1/tontines/{id}/cycles/{cycleId}/cloturer` (réponse avec `distributionParMembre` le cas échéant).
- **Fréquence** : moyenne (une fois par cycle).

#### F31 — Désigner les gagnants (manuel)
- **Conditions** : rotative, cycle terminé, ordre bénéficiaire MANUEL, gestionnaire ou SA.
- **Parcours** : « Choisir » → modale sélection de 1 à N membres → valider.
- **API** : `PATCH /v1/tontines/{id}/cycles/{cycleId}/beneficiaire` (`membreIds`).
- **Fréquence** : moyenne.

#### F32 — Tirage aléatoire des gagnants
- « Aléatoire » → confirmation « Sélection aléatoire ? » → même endpoint avec liste vide. **Fréquence** : moyenne.

#### F33 — Historique des jackpots
- **Entrée** : onglet « Jackpots » (rotatives).
- **Contenu** : par cycle : gagnant(s), montant net ; dépliable : jackpot brut, commission, net, détail par gagnant ; « Gagnants non encore désignés ».
- **API** : `GET /v1/tontines/{id}/cycles/beneficiaires`.
- **États** : vide « Aucun jackpot remis pour le moment ».
- **Fréquence** : moyenne.

### F. Cotisations (paiements)

#### F34 — Déclarer un paiement (membre)
- **Description** : le membre signale qu'il a payé ; la cotisation passe « en attente de validation ». **Aucun paiement réel n'est initié par l'app.**
- **Entrées** (5) : bouton « Payer ma cotisation » de l'accueil, action rapide « Payer », bouton « Payer » de Mes cotisations, action principale du détail tontine, FAB « Déclarer mon paiement ».
- **Parcours** : modale « Payer ma cotisation » : montant affiché en gros → tontine (liste) → cycle en cours (liste) → moyen (Orange Money, Wave, Free Money, Espèces) → montant → référence (optionnelle) → « Payer maintenant » (+ mention « Paiement sécurisé »).
- **Validations** : tontine, cycle, montant > 0, moyen requis.
- **API** : `POST /v1/tontines/{id}/cotisations` (`cycleId`, `montant`, `methodePaiement`, `referenceTransaction?`, `note?`).
- **États** : « Aucun cycle en cours » dans la liste ; chargement bouton ; toast succès / erreur ; pas de reçu.
- **Remarque** : **deux implémentations distinctes** du même formulaire (modale intégrée à Mes cotisations + modale partagée du FAB).
- **Fréquence** : **élevée** (chaque cycle, chaque membre).

#### F35 — Historique de mes cotisations
- **Contenu** : pastilles de choix de tontine, liste chronologique (statut Validée / En attente / En retard, date-heure, montant), total, pagination 20.
- **API** : `GET /v1/tontines/{id}/cotisations?membreId=` (pour un admin, `membreId` retrouvé via la liste des membres).
- **États** : chargement, vide « Aucune cotisation ».
- **Remarque** : ÉTAT_PROJET annonce des statistiques (total versé, jackpots reçus) **absentes du code**.
- **Fréquence** : moyenne.

#### F36 — Suivi des cotisations d'une tontine (gestionnaire)
- **Entrées** : onglet « Paiements » du détail **et** page globale `/admin/cotisations` (doublon fonctionnel quasi complet).
- **Contenu** : pastilles tontine (page globale) ; statistiques (total validé, à valider, en retard — cliquables) ; bascule « Par cycle / Vue d'ensemble » ; pastilles de cycle (cycle en cours par défaut, « Tous ») ; sélecteur membre ; recherche (membre ou référence) ; filtres statut ; liste (membre, moyen, référence, statut, montant, date de validation, « Auto-déclaré » / « Saisie admin ») ; actions Modifier / Valider ; pagination 20.
- **API** : `GET /v1/tontines/{id}/cotisations?cycleId&membreId&page&size&sort=createdAt,desc`, `GET /v1/admin/my-dashboard` (stats), cycles, membres.
- **Remarque** : recherche et filtre statut **côté client sur la page courante**.
- **Fréquence** : **élevée**.

#### F37 — Valider une cotisation
- Bouton « Valider » sur une cotisation en attente → confirmation → toast.
- **API** : `PUT /v1/tontines/{id}/cotisations/{cotisationId}/valider`.
- **Remarque** : pas de validation groupée ; pas de refus/rejet (ÉTAT_PROJET mentionne « refuser » — **absent** `[À CONFIRMER]` côté API).
- **Fréquence** : **élevée**.

#### F38 — Enregistrer un paiement (gestionnaire, validé d'office)
- **Entrées** (5) : bouton « Enregistrer un paiement » (page cotisations, picker membre), fiche membre de la page cotisations, liste « membres sans cotisation », menu « … » de la page Membres, FAB « Enregistrer paiement » (picker membre).
- **Parcours** : choisir le membre → modale : montant (prérempli), moyen (Espèces par défaut, Wave, Orange Money, Free Money), référence, note → enregistrer.
- **API** : `POST /v1/tontines/{id}/cotisations/admin` (`membreId`, `cycleId`, `montant`, `methodePaiement`, …).
- **États** : toast « enregistrée et validée. Le membre a été notifié » ; erreur avec message serveur.
- **Fréquence** : élevée (paiements en espèces).

#### F39 — Modifier une cotisation
- **Conditions** : en attente, ou validée sur le cycle en cours.
- **Champs** : montant, moyen, référence, note (seuls les champs modifiés sont envoyés).
- **API** : `PATCH /v1/tontines/{id}/cotisations/{cotisationId}`. **Fréquence** : rare.

#### F40 — Membres sans cotisation (cycle en cours)
- Bloc dépliable « N membres sans cotisation — Cycle #x » avec bouton « + Paiement » par membre (badge « Sans compte »).
- **API** : calcul client (membres actifs − cotisations du cycle). **Fréquence** : élevée (relances).

#### F41 — Fiche membre (résumé des cotisations)
- Sélection d'un membre → validées / en attente / en retard, total versé, « Enregistrer son paiement ».
- **API** : `GET .../cotisations?membreId=&size=200`. **Fréquence** : moyenne.

#### F42 — Récapitulatifs
- **Onglet Récap** (créateur/SA) : vue « par cycle » (membre, statut, montant, méthode — membres sortis exclus) et vue « total par membre », paginées.
- **Vue d'ensemble** (page cotisations) : total collecté, paiements validés, classement par membre (tri asc/desc).
- **API** : `GET /v1/tontines/{id}/cotisations/recap/{cycleId}`, `GET /v1/tontines/{id}/cotisations/recap-total`.
- **Fréquence** : moyenne.

### G. Commissions

#### F43 — Gérer les commissions d'une tontine
- **Entrée** : onglet Commissions (gestionnaire).
- **Contenu / actions** : liste ; ajouter (type : % du jackpot, frais fixes par cycle, frais d'adhésion ; valeur ; description) ; supprimer. **Pas de modification** (endpoint disponible mais non utilisé).
- **API** : `GET/POST /v1/tontines/{id}/commissions`, `DELETE .../commissions/{commissionId}` (`PUT` non utilisé).
- **Fréquence** : rare.

### H. Administration plateforme (SUPER_ADMIN)

#### F44 — Utilisateurs
- Liste (nom, téléphone, email, rôles, statut compte, date d'inscription, actif/désactivé) ; recherche ; filtres rôle (client, page courante) et statut Inscrits / En attente (serveur) ; pagination 10.
- **API** : `GET /v1/admin/dashboard/users?page&size&sort&accountStatus`. `GET .../users/{id}` existe mais **non utilisé** (pas d'écran détail, contrairement à ÉTAT_PROJET).
- **Fréquence** : moyenne.

#### F45 — Activer / désactiver un compte
- Menu « … » → confirmation. Aucun action pour un compte pré-inscrit.
- **API** : `POST /v1/admin/dashboard/users/{id}/enable` / `.../disable`. **Fréquence** : rare.

#### F46 — Modifier les rôles
- Modale cases à cocher USER (verrouillé), MEMBER, ADMIN, SUPER_ADMIN (libellés techniques).
- **API** : `PUT /v1/admin/dashboard/users/{id}/roles`. **Fréquence** : rare.

#### F47 — Toutes les tontines
- Tableau (nom, type, créateur, montant, fréquence, membres, début, statut), filtre statut serveur, pagination 20, clic → détail lecture seule.
- **API** : `GET /v1/admin/dashboard/tontines?page&size&statut`. États : chargement, vide, **erreur avec réessai** (seule page avec gestion d'erreur explicite, avec F48). **Fréquence** : moyenne.

#### F48 — Toutes les cotisations
- Tableau (membre, tontine cliquable, montant, méthode, date, statut), filtres statut et tontine (serveur), pagination 20.
- **API** : `GET /v1/admin/dashboard/contributions?page&size&statut&tontineId`. **Fréquence** : moyenne.

#### F49 — Référentiels
- Onglets par type (Fréquences, Méthodes de paiement, Statuts cotisation, Ordre bénéficiaire, Rôles internes), liste (type, valeur technique, libellé, « Système »), créer, modifier (valeur verrouillée si système). **Pas de suppression** (annoncée dans ÉTAT_PROJET).
- **API** : `GET /v1/code-list?page=0&size=200`, `POST /v1/code-list`, `PUT /v1/code-list/{id}`.
- **Fréquence** : rare.

### I. Transverses

#### F50 — Notifications
- **Entrée** : cloche avec badge (non-lus, « 9+ ») dans l'en-tête.
- **Contenu** : sections « Nouvelles » / « Précédentes » ; carte (icône par catégorie : jackpot, paiement, validation, retard, rappel), titre, texte, date relative ; clic → marque lu + navigation contextuelle ; « Tout marquer lu » ; « Charger plus ».
- **Types** : PAIEMENT_RECU, COTISATION_SOUMISE, COTISATION_VALIDEE, JACKPOT_DISTRIBUE, DISTRIBUTION_FINALE, PAIEMENT_EN_RETARD, RAPPEL_COTISATION, TOUR_PROCHE, CYCLE_BIENTOT_CLOTURE, CYCLE_OUVERT, INVITATION_TONTINE, STATUT_MEMBRE.
- **API** : `GET /v1/notifications?page&size`, `GET /v1/notifications/unread-count` (sondage 60 s + au retour sur l'app), `PATCH /v1/notifications/{id}/read`, `PATCH /v1/notifications/read-all`.
- **États** : chargement, vide « Aucune notification ». Pas de notifications push (Web Push) `[À CONFIRMER]`.
- **Fréquence** : élevée.

#### F51 — Profil : consulter / modifier mes informations
- Avatar initiales, nom, rôle, badge « PIN configuré », téléphone, email ; modale prénom, nom (2–50), email.
- **API** : `GET /v1/profile`, `PUT /v1/profile`. **Fréquence** : rare.

#### F52 — Changer de numéro (OTP 2 étapes)
- Nouveau numéro → code reçu sur le nouveau numéro → reconnexion forcée.
- **API** : `POST /v1/profile/phone/request-change`, `POST /v1/profile/phone/verify`. **Fréquence** : rare.

#### F53 — Changer de mot de passe
- Réutilise le flux « mot de passe oublié » : saisir **son propre téléphone** (non pré-rempli), code SMS, nouveau mot de passe. Pas de saisie de l'ancien mot de passe.
- **API** : endpoints F09. **Fréquence** : rare.

#### F54 — Configurer / changer le PIN depuis le profil
- Modale avec 2 champs texte masqués (et non le pavé numérique utilisé ailleurs).
- **API** : `POST /v1/auth/pin/setup`. **Fréquence** : rare.

#### F55 — Thème sombre — **NON FONCTIONNEL**
- Bascule « Mode sombre » dans le menu avatar, persistée localement, ajoute la classe `dark` à la page — mais **aucun style sombre n'existe** (0 classe `dark:`, pas de `darkMode` Tailwind). Effet visible nul.

#### F56 — Installation PWA
- Android/Chrome : bannière « Installer Dinthialma » (invite native). iOS : bannière d'instructions (Partager → Sur l'écran d'accueil), masquable définitivement.
- **Remarque** : le bouton de fermeture de la bannière Android appelle la fonction de fermeture **iOS** → ne ferme pas la bannière Android `[À CONFIRMER]` en test réel.
- **Fréquence** : rare.

#### F57 — Bouton d'action flottant contextuel (mobile)
- Accueil : « Créer une tontine ». Dans une tontine gérée : menu (Enregistrer paiement, Ajouter un membre, Créer une tontine). Dans une tontine en tant que membre ou sur listes tontines/cotisations : « Déclarer mon paiement ». Masqué ailleurs.
- **Fréquence** : élevée (mobile).

#### F58 — Rechargement automatique après déploiement
- Si un morceau de code n'est plus disponible après une mise en ligne, la page se recharge seule. Invisible pour l'utilisateur.

#### F59 — Graphique « Volume collecté » (factice)
- Graphique en barres desktop sur l'accueil gestionnaire, **données illustratives codées en dur** (Jan–Jun). À supprimer ou brancher.

**Total : 59 fonctionnalités recensées** (dont 2 inachevées/non fonctionnelles : F14, F55 ; 1 factice : F59).

---

## 3. Éléments transverses

### Navigation
- **Desktop** : barre latérale (logo, rôle, liens, « Mon profil », « Déconnexion ») + en-tête (cloche, avatar → menu Profil / Thème / Déconnexion).
- **Mobile** : en-tête (logo, cloche, avatar) + barre du bas.
  - SUPER_ADMIN : Accueil · Tontines · Paiements · Utilisateurs · Profil (Référentiels via action rapide « Réglages »).
  - ADMIN : Accueil · Tontines · **[FAB]** · Paiements · Profil (Membres, Cycles, Mes participations absents de la barre).
  - MEMBER : Accueil · Tontines · **[FAB]** · Paiements · Profil.
  - USER : Accueil · Profil.
- Liens desktop ADMIN : Accueil, Mes tontines, Cotisations, Membres, Cycles, Mes participations (6 entrées).
- Modales en « bottom sheet » sur mobile, centrées sur desktop. Tableaux desktop ↔ cartes mobile.

### Authentification / session
- Jetons dans `localStorage` (accès, refresh), téléphone, drapeau PIN, type de client (WEB / MOBILE selon mode installé).
- Rôles lus dans le JWT (`realm_access.roles`, préfixes `DINTHIALMA_*`).
- Le changement de rôle (devenir ADMIN après création d'une tontine) nécessite une reconnexion.

### Notifications
- Centre in-app uniquement, sondage 60 s ; toasts (Sonner, en haut à droite) pour les retours d'action.

### Recherche
- Recherches locales (page courante) : tontines, membres, cotisations, utilisateurs. Pas de recherche globale.

### Paramètres / profil
- Profil (F51–F54), thème (F55), PIN. Pas de réglages de notifications, langue ou confidentialité.

### Multi-langue
- **Aucune i18n** : tout est en français codé en dur (dates `fr-FR`, montants « FCFA »). Pas de wolof `[À CONFIRMER]` besoin produit.

### Thème
- Couleur primaire verte (`#16a34a`, theme_color PWA), police Inter (Google Fonts). Mode sombre non fonctionnel.

### PWA
- Manifest : nom « Dinthialma », `standalone`, portrait, `lang: fr`, icônes SVG 192/512 (+ maskable), apple-touch-icon PNG.
- Service worker auto-update (Workbox) : pré-cache des ressources ; cache réseau d'abord (délai 5 s) pour `/v1/tontines*` (5 min) et `/v1/notifications*` (2 min) ; polices en cache long.
- **Aucune gestion visible du hors-ligne** : pas de détection `navigator.onLine`, pas de bandeau, pas de file d'attente d'actions ; les autres appels (cotisations du membre, profil, dashboards…) échouent sans message dédié.
- Onboarding uniquement en mode installé mobile.

---

## 4. Problèmes constatés

### Bugs / incohérences bloquantes
1. **`/dashboard` affiche le tableau de bord Super Admin à tout utilisateur connecté** (route sans contrôle de rôle). Or le démarrage (`/`) et la fin d'onboarding redirigent un jeton valide vers `/dashboard` → un membre qui rouvre l'app tombe sur un écran plateforme qui appelle `GET /v1/admin/dashboard` (403) et s'affiche vide/à zéro.
2. **Redirection USER incohérente** : connexion mot de passe → `/user/dashboard` ; connexion PIN et création de PIN → `/profile`.
3. **Catch-all vers `/login`** même pour un utilisateur connecté (lien invalide = « déconnexion » apparente).
4. **Écran « Accès refusé »** affichant les rôles techniques (`MEMBER, ADMIN`).
5. **Super Admin « lecture seule »** mais boutons « Choisir / Aléatoire » (désignation des gagnants) visibles pour lui.
6. **Numéro de cycle** demandé à l'ouverture d'un cycle mais jamais envoyé à l'API ; pas de contrôle date de fin > date de début.
7. **Identification du membre par comparaison de téléphones côté client** (indicatif retiré) : fragile (formats, changement de numéro).
8. **Bannière d'installation Android** : la croix appelle la fermeture iOS.

### Fonctionnalités mortes, inachevées ou trompeuses
- **Rejoindre par code** (F14) : bouton qui affiche « bientôt disponible ».
- **Mode sombre** (F55) : bascule sans effet.
- **Graphique « Volume collecté »** (F59) : données fictives.
- **« Payer maintenant » / « Paiement sécurisé »** : aucun paiement n'est effectué, il s'agit d'une **déclaration** à valider. Libellés trompeurs pour un utilisateur habitué au mobile money.
- **Statistiques de l'accueil USER** : zéros statiques.
- **Code mort** : ancienne page détail admin (909 lignes), `CycleRecapModal`, `FilterBar`, `JackpotCelebration` (animation de jackpot jamais affichée), composants UI `Card`, `Avatar`, `Stat` utilisés uniquement par du code mort `[À CONFIRMER]` ; 3 routes legacy `/admin/tontines/:tontineId/{membres|cycles|cotisations}` dont le paramètre est ignoré.
- **Endpoints disponibles sans écran** : modification/suppression d'une tontine en brouillon (`PUT`/`DELETE /v1/tontines/{id}`), modification de commission (`PUT`), détail utilisateur (`GET /v1/admin/dashboard/users/{id}`), détail cotisation (`GET .../cotisations/{id}`), détail cycle (`GET .../cycles/{cycleId}`).
- **Écart avec la documentation projet** (ÉTAT_PROJET) : « refuser une cotisation », « supprimer un référentiel », « voir le détail d'un utilisateur », statistiques « jackpots reçus » sur Mes cotisations — **absents du code**.

### Doublons et écrans redondants
| Domaine | Implémentations |
|---|---|
| Accueils | 4 tableaux de bord (USER, MEMBER, ADMIN, SUPER_ADMIN) + « Mes participations » pour l'ADMIN qui est aussi membre → un gestionnaire jongle entre **deux espaces** |
| Listes de tontines | Admin (grille), Membre (liste), Super Admin (tableau), + sections dans 3 accueils |
| Membres | Onglet du détail **+** page globale `/admin/membres` (qui fonctionne en réalité tontine par tontine) |
| Cycles | Onglet du détail **+** page globale `/admin/cycles` (idem, tontine par tontine) ; modale « Nouveau cycle » codée deux fois |
| Cotisations (gestion) | Onglet « Paiements » **+** page `/admin/cotisations` **+** onglet « Récap » **+** « Vue d'ensemble » — même filtres, même actions |
| Déclarer un paiement | Modale de Mes cotisations **+** modale partagée du FAB (deux codes, mêmes champs) ; 5 points d'entrée |
| Enregistrer un paiement (admin) | 5 points d'entrée ; sélecteur de membre codé deux fois |
| Déconnexion | 3 emplacements ; « Changer de compte » deux fois sur l'écran PIN ; « Plus tard » deux fois sur la création de PIN |
| Changer le PIN | Pavé numérique (auth) vs champs texte (profil) |

### Parcours trop longs
- **Payer sa cotisation (membre)** : ouvrir → choisir la tontine → choisir le cycle → choisir le moyen → saisir le montant (même s'il est fixe et déjà affiché) → référence → valider = **6–7 interactions**, sans récapitulatif ni reçu.
- **Encaisser un paiement espèces (gestionnaire)** depuis l'accueil : Paiements → choisir la tontine → « Enregistrer » → chercher le membre → formulaire → valider = **6+ taps**.
- **Valider des paiements** : une confirmation modale **par** cotisation, pas de validation groupée, pas d'annulation.
- **Créer une tontine** : 13 champs potentiels, puis **reconnexion obligatoire** pour gérer la tontine créée.
- **Changer de mot de passe** : ressaisir son propre numéro puis un code SMS.
- **Inscription** : 3 étapes + création du PIN (2 passes) = 5 écrans avant le premier accueil.

### Autres incohérences
- Terminologie : « Cotisations » (menu desktop) vs « Paiements » (mobile / onglet) ; « Cycle » vs « Période » ; « Versé » vs « Terminé » ; « Ouvert » pour l'état EN_ATTENTE.
- Accueil membre limité à la **première** tontine active (les autres sont invisibles dans le solde).
- Montants des cotisations affichés en négatif (« -5 000 F ») dans l'activité du membre — perçu comme un débit sur un relevé.
- Filtres/recherches appliqués sur la page courante seulement (résultats incomplets) : tontines admin, membres, cotisations, utilisateurs.
- Gestion d'erreur réseau quasi absente (sauf pages Super Admin tontines/cotisations) ; aucun état hors-ligne.
- Déconnexion « douce » non explicitée (la session reste ouverte côté serveur).
- Emojis dans les titres (« Bon retour 👋 ») et les moyens de paiement — rendu variable selon les appareils.
