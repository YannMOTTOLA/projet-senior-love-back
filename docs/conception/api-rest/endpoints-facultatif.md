# **STRUCTURE GLOBALE DES ENDPOINTS**

```
/auth
/users
/associations
/interests
/events
/messages
/conversations
/moderation
/reports
/uploads
/notifs
```

---

# **1. AUTHENTIFICATION / COMPTES**

## **/auth**
| Méthode | Endpoint                     | Description                       |
| ------- | ---------------------------- | --------------------------------- |
| POST    | `/auth/login/facebook`       | Login Facebook                    |
| POST    | `/auth/enable-2fa`           | Activer 2FA                       |
| POST    | `/auth/disable-2fa`          | Désactiver 2FA                    |

---

# **2. UTILISATEURS (infos de chaque compte)**

## **/users** 
| Méthode | Endpoint                     | Description                       |
| ------- | ---------------------------- | --------------------------------- |
| POST    | `/users/me/exit-survey`      | Enquête de départ                 |
| POST    | `/users/:id/report`     | Signaler un utilisateur   |

## Vérification identité (utilisateurs seulement)

| Méthode | Endpoint                     | Description              |
| ------- | ---------------------------- | ------------------------ |
| POST    | `/users/me/verify-id`        | Envoi documents à Onfido |
| GET     | `/users/me/verify-id/status` | Statut KYC               |
| POST    | `/users/me/verify-face`      | Selfie → Veriff / Onfido |


# **3. ASSOCIATIONS**

## **/associations**

| Méthode | Endpoint                    | Description              |
| ------- | --------------------------- | ------------------------ |
| GET     | `/associations/:id/members` | Membres affiliés         |
|GET      | `/associations/verify-siret/:siret` | Vérifier un SIRET |
| POST    | `/associations/register`    | Inscription association (avec vérif SIRET) |

utilisation de l'api SIRENE — INSEE

# **4. CENTRES D’INTÉRÊTS (catalogue/ back office)**

## **/interests**

| Méthode | Endpoint                 | Description   |
| ------- | ------------------------ | ------------- |
| GET     | `/interests`             | Liste globale |
| POST    | `/interests` (admin)     | Créer         |
| DELETE  | `/interests/:id` (admin) | Supprimer     |

# **5. ÉVÉNEMENTS**


## Notes & Commentaires

| Méthode | Endpoint               | Description       |
| ------- | ---------------------- | ----------------- |
| POST    | `/events/:id/rating`   | Noter (1–5)       |
| POST    | `/events/:id/comment`  | Commentaire       |
| GET     | `/events/:id/comments` | Lire commentaires |

## Gestion automatique

* CRON interne → `/events/auto-close`

# **6. MESSAGERIE (Socket.io + REST)**

## Conversations groupes

| Méthode | Endpoint                   | Description            |
| ------- | -------------------------- | ---------------------- |
| POST    | `/conversations`           | Créer conversation     |
| POST    | `/conversations/group`     | Créer groupe           |
| GET     | `/conversations`           | Liste                  |
| GET     | `/conversations/:id`       | Infos conversation     |
| DELETE  | `/conversations/:id`       | Supprimer conversation |
| POST    | `/conversations/:id/leave` | Quitter un groupe      |

# **6. MESSAGERIE (Socket.io + REST)**

## Messages

| Méthode | Endpoint                      | Description       |
| ------- | ----------------------------- | ----------------- |
| PATCH   | `/messages/:id`               | Modifier message  |
| DELETE  | `/messages/:id`               | Supprimer message |
| POST    | `/messages/:id/react`         | Ajouter réaction  |
| POST    | `/messages/:id/report`        | Signaler message  |

# **7. SIGNALEMENTS**

## **/reports**

| Méthode | Endpoint                | Description             |
| ------- | ----------------------- | ----------------------- |
| POST    | `/reports/user/:id`     | Signaler un utilisateur |
| POST    | `/reports/message/:id`  | Signaler un message     |
| POST    | `/reports/event/:id`    | Signaler un événement   |
| GET     | `/reports` (modérateur) | Voir signalements       |
| PATCH   | `/reports/:id/resolve`  | Traiter                 |


# **8. BACK-OFFICE MODÉRATION**

## Modération utilisateurs

| Méthode | Endpoint                              | Description           |
| ------- | ------------------------------------- | --------------------- |
| POST    | `/moderation/users/:id/ban`           | Bannir temporairement |
| POST    | `/moderation/users/:id/ban-permanent` | Bannir définitivement |
| POST    | `/moderation/users/:id/remove-pp`     | Retirer photo         |
| POST    | `/moderation/users/:id/remove-pseudo` | Retirer pseudo        |
| DELETE  | `/moderation/users/:id`               | Supprimer compte app  |

## Modération événements

| Méthode | Endpoint                 | Description         |
| ------- | ------------------------ | ------------------- |
| DELETE  | `/moderation/events/:id` | Supprimer événement |



# **11. NOTIFICATIONS**

Push ou internes :

## **/notifications**

| Méthode | Endpoint                  | Description    |
| ------- | ------------------------- | -------------- |
| GET     | `/notifications`          | Liste          |
| POST    | `/notifications/read-all` | Tout lire      |
| POST    | `/notifications/:id/read` | Lire une notif |