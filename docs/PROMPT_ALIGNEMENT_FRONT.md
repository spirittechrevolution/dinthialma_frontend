# Prompt – Aligner le front Dinthialma sur le backend (au-delà d'api-docs)

> **Usage** : copier ce fichier dans le dépôt front (ex. `docs/PROMPT_ALIGNEMENT_FRONT.md`) et le
> donner tel quel à l'agent ou au développeur front. Il complète `api-docs.json` (contrat
> technique : routes, schémas) avec tout ce que le contrat ne dit pas : conventions, sémantique
> métier, parcours, contournements à retirer.
>
> Backend de référence : branche `feature/me-endpoints-lot-a` (besoins B01–B25 de
> `docs/BESOINS_BACKEND.md`, sauf B19 push en stand-by).

---

## Rôle et objectif

Tu travailles sur le **front** de Dinthialma. Le backend vient d'implémenter les besoins listés
dans `docs/BESOINS_BACKEND.md`. Ta mission : **aligner le front sur ce backend**, supprimer les
contournements devenus inutiles, et corriger les comportements qui reposaient sur d'anciennes
hypothèses.

**Règles de travail**
1. Commence par régénérer `docs/api-docs.json` depuis le backend
   (`GET {API}/api/api-docs`) et considère-le comme la source de vérité des **formes** (routes,
   champs, types).
2. Ce document est la source de vérité des **comportements**. En cas de contradiction apparente
   avec le code front existant, c'est le front qui s'adapte.
3. Ne modifie pas le backend. Si un besoin n'est pas couvert ou qu'un comportement te semble
   incohérent, **note-le dans une liste de questions** au lieu de deviner ou de contourner.
4. Avant de coder, produis un **plan d'audit** : pour chaque section ci-dessous, les fichiers du
   front concernés et les changements prévus. Puis implémente par petits lots testables.

---

## 1. Conventions de réponse (valables pour toute l'API)

### Enveloppe
Toutes les réponses JSON ont la forme :
```json
{ "status": "success|error", "statusCode": 200, "code": "…", "message": "…", "data": … }
```
- `code` est **présent uniquement sur les erreurs** (voir §2). Absent sur les succès.
- `message` est un texte lisible pour l'humain : **ne jamais l'analyser** pour prendre une décision.
- Les exports CSV (§9) sont les seules réponses qui ne sont pas du JSON.

### Champs `null` = champs absents
Le backend est configuré en `non_null` : **un champ qui vaut `null` n'apparaît pas dans le JSON**.
Traiter systématiquement `champ === undefined` comme `null` (ex. `monMembreId` absent = je ne
cotise pas ; `cycleEnCours` absent = pas de tour en cours ; `cotisationDue` absente = rien à payer).
Ne jamais tester `=== null` seul.

### Pagination
Tous les endpoints de liste paginée renvoient :
```json
{ "content": [ … ], "page": { "size": 20, "number": 0, "totalElements": 57, "totalPages": 3 } }
```
Paramètres : `?page=0&size=20&sort=champ,asc|desc`. Exceptions :
- `/v1/me/activite` : tri **imposé** (date décroissante), `sort` est ignoré.
- `/v1/me/summary`, `/v1/me/jackpots`, `/v1/me/sessions` : listes **non paginées** (courtes).

### Formats
- **Dates** : `LocalDate` → `"2026-11-30"` ; `LocalDateTime` → `"2026-11-11T07:32:28.73966"`
  (sans fuseau, heure du serveur). Ne pas ajouter de `Z`.
- **Montants** : nombres JSON en FCFA (ex. `1000.0`), jamais des chaînes.
- **Téléphones** : stockés et renvoyés **sans `+`** (`221770000001`).
  - Login : `username` accepte `+221…` ou `221…`.
  - Inscription, OTP, `verify-otp`, `register/complete` : **format international avec `+`
    obligatoire** (`+221…`), sinon `VALIDATION_ERROR`.
- **Encodage** : toutes les réponses déclarent `charset=UTF-8` (B03).

### Noms de champs exacts (pièges Jackson)
Les booléens / champs préfixés par « a » + majuscule sont exposés **exactement** ainsi :
`aRecuJackpot`, `aVenir`, `aPayeCycleEnCours`. Les notifications exposent `read` (pas `isRead`).

---

## 2. Gestion des erreurs : se baser sur `code`, jamais sur `message`

Remplacer **toute** logique qui lit le texte d'erreur par un `switch` sur `code`. Tout code non
géré → afficher `message` tel quel.

### Codes génériques (toute erreur en a un)
| `code` | HTTP | Comportement front attendu |
|---|---|---|
| `UNAUTHORIZED` | 401 | Jeton absent/expiré : tenter **un** refresh (§3) puis rejouer la requête ; si échec → écran de connexion |
| `FORBIDDEN` | 403 | Droit insuffisant : message « accès refusé », **ne pas déconnecter** |
| `NOT_FOUND` | 404 | Ressource inexistante / révoquée |
| `VALIDATION_ERROR` | 400 | Champs invalides (le détail est dans `message`) |
| `INVALID_PARAMETER` | 400 | Paramètre de requête mal typé (enum inconnu, UUID invalide) – bug front |
| `MALFORMED_REQUEST` | 400 | JSON illisible / paramètre obligatoire manquant – bug front |
| `CONFLICT`, `BAD_REQUEST` | 409 / 400 | Repli générique |
| `METHOD_NOT_ALLOWED` | 405 | Bug front (mauvaise méthode) |
| `TOO_MANY_REQUESTS` | 429 | Repli générique |
| `UPSTREAM_ERROR` / `INTERNAL_ERROR` | 5xx | « Service momentanément indisponible, réessayez » |

> ⚠️ Changement : un **rôle insuffisant renvoie désormais 403** (avant : 401). Un intercepteur qui
> déconnecte sur tout 401 ne doit plus être déclenché par un simple refus de droit.

### Codes métier
| `code` | Contexte | Comportement front |
|---|---|---|
| `INVALID_CREDENTIALS` | Login | « Identifiants incorrects » |
| `ACCOUNT_PRE_ENROLLED` | Login (403) | Compte créé par un gestionnaire : proposer **l'inscription** avec ce numéro |
| `ACCOUNT_DISABLED` | Login / PIN | Compte désactivé : contacter le support (§11) |
| `SESSION_EXPIRED` | `/auth/refresh` | Refresh refusé : **connexion complète** |
| `PIN_INVALID` | Login PIN | Code faux, réessayer |
| `PIN_LOCKED` | Login PIN (429) | Verrouillé : afficher un compte à rebours depuis **`data.retryAfterSeconds`** |
| `PIN_EXPIRED` | Login PIN | PIN > 90 jours : parcours « réinitialiser mon PIN » |
| `PIN_SESSION_EXPIRED` | Login PIN | Plus de session : **connexion par mot de passe** |
| `PIN_NOT_CONFIGURED` | Login PIN | Envoyer vers la création du PIN |
| `PIN_INVALID_FORMAT`, `PIN_TOO_SIMPLE`, `PIN_MISMATCH` | Création PIN | Messages de saisie |
| `OTP_INVALID` / `OTP_EXPIRED` | Codes SMS | « Code incorrect » / « Code expiré, renvoyer » |
| `OTP_NOT_VERIFIED` | Étape finale (inscription, reset) | Revenir à l'étape de saisie du code |
| `PHONE_ALREADY_USED` | Inscription / changement de numéro | Proposer la connexion |
| `EMAIL_ALREADY_USED`, `PHONE_UNCHANGED` | Profil | Messages de saisie |
| `CURRENT_PASSWORD_INVALID`, `PASSWORD_UNCHANGED` | Changer de mot de passe | Messages de saisie |
| `MEMBER_ALREADY_IN_TONTINE` | Ajout membre / demande d'adhésion | « Déjà membre » |
| `JACKPOT_POSITION_TAKEN` | Ajout membre / acceptation | Proposer une autre position |
| `MEMBER_NAME_REQUIRED` | Ajout membre | Numéro inconnu : afficher prénom + nom |
| `TONTINE_FULL` | Demande d'adhésion / acceptation | « Tontine complète » |
| `TONTINE_NOT_OPEN` | Invitation / demande | Tontine suspendue ou terminée |
| `DEMANDE_DEJA_EN_ATTENTE` | Demande d'adhésion | « Demande déjà envoyée » |
| `DEMANDE_NOT_PENDING` | Accepter / refuser | Déjà traitée : rafraîchir la liste |
| `COTISATION_ALREADY_EXISTS` | Déclarer / encaisser | Une cotisation active existe déjà sur ce tour |
| `NO_CYCLE_IN_PROGRESS` | Déclarer / encaisser | Le tour n'est pas en cours |
| `AMOUNT_BELOW_MINIMUM` / `AMOUNT_MISMATCH` | Déclarer (événementielle) | Montant sous le plancher / différent du montant fixe |
| `COTISATION_NOT_PENDING` | Valider / refuser | Déjà traitée : rafraîchir |
| `COTISATION_NOT_EDITABLE` | Modifier | Tour clôturé, en retard ou refusée |
| `CYCLE_ALREADY_IN_PROGRESS` | Démarrer un tour | Clôturer d'abord le tour en cours |
| `CODE_LIST_SYSTEM_VALUE` | Console listes | Valeur système non supprimable |

`OTP_RATE_LIMITED` existe dans l'enum mais **n'est jamais émis** (pas de limitation côté backend).

---

## 3. Authentification et sessions

- **Refresh** : `POST /v1/auth/refresh` est **public** → l'appeler **sans** en-tête
  `Authorization` (le jeton d'accès est justement expiré). Un seul refresh concurrent à la fois ;
  rejouer ensuite la requête initiale une fois. `SESSION_EXPIRED` → connexion complète.
- **Reset PIN** (`/v1/auth/pin/reset/**`) : public, sans JWT.
- **Une session par type de client** (`WEB`, `MOBILE`) : une nouvelle connexion du même type sur un
  autre appareil **remplace** la précédente. Envoyer un `deviceInfo` lisible (« Chrome – Android
  14 – Pixel 7 »), il s'affiche dans l'écran « Appareils connectés ».
- **Inscription → accueil sans reconnexion (B13)** : envoyer `clientType` (+ `deviceInfo`) dans
  `POST /v1/auth/register/complete`. La réponse contient alors, à plat, `access_token`,
  `refresh_token`, `expires_in`, `pin_configured` (= `false`) comme `/login` → enchaîner sur la
  création du code secret. Si ces champs sont absents (connexion auto échouée), repli sur l'écran
  de connexion : l'inscription, elle, a réussi.
- **Après création d'une tontine (B12)** : appeler `/auth/refresh` pour obtenir un jeton contenant
  le rôle `DINTHIALMA_ADMIN`. Mais **ne plus conditionner la vue gestionnaire au rôle global** :
  utiliser `monRole` (§4).
- **Appareils connectés (B20)** : `GET /v1/me/sessions` (`courante=true` pour cet appareil),
  `DELETE /v1/me/sessions/{id}`. Révoquer la session courante = se déconnecter : vider l'état
  local ensuite.
- **Changer de mot de passe (B21)** : `POST /v1/me/password` ; proposer la case « déconnecter mes
  autres appareils » (`deconnecterAutresAppareils`).

---

## 4. Contournements à supprimer

| Contournement actuel | Remplacer par |
|---|---|
| Correcteur d'accents « AÃ¯cha → Aïcha » (B03) | **Retirer** après vérification sur l'environnement cible (les réponses sont en UTF-8 déclaré) |
| Rôle déduit en comparant le téléphone de `creePar` au jeton | `monRole` (`GESTIONNAIRE`, `MEMBRE`, `GESTIONNAIRE_ET_MEMBRE`, `LECTURE`) sur chaque `TontineResponse` |
| `membreId` retrouvé en parcourant la liste des membres | `monMembreId` / `monStatutMembre` sur `TontineResponse` |
| Bascule « Je cotise / Je gère » filtrée côté client | `GET /v1/tontines?role=COTISE|GERE` |
| 2 appels × N tontines pour l'accueil cotisant | `GET /v1/me/summary` |
| Collecte du tour recalculée côté client | `GET /v1/admin/my-dashboard` → `cycleEnCours.montantCollecte / montantAttendu / membresAyantPaye…` |
| File « À valider » construite tontine par tontine | `GET /v1/me/gestion/cotisations?statut=EN_ATTENTE` |
| Filtres et recherches sur la page affichée seulement | Paramètres serveur (§5) |
| Boucle de `PUT …/valider` pour « Tout valider » | `POST /v1/me/gestion/cotisations/valider` (§6) |
| Numéro de téléphone en clair dans le QR membre | `GET /v1/me/qr` (§8) |
| Préférences en `localStorage` uniquement | `GET/PUT /v1/me/preferences` (§10) |
| Lecture du texte des erreurs | `code` (§2) |

---

## 5. Recherche et filtres serveur

- **Multi-valeurs** : répéter le paramètre (`?statut=EN_ATTENTE&statut=EN_RETARD`).
- **`q`** : insensible à la casse, « + » initial ignoré, `%` et `_` traités littéralement.
- `GET /v1/tontines` : `role`, `statut`, `q` (nom de la tontine ou de l'événement).
- `GET /v1/tontines/{id}/membres` : `statut`, `q` (prénom, nom, téléphone), `cycleId` + `aPaye` :
  - `aPaye=false` = **pas de cotisation active** sur ce tour → écran **« Encaisser » / « Pas encore payé »** ;
  - `aPaye=true` = cotisation `EN_ATTENTE` **ou** `VALIDE` (une déclaration en attente compte comme « a payé » ici) ;
  - un `cycleId` d'une autre tontine → 404.
- `GET /v1/tontines/{id}/cotisations` : `cycleId`, `membreId` (gestionnaire), `statut`, `q`
  (nom, téléphone, référence). Un membre ne voit que ses cotisations quoi qu'il passe.
- Console : `/admin/dashboard/users` (`accountStatus`, `role`, `q`), `/admin/dashboard/tontines` (`statut`, `q`).

---

## 6. Sémantique métier à respecter

### Statuts de cotisation
| Statut | Sens | Affichage conseillé |
|---|---|---|
| `EN_ATTENTE` | Déclarée par le membre, à valider | « En attente » |
| `VALIDE` | Validée (ou encaissée directement par le gestionnaire) | « Payé » |
| `EN_RETARD` | Non validée à la clôture du tour | « En retard » |
| `REFUSE` | **Nouveau.** Refusée par le gestionnaire avec `motifRefus` | « Refusé – motif » |

- **`REFUSE` est final** et **ne bloque pas** le membre : il peut déclarer à nouveau sur le même
  tour. Il n'entre dans aucun total. Une cotisation refusée n'est ni modifiable ni validable.
- Plusieurs lignes peuvent donc exister pour un même membre et un même tour (refus puis nouvelle
  déclaration). Le récapitulatif d'un tour et `/me/summary` affichent **la cotisation active si
  elle existe, sinon le dernier refus**.
- Refuser : `PUT /v1/tontines/{id}/cotisations/{cotisationId}/refuser` avec `{ "motif": "…" }`
  (obligatoire, ≤ 500 caractères).

### « Payé » dans les tableaux de bord
- `membresAyantPaye` / `montantCollecte` = cotisations **VALIDE** uniquement.
- `membresEnAttente` / `montantEnAttente` = déclarations à valider. À toi de choisir l'affichage
  (« 8 payés + 1 en attente »).
- `montantAttendu` = montant par membre × membres **ACTIFS** ; **absent** si montant libre sans plancher.
- `gagnantsADesigner=true` : ROTATIVE à ordre MANUEL avec un tour terminé sans gagnant → bouton
  « Désigner les gagnants ».

### Résumé cotisant `/v1/me/summary`
- `cotisationDue.statut` : `A_PAYER`, `EN_ATTENTE`, `VALIDE`.
- `cotisationDue` est **absente** si la tontine n'est pas ACTIVE, s'il n'y a pas de tour en cours
  ou si mon membership n'est pas ACTIF (rien à payer).
- `montant` absent = montant libre sans plancher (laisser saisir).
- Après un refus : `A_PAYER` + `motifDernierRefus` → afficher « Votre paiement a été refusé : … ».

### Validation groupée (B14)
`POST /v1/me/gestion/cotisations/valider` avec `{ "cotisationIds": [...] }` (1 à 100). Réponse
**toujours 200** : lire `resultats[]` (par id : `succes`, `statut`, `code`, `message`) et
`validees` / `echecs`. Afficher un bilan (« 5 validées, 1 déjà traitée ») et rafraîchir.

### Jackpots (B10) `GET /v1/me/jackpots`
- `modeAttribution` : `ORDRE` (rotation fixe → `position`, `numeroCycleEstime`, `dateEstimee`),
  `TIRAGE` (tirage au sort) ou `CHOIX` (désigné par le gestionnaire) → **pas** de tour ni de date :
  afficher « Attribution par tirage » / « Choisi par le gestionnaire ».
- `dateEstimee` absente même en `ORDRE` si le tour n'est pas encore planifié (mode MANUEL).
- `montantEstime` est **brut, avant commissions** : le libeller « environ ».

### Fil d'activité (B09) `GET /v1/me/activite`
- `mode=COTISE` (défaut) = mes mouvements ; `mode=GERE` = ceux de mes tontines (`membreNom`).
- **Une ligne par cotisation dans son état courant** (pas un journal d'événements) + une ligne par
  jackpot (`JACKPOT_RECU`, `sens=GAIN`). `COTISATION_ENCAISSEE` = saisie par le gestionnaire.

---

## 7. Notifications : navigation précise

Chaque notification peut porter `tontineId`, `cycleId`, `cotisationId`, `membreId` (champs absents
si non pertinents). Ouvrir l'écran le plus précis disponible :

| Type | Écran cible suggéré |
|---|---|
| `COTISATION_SOUMISE`, `COTISATION_VALIDEE`, `COTISATION_REFUSEE`, `PAIEMENT_RECU`, `PAIEMENT_EN_RETARD` | Reçu de la cotisation (`cotisationId`) |
| `RAPPEL_COTISATION` | Payer (tour `cycleId`) – ou reçu si `cotisationId` présent |
| `CYCLE_OUVERT`, `CYCLE_BIENTOT_CLOTURE`, `TOUR_PROCHE`, `JACKPOT_DISTRIBUE`, `DISTRIBUTION_FINALE` | Écran Tour (`cycleId`) |
| `INVITATION_TONTINE`, `STATUT_MEMBRE` | Fiche tontine / ma fiche membre (`membreId`) |
| `DEMANDE_ADHESION` | Gestion → Demandes d'adhésion (`tontineId`) |
| `ADHESION_REFUSEE` | Mes demandes |

**Push (B19) en stand-by** : pas de notification quand l'app est fermée. Rafraîchir
`GET /v1/notifications/unread-count` à l'ouverture, au retour au premier plan et périodiquement
(ex. toutes les 60 s quand l'app est visible).

---

## 8. QR et liens profonds

Le front doit gérer deux routes publiques de liens profonds :
- **`/q/{token}`** – QR membre (`token` = `m_…`).
- **`/q/t/{code}`** – invitation de tontine (`code` = `XXXX-XXXX`).

| Cas | Appel |
|---|---|
| Afficher mon QR | `GET /v1/me/qr` → encoder `url` (ou `qrToken`) |
| Régénérer mon QR (capture d'écran compromise) | `POST /v1/me/qr/regenerer` – l'ancien renvoie 404 |
| Scanner un QR (authentifié) | `GET /v1/qr/{token}` → `type=MEMBRE` (identité **sans téléphone** + `dansMesTontines` : `membreId`, `aPayeCycleEnCours`, `cycleEnCoursId` → enchaîner sur « Encaisser ») ou `type=TONTINE` (`invitationCode` → écran Invitation) |

Le scanner doit accepter les deux formes : l'URL complète (extraire le dernier segment) ou le jeton brut.

---

## 9. Invitations et adhésion (B16, B17)

1. **Gestionnaire** : `POST /v1/tontines/{id}/invitation` → `code`, `url`, `qrToken` (stable ;
   `?regenerer=true` pour un nouveau code ; `DELETE` pour révoquer). Partage WhatsApp de l'`url`.
2. **Invité, connecté ou non** : `GET /v1/public/invitations/{code}` (**sans JWT**). Si
   `ouverte=false` (tontine complète, suspendue ou terminée) → pas de bouton « Rejoindre ».
   Le code est insensible à la casse, tiret facultatif. 404 = lien invalide ou révoqué.
3. **Rejoindre** (connexion requise ; sinon inscription puis retour à l'invitation) :
   `POST /v1/invitations/{code}/demandes` avec `{ "message": "…" }` facultatif.
4. **Gestionnaire** : `GET /v1/me/gestion/demandes?statut=EN_ATTENTE` (avec téléphone du
   demandeur), puis `PUT /v1/tontines/{id}/demandes/{demandeId}/accepter` (`ordreJackpot`
   facultatif) ou `/refuser` (`motif` facultatif).
5. **Demandeur** : suivi via `GET /v1/me/demandes`.

Accepter = ajout de membre classique (même notification `INVITATION_TONTINE`).

---

## 10. Préférences, exports, configuration

- **Préférences (B22)** : `GET /v1/me/preferences` au démarrage ; `PUT` avec **l'objet complet**
  (remplacement, pas de fusion). `tontinesFavorites` ≤ 50, dédoublonnées côté serveur. Garder le
  `localStorage` comme cache hors ligne, la valeur serveur fait foi.
- **Exports CSV (B24)** : `GET /v1/tontines/{id}/cotisations/export` et
  `GET /v1/me/activite/export` exigent le JWT → **ne pas** utiliser un simple lien `<a href>` :
  faire un `fetch` avec `Authorization`, lire le `Blob`, et prendre le nom de fichier dans
  `Content-Disposition`. CSV séparé par `;`, UTF-8 avec BOM (ouverture directe dans Excel FR).
  Seul `format=csv` est accepté ; 10 000 lignes max.
- **Configuration publique (B25)** : `GET /v1/public/config` (sans JWT) au démarrage.
  `versionMinimaleApp` présente et supérieure à la version de l'app → écran « Mise à jour
  requise ». `supportWhatsapp` / `supportEmail` → Paramètres > Support (masquer s'ils sont absents).

---

## 11. Limites connues (ne pas contourner côté front)

- `TONTINE_FULL` bloque les **demandes d'adhésion**, pas l'ajout manuel par le gestionnaire.
- Une seule session `WEB` et une seule `MOBILE` par compte.
- Les jackpots des tontines **événementielles** (distribution finale) ne figurent pas dans
  `/me/jackpots` (ROTATIVE uniquement).
- Push hors application : en stand-by.

---

## Livrables attendus

1. Le **plan d'audit** (section par section : fichiers touchés, changements).
2. Les changements, par lots cohérents, avec pour chacun : ce qui a été retiré (contournement),
   ce qui a été ajouté, et comment le tester.
3. La **liste des questions** pour le backend (comportement manquant ou ambigu), sans
   contournement improvisé.
