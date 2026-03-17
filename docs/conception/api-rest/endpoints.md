# **STRUCTURE GLOBALE DES ENDPOINTS**

```
/auth
/users
/associations
/events
/conversations
/moderation
/admin
```

---

# **1. AUTHENTIFICATION / COMPTES**

## **/auth**

| Méthode | Endpoint                     | Description                       | Role                            |
| ------- | ---------------------------- | --------------------------------- |---------------------------------|
| POST    | `/auth/register`             | Inscription classique utilisateur |                                 |
| POST    | `/auth/register/association` | Inscription association           |                                 |
| POST    | `/auth/login`                | Login email / pseudo / téléphone  |                                 |
| POST    | `/auth/refresh`              | Rafraîchir un token               |user/organization/admin/moderator|
| POST    | `/auth/logout`               | Déconnexion                       |user/organization/admin/moderator|
| POST    | `/auth/send-otp`             | Envoi OTP (SMS ou mail)           |user/organization/admin/moderator|
| POST    | `/auth/verify-otp`           | Vérification OTP                  |user/organization/admin/moderator|
| POST    | `/auth/forgot-password`      | Demande reset mdp                 |user/organization/admin/moderator|
| POST    | `/auth/reset-password`       | Nouveau mdp                       |user/organization/admin/moderator|


---

# **2. UTILISATEURS (infos de chaque compte)**

## **/users** 

| Méthode | Endpoint                | Description               | Role                            |
| ------- | ----------------------- | ------------------------- |---------------------------------|
| GET     | `/users/me`             | Récup. profil connecté    |user/admin/moderator             |
| PATCH   | `/users/me`             | Modifier infos générales  |user/admin/moderator             |
| DELETE  | `/users/me`             | Suppression compte        |user/admin/moderator             |
| GET     | `/users/:id`            | Voir profil public        |user/organization/admin/moderator|



---

# **3. ASSOCIATIONS**

## **/associations**

| Méthode | Endpoint                    | Description              | Role                            |
| ------- | --------------------------- | ------------------------ |---------------------------------|
| GET     | `/associations`             | Liste publiques          |user/organization/admin/moderator|
| GET     | `/associations/:id`         | Détails                  |user/organization/admin/moderator|
| PATCH   | `/associations/:id`         | Modifier si propriétaire |organization/admin/moderator     |


---

---

# **5. ÉVÉNEMENTS**

## **/events**

| Méthode | Endpoint                   | Description                    | Role                            |
| ------- | -------------------------- | ------------------------------ |---------------------------------|
| POST    | `/events`                  | Créer événement                |user/organization/admin/moderator|
| GET     | `/events`                  | Liste (avec filtres => centres d'intérêts, ville + distance autour)|user/organization/admin/moderator|
| GET     | `/events/:id`              | Détails                        |user/organization/admin/moderator|
| PATCH   | `/events/:id`              | Modifier                       |user/organization/admin/moderator|
| DELETE  | `/events/:id`              | Supprimer +                    |user/organization/admin/moderator|
| POST    | `/events/:id/join`         | Rejoindre                      |user/admin/moderator             |
| POST    | `/events/:id/leave`        | Quitter                        |user/admin/moderator             |
| GET     | `/events/:id/participants` | Liste participants             |user/organization/admin/moderator|





---

# **6. MESSAGERIE (Socket.io + REST)**

## Messages

| Méthode | Endpoint                      | Description       | Role                            |
| ------- | ----------------------------- | ----------------- |---------------------------------|
| GET     | `/conversations/:id/messages` | Historique        |user/organization/admin/moderator|
| POST    | `/conversations/:id/messages` | Envoyer message   |user/organization/admin/moderator|
| DELETE  | `/conversations/:id`          | Supprimer conversation|user/organization/admin/moderator|

---

# **7. AIDE**

| Méthode | Endpoint                      | Description       | Role                            |
| ------- | ----------------------------- | ----------------- |---------------------------------|
| GET     | `/help`                       | Accéder à une aide|user/organization/admin/moderator|

---

# **8. BACK-OFFICE MODÉRATION**

## Dashboard

| Méthode | Endpoint                | Description           | Role          |
| ------- | ----------------------- | --------------------- |---------------|
| GET     | `/moderation/dashboard` | Statistiques globales |admin/moderator|
| GET     | `/moderation/users/:id` | Fiche utilisateur     |admin/moderator|
| GET     | `/moderation/events`     | Liste événements     |admin/moderator|


---

# **9. ADMIN / PERMISSIONS**

## **/admin**

| Méthode | Endpoint                            | Description         | Role                 |
| ------- | ----------------------------------- | ------------------- |----------------------|
| POST    | `/admin/moderators`                 | Créer un modérateur |administator          |
| GET     | `/admin/moderators`                 | Liste               |moderator/adminstrator|
| PATCH   | `/admin/moderators/:id/permissions` | Modifier rôles      |administrator         |

---
# **10. UPLOADS (Sauvegarde cloud)**

## **/uploads**

| Méthode | Endpoint               | Description         | Role                            |
| ------- | ---------------------- | ------------------- |---------------------------------|
| POST    | `/uploads/attachment`  | Upload médias chat  |user/organization/admin/moderator|

Tous les uploads passent par :

* Scan **Google Vision SafeSearch**
* Vérification MIME
* Limite taille