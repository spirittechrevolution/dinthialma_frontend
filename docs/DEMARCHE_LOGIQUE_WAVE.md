# Démarche — appliquer la logique Wave à Dinthialma

> Objectif : un utilisateur habitué à Wave doit se sentir « chez lui » dans Dinthialma : mêmes réflexes, mêmes emplacements, même rythme, mais pour **cotiser, encaisser, suivre ses tours et recevoir son jackpot**.
> On reprend la **logique d'usage**, pas l'identité : ni le bleu Wave, ni la mascotte, ni les illustrations, ni le nom « Coffre ». Dinthialma garde son vert et son vocabulaire.
>
> Sources : 9 captures distinctes du dossier `screenWave/` + `docs/INVENTAIRE_FONCTIONNALITES.md` (59 fonctionnalités) + `docs/BRIEF_ECRANS.md`.

---

## 1. Ce que les captures nous apprennent : les 8 gabarits Wave

| # | Gabarit Wave (capture) | Ce qu'on observe | Règle à retenir |
|---|---|---|---|
| G1 | **Accueil-hub** (Accueil, captures 2 et 3) | Pas de barre d'onglets en bas. Bandeau coloré en haut : réglages (roue dentée) à gauche, **solde masqué par des points + œil**. Une **carte centrale** = l'action n°1 (Scanner). **Grille de 8 services** (icônes rondes colorées + 1 mot), dont « Plus ». En dessous, **le fil d'activité directement sur l'accueil**, défilement infini. | L'accueil **est** l'application. Tout part d'ici, tout revient ici. |
| G2 | **Feuille « Plus de services »** (capture 2) | Feuille du bas sur l'accueil grisé, 4 icônes de services secondaires, croix de fermeture. | Le secondaire est **caché mais à 1 tap**, sans écran supplémentaire. |
| G3 | **Choisir un destinataire** (« Envoyer de l'argent », « Achat crédit ») | Titre = verbe. Champ **« À »** avec focus immédiat (clavier ouvert). Ligne « + Saisir un nouveau numéro », « Scanner pour envoyer ». **Favoris** (nom + numéro). | Toute action d'argent commence par **« à qui / pour quoi ? »**, avec les choix récents tout de suite. |
| G4 | **Fiche d'un compte d'épargne** (« Coffre ») | Retour + action secondaire en pastille en haut à droite (« Ajouter »). Icône + nom, **montant énorme** (masquable). **2 gros boutons pilule** côte à côte (Garder / Récupérer). Carte de réglages (ligne + interrupteur). **Historique** des mouvements en dessous. | Un objet = son montant + **2 actions** + ses réglages + son historique, **sur un seul écran**. |
| G5 | **Choix de l'objectif** (« À quoi servira votre Coffre ? ») | Une seule question, grille 3×3 de grandes icônes, un seul bouton en bas, désactivé tant que rien n'est choisi. | Créer = **répondre à une question simple**, pas remplir un formulaire. |
| G6 | **Gains** (« Gains déjà versés ») | Bandeau clair, **montant cumulé énorme**, bandeau d'information jaune, cartes de récompenses. | Ce qu'on a gagné est **mis en scène**, séparé des dépenses. |
| G7 | **Catalogue** (« Paiements ») | Recherche en haut, **Favoris**, puis catégories (Factures, Recharges, Éducation…) en grilles de tuiles, « Voir tout ». | Une longue liste devient **recherche + favoris + catégories**. |
| G8 | **Paramètres** | Sections titrées en gris (Compte, Partager, Support, Sécurité), lignes icône + libellé dans des cartes blanches arrondies. | Tout le reste va **ici**, rangé par intention. |

Constantes transverses : très peu de texte, montants au format « 350.000F », dates « 07 nov., 20:40 », une couleur d'action, gros boutons arrondis, fond gris clair avec cartes blanches, aucun menu caché derrière une icône « ☰ ».

---

## 2. La démarche en 6 étapes

### Étape 1 — Traduire chaque gabarit Wave en équivalent Dinthialma *(½ jour)*
Pour chaque gabarit G1–G8, répondre à : « Quel est l'objet Dinthialma qui joue ce rôle ? ». Résultat : la **table de traduction** (§3). C'est elle qui garantit que l'utilisateur retrouve ses réflexes.

### Étape 2 — Qualifier les 59 fonctionnalités *(½ jour)*
Pour chaque fonctionnalité de l'inventaire, noter 4 attributs :
1. **Qui** : membre / gestionnaire / administrateur plateforme / tous.
2. **Fréquence** : élevée / moyenne / rare (déjà dans l'inventaire).
3. **Nature** : *argent* (payer, encaisser, valider) · *consulter* (voir un état, un historique) · *gérer* (membres, tours) · *configurer* (règles, compte, sécurité) · *système* (invisible).
4. **Objet porteur** : l'application, une tontine, un tour, un membre, un paiement, le compte.

### Étape 3 — Appliquer l'arbre de décision *(½ jour)*
Chaque fonctionnalité passe dans cet arbre ; la **première** réponse « oui » donne son emplacement.

```
1. Invisible pour l'utilisateur ?                         → SYSTÈME (aucun écran)
2. Action d'argent la plus fréquente pour ce profil ?     → CARTE CENTRALE de l'accueil (G1)
3. Action ou consultation fréquente, transverse ?         → GRILLE DE SERVICES de l'accueil (8 cases max, G1)
4. Événement passé (paiement, validation, jackpot) ?      → FIL D'ACTIVITÉ de l'accueil (G1) → reçu
5. Concerne une seule tontine ?                           → FICHE TONTINE (G4) :
      a. action fréquente                                 →   un des 2 boutons pilule
      b. consultation / gestion                           →   ligne de la carte « réglages » ou historique
      c. action sensible ou rare                          →   écran Réglages de la tontine (G8)
6. Commence par « à qui / pour quelle tontine ? »         → écran CHOISIR (G3)
7. Création                                               → QUESTION UNIQUE + grille (G5)
8. Ce que j'ai gagné                                      → écran GAINS (G6)
9. Utile mais peu fréquent, transverse                    → feuille PLUS DE SERVICES (G2)
10. Compte, sécurité, aide, partage                       → PARAMÈTRES (G8)
11. Administrateur plateforme uniquement                  → CONSOLE desktop (accessible par une case « Plateforme »)
```

Règles de garde :
- **Budget de la grille : 8 cases**, dont « Plus ». Si plus de 7 candidats, on garde les 7 plus fréquents pour **ce profil** ; les autres vont dans « Plus ».
- **2 boutons pilule maximum** par fiche.
- **Une fonctionnalité = un seul emplacement principal** (+ éventuellement un raccourci contextuel, jamais plus). Fin des 5 points d'entrée actuels pour « payer ».
- **Aucune fonctionnalité inachevée visible** (ex. « Rejoindre par code » tant que l'API n'existe pas).

### Étape 4 — Remplir la table de répartition *(1 jour)*
Résultat : §4 (proposition initiale, à valider en atelier avec 1 gestionnaire et 2 membres réels).

### Étape 5 — Prototyper et tester *(2–3 jours)*
- Maquette cliquable basse fidélité des 8 écrans-clés : Accueil (membre / gestionnaire), Plus, Choisir, Fiche tontine, Créer, Gains, Paramètres.
- Test avec **5 utilisateurs Wave** (3 membres, 2 gestionnaires), 6 tâches chronométrées :
  1. Payer sa cotisation du mois — cible ≤ 3 taps.
  2. Retrouver combien on a déjà cotisé — ≤ 2 taps.
  3. Savoir quand on touche son jackpot — ≤ 2 taps.
  4. (Gestionnaire) Valider les paiements en attente — ≤ 2 taps par paiement.
  5. (Gestionnaire) Encaisser 5 000 F en espèces d'un membre — ≤ 3 taps.
  6. Changer son code secret — ≤ 3 taps.
- Critère de réussite : tâche réussie sans aide par 4 personnes sur 5. Sinon on déplace la fonctionnalité dans l'arbre et on reteste.

### Étape 6 — Mettre à jour le brief *(½ jour)*
Remplacer dans `docs/BRIEF_ECRANS.md` la navigation « barre du bas à 4 onglets » par le **modèle Accueil-hub** (§5), puis régénérer les écrans avec l'IA.

---

## 3. Table de traduction Wave → Dinthialma

| Gabarit Wave | Équivalent Dinthialma | Contenu |
|---|---|---|
| **G1 Accueil-hub** | **Accueil** | Bandeau vert : roue dentée (Paramètres) à gauche, cloche (Alertes) à droite. Montant masquable par l'œil : **« Total cotisé »** (membre) ou **« Collecté ce tour »** (gestionnaire). **Carte centrale** = action n°1 du moment (voir §5). **Grille de 8 services**. **Fil d'activité** de toutes mes tontines. |
| Carte « Scanner » | **Carte « À payer »** ; option **« Mon QR membre »** | La carte montre la prochaine cotisation (« 5.000F · Tontine Famille · avant le 15 nov. ») et se touche pour payer. Option : un QR personnel que le gestionnaire scanne pour encaisser en espèces sans chercher le nom `[À CONFIRMER : le QR ne contient que le numéro, aucune évolution API nécessaire ; accès caméra requis]`. |
| **G2 Plus de services** | **Plus** | Services secondaires (§4). |
| **G3 Choisir un destinataire** | **Payer → « Pour quelle tontine ? »**, **Encaisser → « De qui ? »**, **Ajouter un membre → « Qui ? »** | Champ de recherche avec focus, « + Saisir un nouveau numéro », « Scanner un QR membre », puis **Favoris** = cotisations dues / membres pas encore payés / contacts récents. |
| **G4 Fiche Coffre** | **Fiche Tontine** | Icône/initiales + nom, **montant énorme** (cagnotte du tour en cours, masquable). **2 boutons pilule** : membre « Payer » / « Mon tour » ; gestionnaire « Encaisser » / « Valider (3) ». Carte de lignes : Membres · Tours · Réglages. **Historique des paiements** de la tontine. Pastille en haut à droite : « + Membre » (gestionnaire) ou « Infos » (membre). |
| **G5 À quoi servira votre Coffre ?** | **« Pour quoi cotisez-vous ? »** | Grille : Tontine classique (chacun son tour) · Tabaski · Mariage · Baptême · Famille · Business · Études · Voyage · Autre. Le choix fixe le **type** (rotative ou événementielle) et propose un nom et un rythme par défaut. Puis 2 questions courtes (montant, combien de membres / date) + récapitulatif. |
| **G6 Gains déjà versés** | **Mes gains** | « JACKPOTS REÇUS 120.000F » ; bandeau d'information « Votre prochain tour : décembre (Tontine Famille) » ; cartes par jackpot (tontine, tour, date, montant). |
| **G7 Catalogue Paiements** | **Mes tontines** | Recherche, **Favoris** (tontines épinglées), sections « Je gère » · « Je participe » · « Terminées » en tuiles, « Voir tout ». |
| **G8 Paramètres** | **Paramètres** | Sections Compte · Partager · Support · Sécurité · Application (§4). |
| Historique en bas des fiches | **Fil d'activité / historique** | Une ligne = libellé, date « 07 nov., 20:40 », montant à droite, **statut** (en attente / validé / en retard). Tap → **reçu**. |

Adaptations nécessaires par rapport à Wave (spécifiques aux tontines) :
- Wave affiche les sorties d'argent en « -550F ». Dinthialma : une cotisation est une **épargne**, pas une perte → montant sans signe, icône « ↑ cotisation », et le jackpot reçu en vert « +57.000F ».
- Wave n'a pas d'état « en attente de validation » visible ; Dinthialma doit toujours afficher le **statut** sur chaque ligne d'activité.
- Le gestionnaire a un deuxième métier (encaisser / valider) : sa carte centrale et sa grille changent, mais **l'écran est le même**.

---

## 4. Répartition des 59 fonctionnalités (proposition initiale)

### 4.1 Accueil — carte centrale (une seule action, choisie automatiquement)
| Priorité | Situation | Carte centrale | Fonctionnalité |
|---|---|---|---|
| 1 | Gestionnaire avec paiements à valider | « 3 paiements à valider » | F37 Valider |
| 2 | Membre avec cotisation due | « À payer 5.000F · Tontine Famille » | F34 Déclarer un paiement |
| 3 | Gestionnaire, tour en cours, membres non payés | « 4 membres n'ont pas payé · Encaisser » | F38 / F40 |
| 4 | Tout est à jour | « Tout est à jour ✓ · Prochain tour le 1er déc. » | F28 (consultation) |
| 5 | Aucune tontine | « Créer ma première tontine » | F13 / F18 |

### 4.2 Accueil — grille de 8 services (adaptée au profil)
> ⚠️ Remplacé par la bascule « Je cotise / Je gère » : voir §6.3 (une grille par mode).

| Case | Membre | Gestionnaire (souvent aussi membre) | Fonctionnalités |
|---|---|---|---|
| 1 | **Payer** | **Encaisser** | F34 / F38 |
| 2 | **Mes tontines** | **Mes tontines** | F19, F20, F21 |
| 3 | **Mes gains** | **À valider** (badge) | F33 / F37 |
| 4 | **Mon tour** (calendrier des jackpots) | **Payer** (ses propres cotisations) | F28, F33 / F34 |
| 5 | **Créer** | **Créer** | F18 |
| 6 | **Historique** | **Membres** (raccourci vers la tontine choisie) | F35 / F24–F25 |
| 7 | **Inviter** | **Mes gains** | partage / F33 |
| 8 | **Plus** | **Plus** | — |

Administrateur plateforme : sa grille ajoute **« Plateforme »** (console desktop : F17, F44–F49).

### 4.3 Accueil — fil d'activité
F35 (mes paiements), F37/F38 (validations et encaissements, côté gestionnaire), F30–F32 (clôtures, jackpots), F50 (les alertes importantes y apparaissent aussi comme lignes). Tap sur une ligne → **reçu** (nouveau, F34/F38/F39).

### 4.4 Feuille « Plus »
| Service | Fonctionnalités |
|---|---|
| Historique complet (gestionnaire) / Mes gains (membre si pas dans la grille) | F35, F33 |
| Récapitulatifs (export, total par membre) | F42 |
| Alertes (aussi accessibles par la cloche) | F50 |
| Aide / Comment ça marche | contenu de F13 |
| Installer l'application | F56 |
| Plateforme (administrateur uniquement) | F17, F44–F49 |

### 4.5 Écrans « Choisir » (G3)
| Écran | Champ | Favoris affichés | Fonctionnalités |
|---|---|---|---|
| Payer | « Pour » | Cotisations dues, puis mes autres tontines | F34 |
| Encaisser | « De » + Scanner QR membre | Membres pas encore payés ce tour | F38, F40 |
| Ajouter un membre | « Qui » + « Saisir un nouveau numéro » + contacts | Membres de mes autres tontines | F25 |

### 4.6 Fiche Tontine (G4)
| Zone | Membre | Gestionnaire | Fonctionnalités |
|---|---|---|---|
| Montant énorme | Cagnotte du tour en cours | idem + « 8/12 ont payé » | F21, F28 |
| Bouton pilule 1 | **Payer** | **Encaisser** | F34 / F38 |
| Bouton pilule 2 | **Mon tour** | **Valider (n)** | F33 / F37 |
| Pastille haut droite | Infos | **+ Membre** | F21 / F25 |
| Carte de lignes | Membres · Tours | Membres · Tours · Réglages | F24, F28, F33 |
| Historique | Mes paiements | Tous les paiements (filtre statut) | F36, F39, F41 |
| Lignes de « Tours » → écran Tour | Progression, gagnant | + Clôturer, Désigner, Tirage, Démarrer | F28–F32, F40, F42 |
| Ligne membre → fiche Membre | — | Suspendre, Retirer, Encaisser | F26, F27, F41 |
| Réglages de la tontine (G8 dans la fiche) | Règles en lecture | Activer / Suspendre, Commissions, modifier le brouillon | F21, F22, F23, F43 |

### 4.7 Créer (G5)
F18 : « Pour quoi cotisez-vous ? » → montant → membres ou date → récapitulatif → « Tontine créée » → « Ajouter des membres » (F25).

### 4.8 Mes gains (G6)
F33 (historique des jackpots) + prochain tour prévu + répartition finale des tontines événementielles (F30).

### 4.9 Paramètres (G8)
| Section | Lignes | Fonctionnalités |
|---|---|---|
| **Compte** | Mes informations · Numéro de téléphone · Changer de compte | F51, F52, F10 |
| **Partager** | Inviter un proche à rejoindre Dinthialma · Rejoindre avec un code *(masqué tant que l'API n'existe pas)* | partage, F14 |
| **Support** | Contacter l'assistance · Comment ça marche | aide `[À CONFIRMER : canal de support]` |
| **Sécurité** | Modifier mon code secret · Modifier mon mot de passe · Appareils connectés `[À CONFIRMER : endpoint]` | F54, F53 |
| **Application** | Installer l'application · Se déconnecter | F56, F11 |

### 4.10 Hors accueil (entrée et système)
| Emplacement | Fonctionnalités |
|---|---|
| Écrans d'entrée (Bienvenue, Connexion, Code secret, Code SMS, Création de compte, Nouveau mot de passe) | F01, F03–F09 |
| Système (aucun écran) | F02, F12, F58 |
| Supprimées | F55 Mode sombre (à réintroduire plus tard, proprement), F59 Graphique fictif |
| Console plateforme (desktop) | F17, F44, F45, F46, F47, F48, F49 |

**Contrôle** : 59/59 fonctionnalités placées ; aucune n'a plus d'un emplacement principal.

---

## 5. Conséquence sur le brief existant

| Brief actuel | Avec la logique Wave |
|---|---|
| Barre du bas : Accueil · Tontines · (+) · Alertes · Moi | **Pas de barre du bas** : Accueil-hub (roue dentée = Paramètres, cloche = Alertes, grille = services) |
| Bouton central (+) | **Carte centrale** de l'accueil + case « Créer » de la grille |
| Écran « Moi » | **Paramètres** en sections (Compte, Partager, Support, Sécurité, Application) |
| Onglets Paiements / Membres / Tours dans la tontine | **Fiche Tontine** : 2 boutons pilule + carte de lignes + historique |
| Historique comme écran à part | **Fil d'activité directement sur l'accueil** (écran complet seulement depuis « Plus ») |
| Assistant de création en 3 étapes | **Question unique « Pour quoi cotisez-vous ? »** puis 2 questions |
| — | Nouvel écran **Mes gains** |

Sur desktop, l'accueil-hub devient : grille de services en colonne gauche, fil d'activité au centre, carte centrale en haut. La console plateforme garde sa barre latérale.

---

## 6. Décisions prises (10 nov. 2026) et propositions

### 6.1 Montant du bandeau — DÉCIDÉ
- Le bandeau affiche le **total de mes cotisations validées, toutes tontines confondues** (« TOTAL COTISÉ 85.000F »), masquable par l'œil comme dans Wave.
- **Tap sur le montant** → feuille « Mes montants par tontine » : une ligne par tontine (initiales, nom, total cotisé, « 4/12 tours payés », petite barre de progression) + en bas « Jackpots reçus : 57.000F » (→ Mes gains). Tap sur une ligne → fiche Tontine.
- En mode « Je gère » (voir 6.3), le même bandeau affiche **« COLLECTÉ CE TOUR »** sur les tontines gérées, et la feuille détaille par tontine (collecté / attendu, à valider).
- API : calcul possible aujourd'hui tontine par tontine (cotisations filtrées sur mon membre) ; `[À CONFIRMER : endpoint « mon résumé » qui renvoie ces totaux en un seul appel — fortement conseillé pour les réseaux lents]`.

### 6.2 QR code — PROPOSITION : une carte « QR » à deux faces, comme la carte Scanner de Wave
La carte centrale de l'accueil garde le principe Wave : **un QR affiché + un bouton « Scanner »**. Ce que montre le QR dépend du mode :

| Mode | QR affiché | Quand quelqu'un le scanne |
|---|---|---|
| **Je cotise** | **Mon QR membre** (moi) | Un gestionnaire le scanne → écran **Encaisser** pré-rempli avec mon nom (s'il est dans sa tontine) ou **Ajouter un membre** pré-rempli avec mon numéro (s'il ne l'est pas). |
| **Je gère** | **QR de la tontine sélectionnée** (invitation) | Une personne le scanne → elle arrive sur la **page d'invitation** de la tontine (nom, montant, rythme, gestionnaire, places restantes) avec « Demander à rejoindre ». Déjà membre → la fiche Tontine s'ouvre directement. |

Bouton **« Scanner »** (sur la même carte) : ouvre la caméra et reconnaît les deux types de QR.

Pourquoi c'est simple :
- Un seul objet à apprendre, au même endroit que dans Wave.
- Le QR contient un **lien web** (`https://<domaine>/q/...`) : il fonctionne aussi avec l'appareil photo du téléphone, même sans l'app installée (ouverture dans le navigateur, puis invitation à se connecter / s'inscrire).

Règles de sécurité :
- Scanner un QR **ne déclenche jamais** de paiement ni d'ajout tout seul : il ouvre toujours un écran avec un bouton de confirmation.
- Le QR membre est affiché seulement quand on ouvre la carte (pas visible en permanence) ; bouton « Agrandir » pour le présenter au gestionnaire.

Ce qu'il faut côté backend :
- **QR membre — faisable dès la v1** : le lien contient un identifiant de l'utilisateur ; le gestionnaire le retrouve par la recherche existante. `[À CONFIRMER : idéalement un identifiant opaque plutôt que le numéro de téléphone en clair dans le lien]`.
- **QR tontine — v2** : nécessite `[À CONFIRMER]` (a) un aperçu public d'une tontine par code d'invitation, (b) une « demande d'adhésion » que le gestionnaire accepte dans **À valider**. **Solution de repli en v1** : la page d'invitation affiche le nom de la tontine et un bouton « Écrire au gestionnaire sur WhatsApp » avec un message pré-rempli (« Bonjour, je souhaite rejoindre la tontine Famille. Mon numéro : 77 … »). Le gestionnaire ajoute ensuite la personne normalement.

### 6.3 Bascule « Je cotise / Je gère » — DÉCIDÉ
- Commutateur en 2 segments **en haut du bandeau**, affiché **uniquement** si l'utilisateur est à la fois membre d'au moins une tontine et gestionnaire d'au moins une tontine. Le dernier mode utilisé est mémorisé.
- **Pastille d'alerte sur le mode inactif** : « Je gère • 3 » si 3 paiements attendent une validation pendant qu'on est en mode « Je cotise ».
- **Plusieurs tontines dans chaque mode** : sous le commutateur, un sélecteur **« Toutes mes tontines ▾ »** ouvre une feuille pour choisir une tontine précise. Ce choix filtre le bandeau, la carte QR, la grille et le fil d'activité. Par défaut : « Toutes ».
  - En « Toutes », une action qui vise une seule tontine (Encaisser, Payer, QR d'invitation) commence par **« Pour quelle tontine ? »** (gabarit G3), en mettant en tête la plus urgente. S'il n'y a qu'une tontine concernée, cette étape est sautée.
- **Une tontine où l'on est à la fois gestionnaire et membre** (cas fréquent) apparaît dans les deux modes ; sa fiche s'ouvre en vue gestionnaire en mode « Je gère » et en vue membre en mode « Je cotise ».

| Zone de l'accueil | Je cotise | Je gère |
|---|---|---|
| Bandeau | Total cotisé (toutes tontines ou celle choisie) | Collecté ce tour |
| Carte QR | Mon QR membre + Scanner | QR d'invitation de la tontine + Scanner |
| Carte d'action | « À payer 5.000F » | « 3 paiements à valider » / « 4 n'ont pas payé » |
| Grille (8 cases) | Payer · Mes tontines · Mes jackpots (inclut « mon prochain tour ») · Historique · Créer · Inviter · Aide · Plus | Encaisser · À valider · Mes tontines · Membres · Tours · Créer · Inviter · Plus |
| Fil d'activité | Mes paiements, validations, jackpots | Paiements reçus, déclarations à valider, clôtures |

Cela remplace la grille mixte proposée au §4.2.

### 6.4 Partage — PROPOSITION : un seul écran « Partager » (lien + QR + 3 boutons)
Un écran unique, réutilisé partout où l'on invite :
- **QR en grand** au centre, titre court au-dessus.
- En dessous, **3 gros boutons** : **WhatsApp** (message pré-rempli) · **Copier le lien** · **Plus** (partage natif du téléphone : SMS, Messenger…).

Deux usages, même écran :

| Usage | Depuis | Lien / QR | Message WhatsApp pré-rempli |
|---|---|---|---|
| **Inviter un proche à l'app** | Grille « Inviter », Paramètres > Partager | Lien de l'app (`https://<domaine>`) | « Je gère mes tontines avec Dinthialma, rejoins-moi : <lien> » |
| **Inviter dans ma tontine** (gestionnaire) | Carte QR en mode « Je gère », fiche Tontine > « + Membre » | Lien d'invitation de la tontine (= QR tontine, §6.2) | « Rejoins notre tontine Famille (5.000F / mois) : <lien> » |

Pas de parrainage ni de code promo en v1 : rien à développer côté backend pour le premier usage ; le second suit le calendrier du QR tontine (avec le repli WhatsApp en v1).

### 6.5 Endpoints à demander au backend (récapitulatif)
1. Résumé membre multi-tontines (totaux, cotisations dues, mon identifiant de membre par tontine).
2. Paiements en attente de toutes mes tontines gérées (file « À valider »).
3. Identifiant opaque pour le QR membre.
4. Aperçu public d'une tontine par code + demande d'adhésion (QR tontine, v2).
5. Refus d'un paiement ; appareils connectés.
