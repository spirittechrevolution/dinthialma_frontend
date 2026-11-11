# Brief d'écrans — Dinthialma (web + PWA) · v2 « logique Wave »

> Document à transmettre tel quel à une IA de génération d'interfaces.
> Langue : **français simple**, vouvoiement. Monnaie : **FCFA**. Pays : **Sénégal** (numéros +221).
> `[À CONFIRMER]` = dépend d'une évolution de l'API ou d'une décision produit.

---

## 0. Contexte produit

Dinthialma permet de gérer des **tontines** : des groupes de personnes qui cotisent régulièrement ; à chaque **tour**, la cagnotte (le **jackpot**) revient à un ou plusieurs membres.

- **Tontine rotative** : montant fixe, rythme régulier (jour → trimestre), un ou plusieurs gagnants par tour, ordre fixé, tiré au sort ou choisi.
- **Tontine événementielle** : épargne vers une date (Tabaski, mariage…), montant fixe ou libre (avec minimum), cagnotte répartie entre tous les membres à la fin.

**Paiement** : le membre paie hors de l'app (Wave, Orange Money, Free Money, espèces) puis le **déclare** → **En attente** → le gestionnaire **valide** → **Validé**. Non validé à la fin du tour → **En retard**. Le gestionnaire peut aussi **encaisser** directement (validé tout de suite).

**Tour** : **À venir** → **En cours** → **Terminé** (jackpot calculé, commissions déduites, gagnant(s) désigné(s)).

**Profils** : le rôle est porté par **chaque tontine**. Une même personne peut **cotiser** dans plusieurs tontines et **gérer** plusieurs autres (ou la même). L'**administrateur plateforme** supervise l'ensemble (surtout sur ordinateur).

---

## 1. Le modèle « logique Wave »

L'application doit donner les mêmes réflexes que Wave, avec l'identité Dinthialma (vert, vocabulaire tontine). **Ne reprendre ni la couleur bleue, ni la mascotte, ni les illustrations, ni les noms de rubriques de Wave.**

Huit gabarits structurent toute l'app :

| Gabarit | Principe | Utilisé par |
|---|---|---|
| **Accueil-hub** | Pas de barre d'onglets. Bandeau coloré (réglages à gauche, alertes à droite, montant masquable), carte centrale, grille de 8 services, fil d'activité sur l'accueil | Accueil |
| **Feuille « Plus »** | Services secondaires dans une feuille du bas | Plus de services |
| **Choisir (« À qui ? / Pour quoi ? »)** | Titre-verbe, champ de recherche avec focus, ligne « + nouveau », ligne « Scanner », favoris | Payer, Encaisser, Ajouter un membre, Choisir une tontine |
| **Fiche d'objet** | Icône + nom, montant énorme, 2 boutons pilule, carte de lignes, historique | Fiche Tontine |
| **Question unique** | Une question, grille de grandes icônes, un bouton en bas désactivé tant que rien n'est choisi | Créer une tontine |
| **Gains** | Montant cumulé énorme, bandeau d'info, cartes | Mes jackpots |
| **Catalogue** | Recherche, favoris, sections en tuiles | Mes tontines |
| **Paramètres** | Sections titrées, lignes icône + libellé dans des cartes blanches | Paramètres, Réglages de la tontine |

---

## 2. Principes directeurs

1. **Une action principale par écran**, visible sans défiler.
2. **Peu de texte** : libellés de 1 à 3 mots.
3. **3 taps maximum** pour payer, encaisser, valider.
4. **Mobile d'abord**, une main, zones tactiles ≥ 48 px, contraste élevé.
5. **Tout part de l'accueil et y revient** ; flèche retour en haut à gauche partout ailleurs.
6. **Réseau faible** : données en cache affichées avec leur heure, squelettes, actions d'argent bloquées hors connexion avec explication.
7. **Confiance** : confirmation avant toute action sensible, **reçu** après chaque paiement, statut toujours visible (icône + mot + couleur).
8. **Honnêteté** : l'app enregistre une déclaration ; écrire « J'ai payé » / « Confirmer mon paiement », jamais « Paiement sécurisé ».
9. **Un scan ne déclenche jamais rien seul** : il ouvre toujours un écran avec un bouton de confirmation.

---

## 3. Carte de navigation

### 3.1 L'accueil-hub (mobile)

```
┌──────────────────────────────────────────┐
│ ⚙                                    🔔3 │  ← Paramètres / Alertes
│        [ Je cotise | Je gère •3 ]        │  ← bascule (si les 2 rôles)
│        Toutes mes tontines ▾             │  ← filtre tontine
│        TOTAL COTISÉ  ••••••  👁          │  ← tap → montants par tontine
│  ┌────────────────────────────────────┐  │
│  │  [QR]  Mon QR membre    [Scanner]  │  │  ← carte QR
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │ À payer 5.000F · Famille  [Payer]  │  │  ← carte d'action (la plus urgente)
│  └────────────────────────────────────┘  │
│   (●)    (●)    (●)    (●)               │
│  Payer Tontines Jackpots Historique      │  ← grille 8 services
│   (●)    (●)    (●)    (●)               │
│  Créer  Inviter  Aide   Plus             │
│ ──────────────────────────────────────── │
│  Cotisation Famille        5.000F  ⏳    │  ← fil d'activité
│  10 nov., 23:05                          │
│  Jackpot reçu · Amis      +57.000F  ✓    │
└──────────────────────────────────────────┘
```

### 3.2 Les deux modes

| Zone | **Je cotise** | **Je gère** |
|---|---|---|
| Bandeau | **TOTAL COTISÉ** (validé, toutes tontines ou celle filtrée) | **COLLECTÉ CE TOUR** (tontines gérées ou celle filtrée) |
| Tap sur le montant | Feuille « Mes montants par tontine » | Feuille « Collecte par tontine » |
| Carte QR | **Mon QR membre** + Scanner | **QR d'invitation** de la tontine + Scanner |
| Carte d'action | « À payer 5.000F · Famille » / « Tout est à jour ✓ » | « 3 paiements à valider » / « 4 n'ont pas payé » / « Tout est à jour ✓ » |
| Grille | Payer · Mes tontines · Mes jackpots · Historique · Créer · Inviter · Aide · Plus | Encaisser · À valider · Mes tontines · Membres · Tours · Créer · Inviter · Plus |
| Fil d'activité | Mes paiements, validations, jackpots | Paiements reçus, déclarations à valider, clôtures |

- La bascule n'apparaît que si l'utilisateur cotise **et** gère. Le dernier mode est mémorisé. Une pastille signale l'urgent sur le mode inactif (« Je gère •3 »).
- Le filtre « Toutes mes tontines ▾ » s'applique au bandeau, à la carte QR, à la carte d'action, à la grille et au fil.
- En « Toutes », une action qui vise une seule tontine commence par la feuille **« Pour quelle tontine ? »** (sautée s'il n'y a qu'un choix).
- Une tontine où l'on gère **et** cotise apparaît dans les deux modes ; sa fiche s'ouvre en vue gestionnaire en « Je gère », en vue membre en « Je cotise ».
- Nouvel inscrit sans tontine : pas de bascule, pas de filtre, carte « Créer ma première tontine ».
- Administrateur plateforme : une case **« Plateforme »** remplace « Aide » dans la grille et ouvre la console.

### 3.3 Arborescence

```
ENTRÉE
E1 Bienvenue · E2 Connexion · E3 Déverrouillage · E4 Code SMS
E5 Création de compte · E6 Code secret · E7 Nouveau mot de passe

ACCUEIL (A1)
├── ⚙  A3 Paramètres ── E4 / E6 / E7 / A4
├── 🔔 A2 Alertes ── (écran concerné)
├── Montant ── feuille « Montants par tontine » ── T2
├── Carte QR ── A5 Scanner ── B3 Encaisser / T5 Ajouter / T10 Invitation / T2
│            └─ Agrandir / Partager ── A4 Partager
├── Carte d'action ── B2 Payer / B4 À valider / B3 Encaisser / T9 Créer
├── Grille
│   ├── Payer ── B2 ── B5 Reçu
│   ├── Encaisser ── B3 ── B5 Reçu
│   ├── À valider ── B4 ── B5
│   ├── Mes tontines ── T1 ── T2 Fiche Tontine
│   │                         ├── T3 Membres ── T4 Membre / T5 Ajouter
│   │                         ├── T6 Tours ── T7 Tour
│   │                         ├── T8 Réglages
│   │                         └── historique ── B5
│   ├── Membres / Tours (Je gère) ── « Pour quelle tontine ? » ── T3 / T6
│   ├── Mes jackpots ── G1
│   ├── Historique ── A6 ── B5
│   ├── Créer ── T9
│   ├── Inviter ── A4
│   └── Plus ── feuille Plus de services
└── Fil d'activité ── B5 Reçu

LIEN / QR EXTERNE
T10 Invitation (ouverte par un QR ou un lien, même sans compte)

PLATEFORME (administrateur, desktop d'abord)
P1 Accueil plateforme · P2 Utilisateurs · P3 Tontines · P4 Paiements · P5 Listes de valeurs
```

**34 écrans** + **12 feuilles** réutilisables. Un membre qui ne gère rien voit **21 écrans**.

---

## 4. Choix structurants (résumé)

| Choix | Raison |
|---|---|
| Accueil-hub sans barre du bas | Réflexe Wave : tout est sur l'accueil. |
| Bascule Je cotise / Je gère + filtre tontine | Un seul écran pour tous les profils, même avec plusieurs tontines dans chaque rôle. |
| Montant = total cotisé toutes tontines, détail au tap | Vision globale rassurante, détail à 1 tap. |
| Carte QR à deux faces + Scanner | QR membre pour encaisser sans chercher le nom ; QR tontine pour inviter. |
| Fiche Tontine façon « fiche d'objet » (2 boutons + lignes + historique) au lieu d'onglets | Un objet = son montant, ses 2 actions, son historique. |
| Créer = « Pour quoi cotisez-vous ? » | Une question simple remplace un formulaire de 13 champs. |
| Écran Partager unique (QR + WhatsApp + Copier + Plus) | Même geste pour inviter à l'app ou dans une tontine. |
| File « À valider » transverse, validation en 1 tap + Annuler | Tâche la plus fréquente du gestionnaire. |
| Reçu après chaque paiement | Confiance. |
| Supprimés : graphique fictif, mode sombre sans effet, « rejoindre par code » inactif, pages globales Membres / Cycles / Cotisations en doublon, multiples points d'entrée de paiement | Pas de fonction morte, un seul chemin par action. |
| Vocabulaire unique : **Paiement, Tour, Jackpot, Gestionnaire, Membre, En attente / Validé / En retard, À venir / En cours / Terminé** | Cohérence. |

---

## 5. Fiches écrans

### Entrée

## Écran : E1 — Bienvenue
- Objectif (1 phrase) : Présenter l'app en un coup d'œil et orienter vers inscription ou connexion.
- Action principale : « Créer mon compte ».
- Actions secondaires : « J'ai déjà un compte ».
- Contenu affiché (par ordre de priorité) : logo + Dinthialma ; accroche « Vos tontines, simples et claires » ; 3 pictos (Cotisez · Suivez · Recevez) ; boutons en bas.
- Champs de saisie : aucun.
- États : chargement : — / vide : — / erreur : — / succès : — / hors-ligne : message au tap « Connexion requise pour continuer ».
- Navigation : vient du premier lancement, ou d'un lien d'invitation sans compte → mène vers E4 (inscription) ou E2.
- Comportement web (desktop) vs PWA (mobile) : desktop : panneau de marque à gauche, boutons à droite ; PWA : plein écran, boutons en bas. Affiché une fois par appareil.
- Données/API sous-jacentes : aucune.

## Écran : E2 — Connexion
- Objectif (1 phrase) : Se connecter avec son numéro et son mot de passe.
- Action principale : « Se connecter ».
- Actions secondaires : « Mot de passe oublié ? » ; « Créer un compte ».
- Contenu affiché : titre ; champ téléphone ; mot de passe (œil) ; message de succès éventuel (« Compte créé », « Mot de passe changé »).
- Champs de saisie : téléphone (préfixe +221 fixe, 9 chiffres, clavier téléphone, format « 77 123 45 67 ») ; mot de passe (≥ 8, autocomplétion).
- États : chargement : bouton avec indicateur / vide : — / erreur : « Numéro ou mot de passe incorrect » ; compte créé par un gestionnaire : feuille « Votre compte vous attend » + « Activer mon compte » (→ E4, numéro prérempli) / succès : → E6 si pas de code secret, sinon A1 / hors-ligne : bouton désactivé.
- Navigation : vient de E1, E3 (« Changer de compte »), T10 → mène vers A1, E6, E4.
- Comportement web vs PWA : desktop : formulaire centré 400 px ; PWA : bouton collé au-dessus du clavier.
- Données/API sous-jacentes : `POST /v1/auth/login` (numéro, mot de passe, type de client) → jetons + « code secret configuré ? » ; 403 « pré-inscrit » → feuille d'activation.

## Écran : E3 — Déverrouillage (code secret)
- Objectif (1 phrase) : Revenir dans l'app avec son code à 6 chiffres.
- Action principale : saisie du code (validation automatique au 6ᵉ chiffre).
- Actions secondaires : « Code oublié ? » ; « Changer de compte ».
- Contenu affiché : initiales + « Bonjour Awa » ; numéro masqué « 77 ••• •• 67 » ; 6 points ; pavé numérique géant.
- Champs de saisie : pavé numérique.
- États : chargement : « Vérification… » / erreur : secousse + vibration, « Code incorrect » ; trop d'essais : « Réessayez dans X min » ; code expiré → réinitialisation ; session expirée → E2 / succès : → A1 (ou l'écran du lien ouvert) / hors-ligne : « Pas de connexion » + « Réessayer ».
- Navigation : vient de l'ouverture de l'app → mène vers A1, E4, E2.
- Comportement web vs PWA : PWA : écran par défaut à l'ouverture ; desktop : clavier physique accepté.
- Données/API sous-jacentes : `POST /v1/auth/login-pin` ; « Changer de compte » : `POST /v1/auth/logout` puis oubli de l'appareil.

## Écran : E4 — Code SMS (générique)
- Objectif (1 phrase) : Vérifier un numéro avec le code reçu par SMS.
- Action principale : « Vérifier » (automatique à 6 chiffres).
- Actions secondaires : « Renvoyer le code » (après 30 s) ; « Modifier le numéro ».
- Contenu affiché : étape « 1/3 » si parcours ; si numéro inconnu : champ téléphone + « Recevoir le code » ; puis 6 cases.
- Champs de saisie : téléphone (+221) ; code 6 chiffres (clavier numérique, remplissage automatique depuis le SMS, collage).
- États : chargement : cases verrouillées / erreur : « Code incorrect ou expiré » ; inscription avec numéro existant : « Ce numéro a déjà un compte » + « Se connecter » / succès : coche puis écran suivant / hors-ligne : « Le SMS ne peut pas être demandé ».
- Navigation : vient de E1, E2 (mot de passe oublié), E3 (code oublié), A3 (numéro, mot de passe) → mène vers E5, E7, E6 ou A3.
- Comportement web vs PWA : identique ; remplissage automatique du code en PWA quand le système le permet.
- Données/API sous-jacentes : inscription `POST /v1/auth/register/send-otp` + `/verify-otp` ; mot de passe oublié `POST /v1/auth/forgot-password/send-otp` + `/verify-otp` ; code oublié `POST /v1/auth/pin/reset/send-otp` + `/verify-otp` ; changement de numéro `POST /v1/profile/phone/request-change` + `/verify`.

## Écran : E5 — Création de compte
- Objectif (1 phrase) : Donner son nom et choisir un mot de passe.
- Action principale : « Créer mon compte ».
- Actions secondaires : —
- Contenu affiché : étape 3/3 ; prénom ; nom ; mot de passe avec jauge ; « Ajouter un email (facultatif) » replié.
- Champs de saisie : prénom, nom (2–100, majuscule auto) ; mot de passe (≥ 8, œil, pas de champ « confirmer ») ; email (facultatif, clavier email).
- États : chargement / erreur par champ / succès : → E6 ; compte créé par un gestionnaire : « Votre compte est activé, vous êtes déjà membre de 1 tontine » / hors-ligne : bouton désactivé.
- Navigation : vient de E4 → mène vers E6 puis A1 (ou T10 si l'inscription vient d'une invitation).
- Comportement web vs PWA : identique.
- Données/API sous-jacentes : `POST /v1/auth/register/complete`. Connexion automatique après création `[À CONFIRMER : jetons renvoyés ?]`.

## Écran : E6 — Code secret
- Objectif (1 phrase) : Choisir ou changer son code à 6 chiffres.
- Action principale : saisie puis confirmation (2 passages sur le même écran).
- Actions secondaires : « Plus tard » (une seule fois, en haut à droite, création uniquement).
- Contenu affiché : « Choisissez votre code » / « Confirmez votre code » ; 6 points ; pavé ; conseil « Évitez 123456 ».
- Champs de saisie : pavé numérique.
- États : chargement « Enregistrement… » / erreur : codes différents → retour 1ᵉʳ passage ; code trop simple / succès : « Code enregistré » / hors-ligne : impossible, message.
- Navigation : vient de E2, E5, E4, A3 → mène vers A1, E3 ou A3.
- Comportement web vs PWA : identique.
- Données/API sous-jacentes : `POST /v1/auth/pin/setup` ; après code oublié `POST /v1/auth/pin/reset`.

## Écran : E7 — Nouveau mot de passe
- Objectif (1 phrase) : Définir un nouveau mot de passe après vérification SMS.
- Action principale : « Enregistrer ».
- Actions secondaires : —
- Contenu affiché : champ mot de passe avec œil et jauge.
- Champs de saisie : ≥ 8 caractères.
- États : chargement / erreur « Code expiré, recommencez » → E4 / succès : → E2 « Mot de passe changé » (ou A3) / hors-ligne : désactivé.
- Navigation : vient de E4 → mène vers E2 ou A3.
- Comportement web vs PWA : identique.
- Données/API sous-jacentes : `POST /v1/auth/forgot-password/reset`.

### Accueil et transverses

## Écran : A1 — Accueil
- Objectif (1 phrase) : Tout voir et tout lancer depuis un seul écran, comme dans Wave.
- Action principale : **la carte d'action**, qui affiche une seule action choisie par priorité :
  - Je gère : 1) « 3 paiements à valider » → B4 ; 2) « 4 n'ont pas payé · Encaisser » → B3 ; 3) tour terminé sans gagnant → « Désigner le gagnant » → T7.
  - Je cotise : 1) « À payer 5.000F · Famille · avant le 15 nov. » → B2 ; plusieurs dues : « 2 cotisations à payer » → B2.
  - Tout est à jour : « Tout est à jour ✓ · Prochain tour le 1er déc. » (pas de bouton).
  - Aucune tontine : « Créer ma première tontine » → T9.
- Actions secondaires : bascule de mode ; filtre tontine ; œil ; tap sur le montant ; carte QR (Agrandir, Partager, Scanner) ; 8 cases de la grille ; lignes du fil ; ⚙ ; 🔔.
- Contenu affiché (par ordre de priorité) :
  1. **Bandeau vert** : ⚙ à gauche, 🔔 avec badge à droite ; bascule « Je cotise | Je gère » ; filtre « Toutes mes tontines ▾ » ; libellé « TOTAL COTISÉ » ou « COLLECTÉ CE TOUR » ; **montant énorme** au format « 85.000F », masqué par des points par défaut si l'utilisateur l'a choisi, œil pour afficher/masquer.
  2. **Carte QR** (chevauche le bas du bandeau) : QR + titre (« Mon QR membre » / « Inviter dans Famille ») + bouton « Scanner ». Tap sur le QR → agrandi plein écran avec « Partager ».
  3. **Carte d'action** (voir ci-dessus).
  4. **Grille de 8 services** (icônes rondes colorées 64 px + 1 mot ; badge de compteur sur « À valider »).
  5. **Fil d'activité** : lignes « libellé · date (10 nov., 23:05) · montant à droite · statut » ; défilement infini. Montant d'une cotisation sans signe ; jackpot reçu en vert « +57.000F ».
  - Nouvel inscrit : pas de bascule ni de filtre, montant « 0F », carte QR membre, carte « Créer ma première tontine », aide « Invité par un proche ? Montrez-lui votre QR ou donnez votre numéro. »
- Champs de saisie : aucun.
- États : chargement : squelettes du bandeau, des cartes et du fil / vide : fil « Aucune activité pour l'instant » / erreur : carte grise « Impossible de charger » + « Réessayer », cache affiché s'il existe / succès : — / hors-ligne : bandeau fin « Hors connexion · mis à jour à 14:30 », boutons d'argent désactivés.
- Navigation : vient de E3, E2, E5, de tout retour → mène vers A2–A6, B2–B5, T1, T3, T6, T7, T9, G1, feuilles « Montants par tontine », « Plus », « Pour quelle tontine ? ».
- Comportement web vs PWA : desktop : bandeau + carte QR + carte d'action en haut à gauche, grille de services en colonne gauche (2 × 4), fil d'activité au centre, panneau droit « Mes tontines » ; PWA : une colonne, tirer pour rafraîchir.
- Données/API sous-jacentes : `GET /v1/tontines` ; Je gère : `GET /v1/admin/my-dashboard` (collecté, en attente, en retard, tour en cours par tontine) ; Je cotise : par tontine `GET /v1/tontines/{id}/cycles` et `GET /v1/tontines/{id}/cotisations?membreId=…` ; fil : mêmes données + `GET /v1/tontines/{id}/cycles/beneficiaires`. `[À CONFIRMER : endpoint « mon résumé » (totaux, cotisations dues, mon identifiant de membre par tontine, fil d'activité agrégé) — fortement conseillé pour réseau lent]`.

## Écran : A2 — Alertes
- Objectif (1 phrase) : Être prévenu de ce qui me concerne et y répondre en un tap.
- Action principale : tap sur une alerte → écran concerné (marquée lue).
- Actions secondaires : « Tout marquer comme lu ».
- Contenu affiché : sections « Nouvelles » / « Plus anciennes » ; icône par catégorie (paiement, validation, jackpot, retard, rappel, tour), titre court, 1 ligne, date relative, point de non-lu ; rappel de cotisation avec bouton « Payer » intégré.
- Champs de saisie : aucun.
- États : chargement / vide « Aucune alerte » / erreur + réessayer / hors-ligne : cache + bandeau.
- Navigation : vient de 🔔 → mène vers B2, B4, B5, T2, T7, T4.
- Comportement web vs PWA : desktop : panneau déroulant sous la cloche + page complète ; PWA : écran ; notifications système si autorisées `[À CONFIRMER : push]`.
- Données/API sous-jacentes : `GET /v1/notifications?page&size`, `GET /v1/notifications/unread-count` (toutes les 60 s et au retour dans l'app), `PATCH /v1/notifications/{id}/read`, `PATCH /v1/notifications/read-all`. Correspondance : paiement reçu / soumis → B4 (gestionnaire) ou B5 ; validé → B5 ; jackpot / répartition → T7 ; retard / rappel → B2 (membre) ou T7 (gestionnaire) ; tour ouvert / bientôt clos / votre tour approche → T7 ; invitation / statut membre → T2.

## Écran : A3 — Paramètres
- Objectif (1 phrase) : Gérer son compte, sa sécurité et le partage.
- Action principale : aucune dominante (liste de réglages).
- Actions secondaires (lignes, par section) :
  - **Compte** : Mes informations · Numéro de téléphone · Changer de compte.
  - **Partager** : Inviter un proche à rejoindre Dinthialma (→ A4).
  - **Support** : Contacter l'assistance `[À CONFIRMER : canal]` · Comment ça marche.
  - **Sécurité** : Modifier mon code secret · Modifier mon mot de passe · Appareils connectés `[À CONFIRMER]`.
  - **Application** : Masquer le montant à l'ouverture (interrupteur) · Installer l'application · Se déconnecter.
- Contenu affiché : en tête : initiales, nom, téléphone, « Gestionnaire de 2 tontines · Membre de 3 » ; version en bas.
- Champs de saisie : feuille « Mes informations » : prénom, nom (2–50), email (facultatif) ; numéro → E4 ; mot de passe → E4 (numéro déjà connu) → E7 ; code → E6 ; feuille « Se déconnecter » : « Garder cet appareil » / « Oublier cet appareil ».
- États : chargement / erreur / succès : toast « Enregistré » ; changement de numéro → reconnexion expliquée / hors-ligne : modifications désactivées.
- Navigation : vient de ⚙ → mène vers E4, E6, E7, A4.
- Comportement web vs PWA : desktop : 2 colonnes ; PWA : liste. « Installer l'application » seulement si possible sur l'appareil.
- Données/API sous-jacentes : `GET /v1/profile`, `PUT /v1/profile` ; `POST /v1/auth/logout` (oublier l'appareil).

## Écran : A4 — Partager
- Objectif (1 phrase) : Inviter quelqu'un en un geste, par QR ou par lien.
- Action principale : « WhatsApp » (message prérempli).
- Actions secondaires : « Copier le lien » ; « Plus » (partage natif du téléphone).
- Contenu affiché : titre selon l'usage (« Inviter un proche » / « Inviter dans Famille ») ; **QR en grand** ; sous le QR : nom de la tontine, montant et rythme (invitation tontine) ; 3 gros boutons.
- Champs de saisie : aucun.
- Messages préremplis : app : « Je gère mes tontines avec Dinthialma, rejoins-moi : <lien> » ; tontine : « Rejoins notre tontine Famille (5.000F / mois) : <lien> ».
- États : chargement : squelette du QR / erreur : « Lien indisponible » + réessayer / succès : toast « Lien copié » / hors-ligne : QR affiché si déjà généré, partage possible.
- Navigation : vient de A1 (Inviter, carte QR > Partager), A3, T2 (+ Membre) → retour.
- Comportement web vs PWA : PWA : partage natif ; desktop : QR + « Copier le lien » + lien WhatsApp web.
- Données/API sous-jacentes : invitation à l'app : lien fixe, aucune API ; invitation tontine : lien `https://<domaine>/q/t/<code>` `[À CONFIRMER : code d'invitation de tontine côté API ; en v1 repli WhatsApp, voir T10]`.

## Écran : A5 — Scanner
- Objectif (1 phrase) : Lire un QR Dinthialma et ouvrir l'écran qui correspond.
- Action principale : viser le QR (lecture automatique).
- Actions secondaires : lampe ; « Saisir un numéro » (si le QR ne passe pas) ; fermer.
- Contenu affiché : vue caméra plein écran, cadre de visée, consigne « Visez le QR Dinthialma ».
- Résultats : QR membre (gestionnaire) → B3 Encaisser prérempli si la personne est membre d'une de mes tontines, sinon T5 Ajouter prérempli ; QR tontine → T10 Invitation (ou T2 si déjà membre) ; QR inconnu → « Ce QR n'est pas un QR Dinthialma ».
- Champs de saisie : aucun (repli : téléphone +221).
- États : chargement caméra / refus caméra : explication + « Saisir un numéro » / erreur de lecture / succès : vibration courte puis écran cible / hors-ligne : lecture possible, écran cible en lecture seule.
- Navigation : vient de la carte QR de A1, de B3 (Scanner) → mène vers B3, T5, T10, T2.
- Comportement web vs PWA : PWA : caméra arrière ; desktop : webcam si disponible, sinon saisie.
- Données/API sous-jacentes : QR membre = lien `https://<domaine>/q/m/<identifiant>` `[À CONFIRMER : identifiant opaque plutôt que le numéro en clair]` ; recherche `GET /v1/users/search?phone=` ; appartenance via `GET /v1/tontines/{id}/membres`.

## Écran : A6 — Historique
- Objectif (1 phrase) : Retrouver tous les mouvements, filtrables.
- Action principale : ouvrir une ligne → B5.
- Actions secondaires : filtres en pastilles (statut : Tous · En attente · Validés · En retard ; type : Paiements · Jackpots) ; filtre tontine (hérité de l'accueil) ; « Exporter » (desktop) `[À CONFIRMER]`.
- Contenu affiché : 3 chiffres en tête (Je cotise : total cotisé, en attente, jackpots reçus ; Je gère : collecté, à valider, en retard) ; liste groupée par mois.
- Champs de saisie : aucun.
- États : chargement / vide « Aucun mouvement » / erreur / hors-ligne : cache.
- Navigation : vient de A1 (Historique, « Tout voir » du fil), feuille Plus → mène vers B5.
- Comportement web vs PWA : desktop : tableau ; PWA : liste, défilement infini.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cotisations?membreId&cycleId&page&size` par tontine ; jackpots `GET /v1/tontines/{id}/cycles/beneficiaires`. `[À CONFIRMER : endpoint agrégé toutes tontines + filtre statut serveur]`.

### Argent

## Écran : B2 — Payer ma cotisation
- Objectif (1 phrase) : Déclarer en quelques secondes que j'ai payé.
- Action principale : « Confirmer mon paiement de 5.000F ».
- Actions secondaires : changer de moyen ; « Ajouter la référence du transfert » ; « Copier le numéro du gestionnaire ».
- Contenu affiché : si plusieurs cotisations dues et filtre « Toutes » → d'abord feuille **« Pour quelle tontine ? »** (cotisations dues en favoris, montant et échéance) ; puis : tontine · tour en petit ; **montant énorme** (fixe) ou pavé numérique (montant libre, minimum affiché) ; 4 grandes tuiles moyen (Wave, Orange Money, Free Money, Espèces), dernier utilisé présélectionné ; encart « Envoyez 5.000F à Moussa Diop · 77 123 45 67 [Copier] » (masqué pour Espèces).
  Parcours type : carte d'action « Payer » (1) → « Confirmer » (2) → reçu.
- Champs de saisie : montant (uniquement si libre : pavé, ≥ minimum) ; moyen (tuiles, obligatoire) ; référence (facultatif, 30 caractères).
- États : chargement « Envoi… » / vide : « Aucun tour ouvert pour cette tontine. Vous serez prévenu. » / erreur : message, saisie conservée / succès : → B5 « En attente de validation » / hors-ligne : bouton désactivé « Connexion requise ».
- Navigation : vient de A1 (carte, grille), A2, T2 → mène vers B5.
- Comportement web vs PWA : desktop : fenêtre 480 px ; PWA : écran plein, retour haptique.
- Données/API sous-jacentes : `POST /v1/tontines/{id}/cotisations` (tour, montant, moyen, référence) ; tour en cours `GET /v1/tontines/{id}/cycles` ; numéro du gestionnaire = créateur de la tontine ; moyens = liste de valeurs « Méthodes de paiement ».

## Écran : B3 — Encaisser un paiement (gestionnaire)
- Objectif (1 phrase) : Enregistrer un paiement reçu, validé immédiatement.
- Action principale : « Encaisser 5.000F ».
- Actions secondaires : « Scanner un QR membre » ; changer de membre, de moyen ; note.
- Contenu affiché : 
  - **Temps 1 « De qui ? »** (gabarit Choisir, sauté si on vient d'un scan ou d'une fiche membre) : champ de recherche avec focus ; ligne « Scanner un QR membre » ; **favoris = membres pas encore payés ce tour** puis les autres ; badge « Sans compte ». Filtre « Toutes » → feuille « Pour quelle tontine ? » avant.
  - **Temps 2 « Combien ? »** : initiales + nom ; montant prérempli énorme (modifiable) ; tuiles moyen (Espèces présélectionné) ; référence et note repliées ; « Le paiement sera validé et le membre prévenu ».
  Parcours type : Encaisser (1) → membre ou scan (2) → « Encaisser » (3).
- Champs de saisie : recherche ; montant (pavé, > 0) ; moyen ; référence, note (facultatifs).
- États : chargement / vide : « Tout le monde a payé ce tour ✓ » / erreur serveur affichée / succès : → B5 « Validé » / hors-ligne : désactivé.
- Navigation : vient de A1, A5, T2, T4, T7 → mène vers B5.
- Comportement web vs PWA : desktop : liste à gauche, formulaire à droite ; PWA : 2 temps plein écran.
- Données/API sous-jacentes : `POST /v1/tontines/{id}/cotisations/admin` ; membres `GET /v1/tontines/{id}/membres` ; payés `GET /v1/tontines/{id}/cotisations?cycleId=…`.

## Écran : B4 — À valider (gestionnaire)
- Objectif (1 phrase) : Valider en série les paiements déclarés.
- Action principale : « Valider » sur chaque ligne (1 tap, sans fenêtre, « Annuler » pendant 5 s).
- Actions secondaires : « Tout valider (6) » (avec confirmation) ; ouvrir le détail (B5) ; « Refuser » `[À CONFIRMER : endpoint]`.
- Contenu affiché : total « 6 paiements · 30.000F » ; groupes par tontine ; ligne : initiales, nom, montant, moyen, référence, date relative, bouton « Valider ». La ligne validée glisse hors de la liste.
- Champs de saisie : aucun.
- États : chargement / vide « Rien à valider ✓ » / erreur : ligne restaurée + message / succès : toast « Paiement de Awa validé · Annuler » ; « Tout valider » → écran succès « 6 paiements validés » / hors-ligne : désactivé.
- Navigation : vient de A1 (carte, grille), A2, T2 → mène vers B5.
- Comportement web vs PWA : desktop : tableau à cases à cocher + « Valider la sélection » ; PWA : liste, balayage à droite = valider.
- Données/API sous-jacentes : `PUT /v1/tontines/{id}/cotisations/{cotisationId}/valider` (envoyé après les 5 s) ; liste via `GET /v1/tontines/{id}/cotisations` filtrée « En attente » pour chaque tontine signalée par `GET /v1/admin/my-dashboard`. `[À CONFIRMER : endpoint transverse « en attente dans mes tontines »]`.

## Écran : B5 — Reçu / Détail d'un paiement
- Objectif (1 phrase) : Prouver et rassurer : quoi, qui, quand, quel statut.
- Action principale : « Terminé » (après une action) ; gestionnaire sur paiement en attente : « Valider ».
- Actions secondaires : « Partager le reçu » (image) ; « Modifier » (gestionnaire, si en attente ou validé sur le tour en cours) ; « Voir la tontine ».
- Contenu affiché : grande icône d'état animée (horloge ambre « En attente de validation », coche verte « Validé », alerte rouge « En retard ») ; montant « 5.000 FCFA » ; tontine · tour ; membre ; moyen ; référence ; date et heure ; « Déclaré par le membre » / « Encaissé par Moussa » ; date de validation.
- Champs de saisie : feuille « Modifier » : montant (pavé), moyen (tuiles), référence, note.
- États : chargement / erreur « Paiement introuvable » / succès : coche animée à l'arrivée ; toast après modification / hors-ligne : reçu depuis le cache.
- Navigation : vient de B2, B3, B4, A1 (fil), A2, A6, T2 → mène vers A1, T2.
- Comportement web vs PWA : desktop : carte centrée ; PWA : plein écran, partage natif.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cotisations/{cotisationId}` ; `PATCH …/cotisations/{cotisationId}` (champs changés) ; `PUT …/valider`.

### Tontines

## Écran : T1 — Mes tontines
- Objectif (1 phrase) : Retrouver une tontine comme on retrouve un service dans un catalogue.
- Action principale : ouvrir une tontine.
- Actions secondaires : recherche ; épingler en favori (appui long ou étoile) ; « Créer ».
- Contenu affiché : recherche en haut ; **Favoris** (tuiles) ; sections **Je gère** · **Je cotise** · **Terminées** (repliée) — en mode filtré, seule la section du mode est ouverte ; tuile/ligne : initiales colorées, nom, « 5.000F / mois », « 10/12 membres », pastille « 3 à valider » ou « À payer ».
- Champs de saisie : recherche (texte).
- États : chargement : tuiles squelettes / vide : « Aucune tontine » + « Créer » + aide QR / erreur + réessayer / hors-ligne : cache.
- Navigation : vient de A1 (grille), feuille « Montants par tontine » → mène vers T2, T9.
- Comportement web vs PWA : desktop : grille 3 colonnes ; PWA : tuiles 4 par ligne pour les favoris, liste pour les sections.
- Données/API sous-jacentes : `GET /v1/tontines?page&size&sort=createdAt,desc` ; « Je gère » = créateur ; favoris mémorisés sur l'appareil `[À CONFIRMER : synchronisation serveur]`.

## Écran : T2 — Fiche Tontine
- Objectif (1 phrase) : Voir l'état d'une tontine et agir en 1 tap.
- Action principale : les **2 boutons pilule** :
  - Je cotise : **« Payer »** (→ B2) · **« Mon tour »** (→ G1 filtré sur la tontine).
  - Je gère : **« Encaisser »** (→ B3) · **« Valider (3) »** (→ B4 filtré). Brouillon : un seul bouton « Lancer la tontine ».
- Actions secondaires : pastille en haut à droite : « + Membre » (gestionnaire → T5 ou A4) / « Infos » (membre → T8 en lecture) ; lignes de la carte ; lignes de l'historique.
- Contenu affiché :
  1. Retour ; initiales colorées + nom ; pastille « Gestionnaire » / « Membre » ; statut si non active ; badge « Lecture seule » (administrateur plateforme).
  2. **Montant énorme** : cagnotte du tour en cours (masquable) ; dessous « Tour 4 · 8/12 ont payé · fin le 30 nov. » ou « J-12 » (événementielle) ; barre de progression.
  3. 2 boutons pilule.
  4. **Carte de lignes** : « Membres (12) › » → T3 ; « Tours › » → T6 ; « Réglages › » (gestionnaire) → T8 ; « Prochain gagnant : Awa » (si connu).
  5. **Historique** des paiements de la tontine (membre : seulement les siens) ; gestionnaire : pastilles de statut ; bouton « Valider » sur les lignes en attente.
- Champs de saisie : aucun.
- États : chargement : squelette / vide historique « Aucun paiement sur ce tour » / erreur « Tontine introuvable » / succès : toasts / hors-ligne : cache, actions désactivées.
- Navigation : vient de T1, A1, A2, A5, T10, P3 → mène vers B2, B3, B4, B5, T3, T5, T6, T8, G1, A4.
- Comportement web vs PWA : desktop : en-tête + montant + boutons à gauche, historique à droite (tableau : membre, montant, moyen, référence, date, statut, saisi par) ; PWA : une colonne.
- Données/API sous-jacentes : `GET /v1/tontines/{id}`, `GET …/cycles`, `GET …/cotisations?cycleId&membreId&page&size`, `GET …/membres` (compteur) ; `PUT /v1/tontines/{id}/activer` (« Lancer », avec confirmation).

## Écran : T3 — Membres d'une tontine
- Objectif (1 phrase) : Voir qui participe et dans quel ordre.
- Action principale : gestionnaire : « + Ajouter » ; membre : aucune.
- Actions secondaires : recherche ; tap sur un membre → T4 (gestionnaire).
- Contenu affiché : liste par ordre de passage : n°, initiales, nom, statut (Actif / Suspendu / Sorti), « A reçu ✓ », « Sans compte », « Payé ce tour ✓ / Pas encore ».
- Champs de saisie : recherche.
- États : chargement / vide « Ajoutez vos premiers membres » + bouton / erreur / hors-ligne : cache.
- Navigation : vient de T2, A1 (grille Je gère « Membres ») → mène vers T4, T5.
- Comportement web vs PWA : desktop : panneau ou tableau ; PWA : liste.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/membres?sort=ordreJackpot,asc`.

## Écran : T4 — Membre (fiche)
- Objectif (1 phrase) : Voir la situation d'un membre et agir.
- Action principale : « Encaisser » (si non payé ce tour).
- Actions secondaires : « Appeler » / « WhatsApp » ; zone **Actions sensibles** : « Suspendre » / « Réactiver », « Retirer de la tontine » (rouge, confirmation).
- Contenu affiché : initiales, nom, téléphone, « Sans compte » ; position n° ; statut ; « A reçu le jackpot le 12 oct. » ; compteurs Validés / En attente / En retard ; **total versé** ; historique de ses paiements.
- Champs de saisie : aucun.
- États : chargement / vide « Aucun paiement » / erreur / succès : toast / hors-ligne : désactivé.
- Navigation : vient de T3, T7 → mène vers B3, B5.
- Comportement web vs PWA : desktop : panneau latéral ; PWA : plein écran.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cotisations?membreId=…` ; `GET …/cotisations/recap-total` ; `PATCH …/membres/{membreId}/statut` ; `DELETE …/membres/{membreId}`.

## Écran : T5 — Ajouter un membre
- Objectif (1 phrase) : Ajouter quelqu'un avec son numéro, ses contacts ou son QR.
- Action principale : « Ajouter ».
- Actions secondaires : « Scanner son QR » ; « Choisir dans mes contacts » (si possible) ; « Envoyer une invitation » (→ A4) ; « Ajouter un autre ».
- Contenu affiché (gabarit Choisir) : champ « Qui ? » avec focus ; lignes « + Saisir un nouveau numéro », « Scanner son QR », « Envoyer une invitation » ; favoris = membres de mes autres tontines ; après saisie : **trouvé** → carte (nom) ; **introuvable** → prénom + nom + « Il recevra un SMS d'invitation » ; « Choisir sa position (facultatif) » replié.
- Champs de saisie : téléphone (+221) ; prénom, nom (≥ 2) ; position (entier > 0, facultatif).
- États : recherche en cours dans le champ / erreurs « Déjà membre », « Position déjà prise », tontine complète / succès : « Awa ajoutée · SMS envoyé » + « Ajouter un autre » / hors-ligne : désactivé.
- Navigation : vient de T2, T3, A5 → retour T3.
- Comportement web vs PWA : desktop : fenêtre ; PWA : plein écran.
- Données/API sous-jacentes : `GET /v1/users/search?phone=` (404 = introuvable) ; `POST /v1/tontines/{id}/membres`.

## Écran : T6 — Tours d'une tontine
- Objectif (1 phrase) : Voir tous les tours, passés et à venir.
- Action principale : gestionnaire en mode manuel sans tour en cours : « Démarrer le tour suivant ».
- Actions secondaires : tap sur un tour → T7.
- Contenu affiché : tour en cours épinglé (progression) ; puis liste : n°, dates, statut, gagnant(s), montant net.
- Champs de saisie : feuille « Démarrer un tour » : dates début / fin (fin > début, préremplies selon le rythme).
- États : chargement / vide « Aucun tour pour l'instant » / erreur / hors-ligne : cache.
- Navigation : vient de T2, A1 (grille Je gère « Tours ») → mène vers T7.
- Comportement web vs PWA : desktop : liste + détail à droite ; PWA : liste.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cycles?sort=numeroCycle,asc` ; `POST /v1/tontines/{id}/cycles`.

## Écran : T7 — Tour
- Objectif (1 phrase) : Suivre un tour jusqu'au versement du jackpot.
- Action principale (selon l'état) : en cours → « Clôturer le tour » ; terminé sans gagnant → « Désigner le gagnant » ; à venir (manuel) → « Démarrer ce tour » ; terminé → aucune.
- Actions secondaires : « Encaisser » sur un retardataire ; « Tirage au sort » ; ouvrir un paiement.
- Contenu affiché : « Tour 4 · 1er → 30 nov. » + statut ; anneau « 8/12 ont payé », « 40.000F collectés sur 60.000F » ; listes **Pas encore payé** (bouton Encaisser) puis **Payé** ; après clôture : jackpot brut, commission, net ; gagnant(s) et montant ; événementielle : répartition finale par membre. Membre : progression, sa situation, gagnant.
- Champs de saisie : feuille « Désigner le gagnant » : 1 à N membres n'ayant pas encore gagné.
- États : chargement / vide « Personne n'a encore payé » / erreur / succès : clôture → écran résultat avec confettis légers « Jackpot de 57.000F pour Awa » / hors-ligne : désactivé.
- Navigation : vient de T6, A1, A2 → mène vers B3, B5, T4.
- Comportement web vs PWA : desktop : 2 colonnes ; PWA : une colonne.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cycles/{cycleId}` ; `GET …/cotisations/recap/{cycleId}` ; `PUT …/cycles/{cycleId}/cloturer` (confirmation « Le jackpot sera calculé et les paiements non validés passeront en retard. ») ; `PATCH …/cycles/{cycleId}/beneficiaire` (liste vide = tirage, avec confirmation).

## Écran : T8 — Réglages / Infos de la tontine
- Objectif (1 phrase) : Consulter les règles et, pour le gestionnaire, les ajuster.
- Action principale : gestionnaire : « Enregistrer » (si modification) ; membre : aucune.
- Actions secondaires (gabarit Paramètres) : sections **Règles** · **Commissions** (ajouter / modifier / supprimer) · **Partager** (QR d'invitation → A4) · **Actions sensibles** (Suspendre / Relancer, Supprimer le brouillon).
- Contenu affiché : type, montant, rythme, membres max, gagnants par tour, ordre, tours auto/manuels, date de début, événement ; gestionnaire (nom, téléphone, appeler) ; dates.
- Champs de saisie : feuille Commission : type (% du jackpot / frais fixes par tour / frais d'adhésion), valeur (numérique, % ou F), description ; brouillon : mêmes champs que T9.
- États : chargement / vide « Aucune commission » / erreur / succès toast / hors-ligne : lecture seule.
- Navigation : vient de T2 → retour T2.
- Comportement web vs PWA : desktop : panneau latéral ; PWA : plein écran.
- Données/API sous-jacentes : `GET /v1/tontines/{id}` ; `PUT`/`DELETE /v1/tontines/{id}` (brouillon) ; `PUT …/suspendre`, `PUT …/activer` ; `GET/POST …/commissions`, `PUT/DELETE …/commissions/{commissionId}`.

## Écran : T9 — Créer une tontine
- Objectif (1 phrase) : Créer une tontine en répondant à quelques questions simples.
- Action principale : « Continuer » puis « Créer la tontine ».
- Actions secondaires : retour ; « Plus d'options ».
- Contenu affiché :
  1. **« Pour quoi cotisez-vous ? »** (gabarit Question unique) : grille 3×3 de grandes icônes : Tontine classique · Tabaski · Mariage · Baptême · Famille · Business · Études · Voyage · Autre. Bouton désactivé tant que rien n'est choisi. Le choix fixe le type (classique / famille / business = rotative ; événements = événementielle) et propose un nom (« Tabaski 2027 »).
  2. **« Combien et à quel rythme ? »** : montant (pavé), rythme en pastilles (Jour · Semaine · 2 semaines · Mois · Trimestre) ; événementielle : date de l'événement, montant fixe ou libre (interrupteur) + minimum.
  3. **« Combien de membres ? »** (rotative) : stepper 2–100 + date de début. « Plus d'options » : gagnants par tour (1), ordre (ordre d'arrivée / tirage / choix), tours auto ou manuels, description.
  4. **Récapitulatif** : « 12 membres cotisent 5.000F par mois. Chaque mois, 1 membre reçoit 60.000F. » + nom modifiable.
- Champs de saisie : nom (2–150) ; montant (> 0) ; membres (stepper) ; dates (sélecteur natif) ; options.
- États : chargement « Création… » / erreur par champ, saisie conservée / succès : « Tontine créée ✓ » + « Inviter des membres » (→ A4 / T5) + « Voir la tontine » / hors-ligne : brouillon local conservé.
- Navigation : vient de A1 (grille, carte), T1 → mène vers T2, T5, A4.
- Comportement web vs PWA : desktop : fenêtre large, récapitulatif en direct à droite ; PWA : une question par écran.
- Données/API sous-jacentes : `POST /v1/tontines` ; listes `GET /v1/code-list/type/FREQUENCE_TONTINE`, `…/ORDRE_BENEFICIAIRE`. Mode « Je gère » disponible tout de suite `[À CONFIRMER : droits de gestionnaire sans reconnexion]`.

## Écran : T10 — Invitation à une tontine
- Objectif (1 phrase) : Permettre à une personne qui a scanné un QR ou reçu un lien de rejoindre la tontine.
- Action principale : « Demander à rejoindre » ; en v1 : « Écrire au gestionnaire sur WhatsApp ».
- Actions secondaires : « Se connecter » / « Créer un compte » (si pas connecté) ; « Voir la tontine » (si déjà membre).
- Contenu affiché : initiales + nom de la tontine ; montant et rythme ; gestionnaire (prénom) ; places restantes ; message v1 prérempli « Bonjour, je souhaite rejoindre la tontine Famille. Mon numéro : 77 … ».
- Champs de saisie : aucun.
- États : chargement / lien invalide ou expiré : « Cette invitation n'est plus valable » / tontine complète : « Plus de place » / succès : « Demande envoyée, le gestionnaire va vous ajouter » / hors-ligne : message.
- Navigation : vient de A5, d'un lien externe (navigateur ou app) → mène vers E1/E2, T2, WhatsApp.
- Comportement web vs PWA : s'ouvre aussi dans un navigateur sans l'app ; propose d'installer l'app.
- Données/API sous-jacentes : `[À CONFIRMER v2]` aperçu public d'une tontine par code + demande d'adhésion (la demande arrive dans B4 côté gestionnaire). v1 : la page s'appuie sur les informations contenues dans le lien et sur WhatsApp.

### Gains

## Écran : G1 — Mes jackpots
- Objectif (1 phrase) : Voir ce que j'ai reçu et quand je recevrai mon prochain jackpot.
- Action principale : aucune dominante (consultation) ; tap sur une carte → T7.
- Actions secondaires : filtre tontine (hérité).
- Contenu affiché (gabarit Gains) : bandeau clair « JACKPOTS REÇUS » + montant énorme « 120.000F » ; bandeau d'info jaune « Votre prochain tour : décembre · Famille (≈ 60.000F) » ; section **À venir** (mes prochains tours par tontine, position et date estimée) ; section **Reçus** (cartes : tontine, tour, date, montant) ; répartitions finales des tontines événementielles.
- Champs de saisie : aucun.
- États : chargement / vide : « Pas encore de jackpot · Votre tour arrive en décembre » / erreur / hors-ligne : cache.
- Navigation : vient de A1 (grille), T2 (« Mon tour »), feuille « Montants par tontine » → mène vers T7.
- Comportement web vs PWA : desktop : bandeau + 2 colonnes (À venir / Reçus) ; PWA : une colonne.
- Données/API sous-jacentes : `GET /v1/tontines/{id}/cycles/beneficiaires` par tontine ; position via `GET /v1/tontines/{id}/membres` (ordre de passage). Date estimée calculée à partir du rythme `[À CONFIRMER]`.

### Plateforme (administrateur)

## Écran : P1 — Accueil plateforme
- Objectif (1 phrase) : Voir la santé de la plateforme.
- Action principale : « Voir les paiements en retard » (si > 0), sinon « Voir les utilisateurs ».
- Actions secondaires : accès Utilisateurs, Tontines, Paiements, Listes de valeurs.
- Contenu affiché : « Collecté ce mois » ; utilisateurs (total, 24 h, mois) ; tontines par statut ; paiements en attente / en retard ; activité 24 h ; 5 dernières tontines.
- Champs de saisie : aucun.
- États : chargement / zéros explicites / erreur « Accès refusé » ou réessayer / hors-ligne : cache.
- Navigation : vient de la case « Plateforme » de A1 → mène vers P2–P5.
- Comportement web vs PWA : desktop d'abord, barre latérale ; mobile : une colonne.
- Données/API sous-jacentes : `GET /v1/admin/dashboard`, `GET /v1/tontines?size=5`.

## Écran : P2 — Utilisateurs
- Objectif (1 phrase) : Trouver un compte et le gérer.
- Action principale : ouvrir un utilisateur (feuille détail).
- Actions secondaires : filtres (Tous · Inscrits · En attente d'activation ; rôle) ; recherche ; dans la feuille : « Désactiver » / « Réactiver », « Modifier les rôles ».
- Contenu affiché : liste (initiales, nom, téléphone, rôles en mots simples, statut, inscription) ; feuille : infos, tontines, rôles.
- Champs de saisie : recherche ; rôles en cases (Membre, Gestionnaire, Administrateur plateforme).
- États : chargement / vide / erreur / succès toast / hors-ligne : lecture seule.
- Navigation : vient de P1.
- Comportement web vs PWA : desktop : tableau + panneau ; mobile : liste + feuille.
- Données/API sous-jacentes : `GET /v1/admin/dashboard/users?page&size&accountStatus`, `GET …/users/{id}`, `PUT …/{id}/roles`, `POST …/{id}/enable` / `…/disable` (confirmation).

## Écran : P3 — Tontines (plateforme)
- Objectif (1 phrase) : Superviser toutes les tontines.
- Action principale : ouvrir une tontine (→ T2 en lecture seule).
- Actions secondaires : filtre statut ; recherche.
- Contenu affiché : nom, type, gestionnaire, montant, rythme, membres, début, statut.
- Champs de saisie : recherche.
- États : chargement / vide / erreur + réessayer / hors-ligne.
- Navigation : vient de P1, P4 → mène vers T2.
- Comportement web vs PWA : tableau / cartes.
- Données/API sous-jacentes : `GET /v1/admin/dashboard/tontines?page&size&statut`.

## Écran : P4 — Paiements (plateforme)
- Objectif (1 phrase) : Contrôler les paiements de la plateforme.
- Action principale : ouvrir un paiement (→ B5 en lecture seule).
- Actions secondaires : filtres statut et tontine.
- Contenu affiché : membre, téléphone, tontine, montant, moyen, date, statut.
- Champs de saisie : sélection de tontine avec recherche.
- États : chargement / vide « Aucun paiement pour ces filtres » / erreur + réessayer / hors-ligne.
- Navigation : vient de P1 → mène vers B5, P3.
- Comportement web vs PWA : tableau / cartes.
- Données/API sous-jacentes : `GET /v1/admin/dashboard/contributions?page&size&statut&tontineId`.

## Écran : P5 — Listes de valeurs
- Objectif (1 phrase) : Gérer les valeurs proposées dans l'app.
- Action principale : « Ajouter une valeur ».
- Actions secondaires : modifier (valeurs système verrouillées).
- Contenu affiché : onglets (Rythmes, Moyens de paiement, Statuts de paiement, Ordre des gagnants, Rôles internes) ; libellé, code, cadenas « Système ».
- Champs de saisie : catégorie ; code (1–100, majuscules, unique) ; libellé (1–500).
- États : chargement / vide / erreur / succès / hors-ligne lecture seule.
- Navigation : vient de P1.
- Comportement web vs PWA : desktop recommandé.
- Données/API sous-jacentes : `GET /v1/code-list?page&size`, `POST /v1/code-list`, `PUT /v1/code-list/{id}`.

---

## 6. Feuilles (bottom sheets) réutilisables

| Feuille | Contenu | Ouverte depuis |
|---|---|---|
| **Montants par tontine** | Je cotise : une ligne par tontine (initiales, nom, total cotisé, « 4/12 tours payés », barre) + « Jackpots reçus » (→ G1). Je gère : collecté / attendu, à valider. Tap → T2 | Montant de A1 |
| **Plus de services** | Historique · Mes jackpots (Je gère) · Récapitulatifs · Alertes · Comment ça marche · Installer l'app · Plateforme (admin) | Case « Plus » |
| **Pour quelle tontine ?** | Gabarit Choisir : recherche, tontines concernées en favoris (la plus urgente en tête) | Filtre de A1, Payer, Encaisser, Membres, Tours, QR d'invitation |
| **Confirmation** | Question (« Clôturer le tour 4 ? »), conséquence en 1 phrase, bouton explicite, « Annuler » | Actions sensibles |
| **Modifier un paiement** | Montant, moyen, référence, note | B5 |
| **Démarrer un tour** | Dates | T6, T7 |
| **Désigner le gagnant** | Sélection 1 à N membres | T7 |
| **Commission** | Type, valeur, description | T8 |
| **Mes informations** | Prénom, nom, email | A3 |
| **Se déconnecter** | Garder / Oublier cet appareil | A3 |
| **Rôles d'un utilisateur** | Cases à cocher | P2 |
| **Valeur de liste** | Catégorie, code, libellé | P5 |

---

## 7. Composants réutilisables

| Composant | Règles |
|---|---|
| **Bandeau d'accueil** | Fond vert, ⚙ et 🔔 (badge) 48 px, bascule 2 segments avec pastille, filtre « ▾ », libellé en capitales espacées, montant 44 px gras, œil |
| **Bascule de mode** | 2 segments « Je cotise / Je gère », pastille rouge numérotée sur le segment inactif |
| **Carte QR** | QR 140 px sur fond blanc, titre, bouton « Scanner » ; tap → plein écran avec luminosité maximale et « Partager » |
| **Carte d'action** | Fond blanc, 1 ligne d'info + 1 bouton ; variante « Tout est à jour ✓ » sans bouton |
| **Case de service** | Cercle 64 px couleur pastel + pictogramme, libellé 13 px en 1 mot, badge optionnel ; grille 4 × 2 |
| **Ligne d'activité** | Libellé gras, date « 10 nov., 23:05 », montant à droite, pastille de statut ; hauteur ≥ 64 px |
| **Montant** | « 85.000F » à l'écran (point de milliers, F collé), « 85.000 FCFA » sur les reçus ; jamais de « - » pour une cotisation ; « + » vert pour un jackpot ; masquable par points |
| **Boutons pilule** | 2 côte à côte, hauteur 56 px, icône + verbe, couleur d'action |
| **Bouton principal / secondaire / dangereux** | 56 / 48 px, coins très arrondis, chargement et désactivé (avec raison) |
| **Carte de lignes** | Lignes icône + libellé + valeur + chevron, dans une carte blanche arrondie |
| **Section de paramètres** | Titre gris 14 px au-dessus d'une carte blanche de lignes |
| **Champ « Choisir »** | Libellé court (« De », « Pour », « Qui ») au-dessus d'un champ souligné, focus et clavier immédiats |
| **Ligne « + nouveau » / « Scanner »** | Cercle d'action 56 px + libellé |
| **Tuile catalogue** | Initiales colorées 56 px + nom sur 2 lignes max |
| **Grille « question unique »** | Cercles 96 px + libellé, 3 colonnes, sélection marquée, bouton bas désactivé tant que rien n'est choisi |
| **Pavé numérique** | Touches 64 px ; variante montant avec séparateur de milliers |
| **Champ téléphone** | Préfixe +221 fixe, format « 77 123 45 67 » |
| **Champ code SMS** | 6 cases, collage, remplissage automatique, renvoi temporisé |
| **Tuiles moyen de paiement** | Grille 2 × 2, pictogramme générique + nom, coche de sélection |
| **Pastille de statut** | Icône + mot + couleur |
| **Anneau / barre de progression** | Toujours avec la valeur en texte (« 8/12 ») |
| **Écran de reçu / succès** | Icône animée, montant, détails, « Partager », « Terminé » |
| **Écran Partager** | QR, titre, 3 boutons (WhatsApp, Copier, Plus) |
| **Vue scanner** | Caméra plein écran, cadre, lampe, repli « Saisir un numéro » |
| **Toast avec « Annuler »** | 5 s, en bas |
| **Squelettes, états vides, bandeau hors-ligne** | Formes grises ; 1 phrase + 1 bouton ; « Hors connexion · mis à jour à 14:30 » |
| **Tableau responsive** | Devient liste de cartes sous 768 px |

---

## 8. Règles de design globales

### Grille et espacements
- Base **8 px** (demi-pas 4) : 4 · 8 · 12 · 16 · 24 · 32 · 48.
- Marges latérales mobile 16 px ; fond gris clair avec cartes blanches arrondies (rayon 16 px) espacées de 16 px.
- Desktop : contenu max 1 200 px ; formulaires max 480 px.

### Typographie
- Une famille sans empattement très lisible (Inter ou système).
- Montant du bandeau 44 px gras ; montant de fiche 40 px ; titre d'écran 22 px ; section 17 px ; corps 16 px ; secondaire 14 px ; légende 13 px minimum.
- Chiffres tabulaires pour les montants.

### Couleurs
- **Couleur d'action unique** : vert profond `#15803D` (bandeau, boutons, texte blanc dessus — contraste ≥ 4,5:1). Vert pâle `#DCFCE7` pour les sélections.
- Fond `#F2F3F5`, cartes `#FFFFFF`, texte `#111827`, secondaire `#4B5563`, séparateurs `#E5E7EB`.
- Cercles de la grille : pastels variés (vert, bleu, ambre, violet, rose, gris), pictogrammes foncés.
- Statuts : Validé `#15803D` / `#DCFCE7` ; En attente `#92400E` / `#FEF3C7` ; En retard `#B91C1C` / `#FEE2E2` ; À venir `#4B5563` / `#F3F4F6` ; Jackpot `#A16207` / `#FEF9C3`.
- Couleurs en jetons (mode sombre prévu plus tard, non livré en v1).
- Aucune couleur, mascotte ou illustration empruntée à une autre application.

### Icônes
- Pictogrammes de la grille : style plein et coloré, simples, cohérents entre eux (pas d'emoji système).
- Icônes d'interface : trait 2 px, 24 px.

### Micro-animations
- 150–250 ms, ease-out. Appui : échelle 0,97. Feuilles qui montent du bas. Montant qui apparaît/disparaît en fondu avec l'œil. Ligne validée qui glisse. Coche du reçu dessinée en 400 ms. Confettis légers (≤ 1,5 s) pour un jackpot. Secousse + vibration pour un code faux. Respect de « réduire les animations ».

### Accessibilité
- Zones tactiles ≥ 48 px, espacées ≥ 8 px ; contraste ≥ 4,5:1 ; texte agrandissable à 200 %.
- Statuts jamais portés par la seule couleur ; montant masqué lu « montant masqué » ; montants lus « 5 000 francs CFA ».
- Libellés pour toutes les icônes (⚙ « Paramètres », 🔔 « Alertes, 3 non lues »), annonces des toasts, focus visible au clavier, Échap ferme les feuilles.
- Phrases de moins de 12 mots, vocabulaire constant.

### Réseau faible et hors-ligne
- Cache affiché d'abord avec l'heure, puis rafraîchi ; squelettes ; le QR membre reste affichable hors connexion.
- Hors connexion : consultation possible ; payer, encaisser, valider, clôturer, créer **désactivés** avec « Connexion requise ».
- Premier écran utile en moins de 2 s en 3G ; illustrations en SVG légers.

### Web (desktop) vs PWA (mobile)
- PWA : accueil-hub plein écran, feuilles du bas, tirer pour rafraîchir, retour haptique, caméra pour le scanner, partage natif, remplissage auto du code SMS, invitation discrète à installer l'app.
- Desktop : même hub réorganisé en colonnes (bandeau + cartes + grille à gauche, fil au centre, tontines à droite) ; fiches en panneaux latéraux ; tableaux ; console plateforme avec barre latérale ; raccourci « / » pour rechercher.
