# Plan d'intégration du backend (B01–B25)

> Réponse au livrable 1 de `docs/PROMPT_ALIGNEMENT_FRONT.md`.
> Sources : `api-docs.json` régénéré (formes) + `PROMPT_ALIGNEMENT_FRONT.md` (comportements).
> Branche : `feature/integration-backend` (depuis `develop`, après la PR #7).
> Vérifié en local : `GET /api/v1/public/config` → `Content-Type: application/json;charset=UTF-8`,
> accents corrects ; erreurs avec `code` (`NOT_FOUND`).

---

## Lot 1 — Fondations (conventions, erreurs, types)
| Fichiers | Changements |
|---|---|
| `src/services/api.ts` | Retirer le correcteur d'accents (B03, UTF-8 vérifié). Refresh déjà appelé sans `Authorization` (axios brut) ; `SESSION_EXPIRED` / échec → connexion complète. 403 ne déconnecte pas (déjà le cas). |
| `src/lib/apiError.ts` | `code` du backend comme source unique ; suppression des heuristiques sur le texte ; ajout de tous les codes (§2) ; `retryAfterSeconds` pour `PIN_LOCKED`. Code inconnu → afficher `message`. |
| `src/types/*.ts` | `Tontine` : `monRole`, `monMembreId`, `monStatutMembre`. `Cotisation` : `REFUSE`, `motifRefus`, `refusePar`, `dateRefus`, `tontineNom`, `numeroCycle`. Notifications : `cycleId`, `cotisationId`, `membreId`, types `COTISATION_REFUSEE`, `DEMANDE_ADHESION`, `ADHESION_REFUSEE`. Champs absents = `null` (`undefined`). |
| Écrans Connexion / PIN / Inscription / Ajout membre / Payer / Encaisser | `switch` sur les codes (§2) au lieu des contextes déduits. |

## Lot 2 — Couche « moi » branchée sur les vrais endpoints
| Fonction (`meService`) | Avant (contournement) | Après |
|---|---|---|
| `listMesTontines` | liste + membres de chaque tontine + comparaison des numéros | `GET /v1/tontines` (tous rôles) → `monRole` |
| `getMaTontine` | tontine + membres | `GET /v1/tontines/{id}` |
| `getCotisantSummary` | 3 appels × N tontines | `GET /v1/me/summary` |
| `getGestionSummary` | my-dashboard + récap de chaque tour | `GET /v1/admin/my-dashboard` (`cycleEnCours.montantCollecte…`, `gagnantsADesigner`) |
| `listCotisationsAValider` | cotisations du tour en cours de chaque tontine | `GET /v1/me/gestion/cotisations?statut=EN_ATTENTE` |
| `listCotisationsParStatut` | lecture complète + filtre local | `GET /v1/tontines/{id}/cotisations?statut=…` |
| `listActivite` | fusion côté client | `GET /v1/me/activite` |
| `getMesJackpots` | estimation côté client | `GET /v1/me/jackpots` |
| `trouverMembreDansMesTontines` | numéro + membres | `GET /v1/qr/{token}` (lot 5) |
`src/lib/phone.ts` : `samePhone` n'est plus utilisé pour les rôles (gardé pour l'affichage).

## Lot 3 — Paiements : refus et validation groupée
- Statut `REFUSE` partout (pastilles, reçu, historique, fil) ; jamais dans les totaux.
- « Refuser » (motif obligatoire ≤ 500) dans À valider et sur le Reçu : `PUT …/refuser`.
- « Tout valider » : `POST /v1/me/gestion/cotisations/valider` + bilan (`validees`, `echecs`, `resultats[].code`).
- Payer : `motifDernierRefus` → « Votre paiement a été refusé : … » ; `AMOUNT_MISMATCH`, `AMOUNT_BELOW_MINIMUM`, `NO_CYCLE_IN_PROGRESS`.
- Encaisser / Tour : `GET …/membres?cycleId=&aPaye=false` ; afficher « 8 payés + 1 en attente » (`membresEnAttente`).

## Lot 4 — Authentification et sécurité
- Inscription : `clientType` + `deviceInfo` dans `register/complete` ; jetons à plat → session + création du code secret (repli connexion si absents).
- `deviceInfo` lisible (navigateur – système – appareil).
- PIN : `PIN_NOT_CONFIGURED` → création ; `PIN_LOCKED` → compte à rebours `data.retryAfterSeconds` ; `ACCOUNT_DISABLED`.
- Paramètres : mot de passe via `POST /v1/me/password` (ancien + nouveau + « déconnecter mes autres appareils ») ; écran **Appareils connectés** (`/v1/me/sessions`, révocation).
- Création de tontine : refresh conservé, vue gestionnaire basée sur `monRole` (déjà le cas).

## Lot 5 — QR, invitations, adhésions
- QR membre : `GET /v1/me/qr` (plus de numéro dans le QR), « Régénérer mon QR » dans Paramètres.
- Routes publiques `/q/{token}` (membre) et `/q/t/{code}` (invitation) ; le scanner accepte l'URL ou le jeton brut ; résolution `GET /v1/qr/{token}`.
- Invitation gestionnaire : `POST /v1/tontines/{id}/invitation` (code stable, `?regenerer=true`, `DELETE`) → écran Partager et QR des réglages.
- Page Invitation : `GET /v1/public/invitations/{code}` (sans JWT), `ouverte`, « Demander à rejoindre » → `POST /v1/invitations/{code}/demandes`.
- Gestionnaire : section **Demandes** dans À valider (`GET /v1/me/gestion/demandes`, accepter / refuser).
- Demandeur : « Mes demandes » (`GET /v1/me/demandes`).
- Alertes : navigation précise (`cotisationId`, `cycleId`, `membreId`) + nouveaux types.

## Lot 6 — Préférences, exports, configuration, recherches
- Préférences : `GET/PUT /v1/me/preferences` (objet complet), `localStorage` en cache hors ligne : mode, montant masqué, favoris, dernier moyen.
- Exports CSV (`fetch` + `Blob` + `Content-Disposition`) : Historique et Tour/Fiche tontine.
- `GET /v1/public/config` au démarrage : écran « Mise à jour requise » si `versionMinimaleApp` > version ; support WhatsApp / email dans Paramètres.
- Recherches serveur : `q` sur tontines, membres, cotisations ; console (`q`, `role`, `accountStatus`) ; suppression de valeur de liste (`CODE_LIST_SYSTEM_VALUE`).

## État des lots

| Lot | Commit | Statut |
|---|---|---|
| 1 — Conventions, codes d'erreur, types | `a0574f1` | Fait |
| 2 — Couche « moi » + QR / invitations | `ad5eabc` | Fait |
| 3 — Refus et validation groupée | `b8cef79` | Fait |
| 4 — Authentification et sécurité | `268074a` | Fait |
| 5 — Demandes d'adhésion, alertes précises | `7eb9bf3` | Fait |
| 6 — Préférences, configuration, exports, console | `8fa3ccc` | Fait |

Vérification : compilation TypeScript et build de production à chaque lot. **Aucun test de bout en
bout avec l'API n'a encore été fait** (à mener avant la PR, voir « Comment tester »).

## Comment tester (par lot)
1. **Erreurs** : mauvais mot de passe → « Numéro ou mot de passe incorrect » ; PIN faux ×N → message de
   verrouillage avec délai ; compte créé par un gestionnaire → écran « Activer mon compte ».
2. **Accueil** : comparer bandeau / carte d'action / fil avec `/me/summary`, `/admin/my-dashboard`,
   `/me/activite` ; bascule Je cotise / Je gère ; QR membre = jeton `m_…` (aucun numéro).
3. **Paiements** : refuser une déclaration (motif) → le membre voit le motif sur Payer et peut
   redéclarer ; « Tout valider » avec un paiement déjà traité → bilan.
4. **Compte** : inscription → création du code secret sans reconnexion ; changer de mot de passe
   avec « déconnecter mes autres appareils » ; révoquer une session.
5. **Invitations** : Réglages → QR / code ; ouvrir `/q/t/{code}` déconnecté → créer un compte →
   retour à l'invitation → « Demander à rejoindre » ; côté gestionnaire, accepter dans À valider.
6. **Préférences** : changer de mode / favoris sur un appareil → retrouvés sur un autre ; export CSV
   ouvert dans Excel.

## Questions pour le backend
1. **Jackpots par tontine dans `/me/summary`** : `TontineCotisant` n'a pas de total des jackpots reçus.
   Le front appelle `/me/jackpots` en plus et additionne. Ajouter `totalJackpotsRecus` par tontine ?
2. ~~QR membre d'une personne absente de mes tontines~~ — **Répondu** : `POST …/membres { qrToken }`
   (sans numéro). Intégré : « Ajouter à une de vos tontines » sur `/q/{token}`.
3. **Aperçu d'invitation pour un utilisateur déjà membre** : `InvitationApercuResponse` n'a ni
   `tontineId` ni indicateur « déjà membre ». On ne le découvre qu'en recevant
   `MEMBER_ALREADY_IN_TONTINE` à la demande, sans pouvoir ouvrir la fiche. Ajouter `tontineId`
   (si l'appelant est membre) ou `dejaMembre` quand un JWT est fourni ?
4. **Filtre `type` de `/me/activite`** : valeur unique. Pour « Paiements seulement » (tout sauf
   `JACKPOT_RECU`), le front filtre localement. Accepter plusieurs `type` ou un filtre `sens` ?
5. ~~Domaine des liens~~ — **Répondu** : le backend génère `{FRONT}/q/{m_…}` et `{FRONT}/q/t/{code}`
   (local `http://localhost:4200`, prod `https://www.dinthialma.com`). Le front n'utilise que le champ
   `url`. Test sur téléphone : demander au backend de mettre `APP_URL` sur l'IP locale du poste.
6. ~~`versionMinimaleApp`~~ — **Répondu** : SemVer strict ; `versionMinimaleApp` → écran bloquant,
   `versionRecommandeeApp` → bandeau refermable ; en cas de doute, aucun blocage. **À faire à la mise
   en production : passer `package.json` à `1.0.0`.**
7. **`PIN_NOT_CONFIGURED` au login PIN** : le front renvoie vers la connexion par mot de passe (le PIN
   sera proposé ensuite). Est-ce le comportement voulu, ou faut-il aller directement à la création ?
8. **Notifications `DEMANDE_ADHESION` / `ADHESION_REFUSEE`** : portent-elles toujours `tontineId` ?
   Le front en a besoin pour ouvrir la bonne file.
9. **Badge « À valider »** : le compteur de l'accueil (`totalCotisationsEnAttente`) n'inclut pas les
   demandes d'adhésion en attente. Prévoir `totalDemandesEnAttente` dans `my-dashboard` ?
