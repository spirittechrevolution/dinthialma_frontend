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

## Questions pour le backend
_(complétées au fil de l'intégration — voir section en fin de document)_
