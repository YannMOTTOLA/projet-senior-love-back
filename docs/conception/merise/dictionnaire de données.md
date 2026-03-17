## Dictionnaire de données

### 3.0 Conventions générales

* Toutes les entités ont par défaut :

  * `id` : `UUID`, **PK**
  * `created_at` : `TIMESTAMP`, NOT NULL, défaut = now()
  * `updated_at` : `TIMESTAMP`, NOT NULL, défaut = now()
* Les entités sensibles côté RGPD :

  * `Users` a aussi `deleted_at` pour la **suppression logique**.

Les types sont donnés à titre indicatif (PostgreSQL par ex.).

---
### 3.0 Entité ` User `

| Colonne        | Type | Description                  | Contraintes      |
| -------------- | -----| -----------------------------| --------------   |
| id             | UUID | Identifiant unique du compte | PK               |
| name           | TEXT | Prénom ou nom asso           | NOT NULL         |
| email          | TEXT | adresse email                | NOT NULL UNIQUE  |
| password       | TEXT | mot de passe                 | NOT NULL         |
| role_id        | UUID | id du role                   | NOT NUL          |
| city           | TEXT | nom de la ville              | NOT NULL         |
| postal_code    | TEXT | code postal                  | NOT NULL         |
| profile_picture| TEXT | photo de profil              | NOT NULL         |
| verified       | boolean | mention vérifié           | NOT NULL , 'false' par défaut |
| bio            | TEXT    | Présentation / texte libre| NULL, modifiable/supprimable  |
| active         | BOOLEAN | Actif ou non              | NOT NULL, default 'true'      |


### 3.1 Entité `Member`

| Colonne          | Type      | Description         | Contraintes          |
| -----------------| ----------| --------------------| ---------------------|
| id               | UUID      | Identifiant unique du membre         | PK                              |
| user_id          | UUID      | Identifiant unique du user           | NOT NULL, UNIQUE FK -> User(id) |
| gender           | ENUM ('homme', 'femme', 'non-binaire', 'autre')  | genre de la personne | NOT NULL |
| phone_number     | INT      | Numéro pour login / SMS               | UNIQUE, NOT NULL                |
| date_of_birth    | DATE     | Date de naissance (≥ 60 ans)          | NOT NULL                        |
| show_age         | BOOLEAN  | Choix visibilité âge                  | default 'true'                  |
| visibility       | ENUM     | Afficher ou non le statut en ligne    | default ONLINE                  |
| relation_type    | ENUM('amicale','amoureuse','les_deux')  | Type de relations recherchées  | NOT NULL|
| age_min          | INT      | Âge minimum recherché                 | NOT NULL                         |
| age_max          | INT      | Âge maximum recherché                 | NOT NULL, CHECK ≥ min            |
| deleted_at       | TIMESTAMP | date et heure de supression          | NULL                             |

---
### 3.2 Entité `Organization` 

| Colonne            | Type     | Description           | Contraintes         |
| -------------------| ---------| ----------------------| --------------------|
| id                 | UUID     | Identifiant unique du compte organization   | PK                              |
| siret              | TEXT     | SIRET de l’organization                     | UNIQUE, NOT NULL                |
| user_id            | UUID     | Identifiant unique du user                  | NOT NULL, UNIQUE FK -> User(id) |
| deleted_at         | TIMESTAMP| date et heure de supression                 | NULL                            |

---

### 3.3 Entité `Interest`

| Colonne     | Type         | Description                | Contraintes      |
| ----------- | ------------ | -------------------------- | ---------------- |
| id          | UUID         | Id centre d’intérêt        | PK               |
| name        | TEXT         | Intitulé (ex. “Randonnée”) | NOT NULL, UNIQUE |

---

### 3.4 Entité `UserInterest` (N–N user  ↔ intérêt)

| Colonne     | Type      | Description                | Contraintes                                   |
| ----------- | --------- | -------------------------- | --------------------------------------------- |
| user_id     | UUID      | Référence Users            | PK (user_id, interest_id), FK → Users(id)     |
| interest_id | UUID      | Référence centre d’intérêt | PK (user_id, interest_id), FK → Interest(id)  |

---

---

### 3.7 Entité `Event` (1-N user - évènement)

| Colonne          | Type                                                            | Description                                   | Contraintes                    |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------- | ------------------------------ |
| id               | UUID                                                            | Id Event                                      | PK                             |
|user_id           | UUID                                                            | Id du user                                    | NOT NULL , FK -> User(id)                      |
| title            | TEXT                                                            | Nom de l’Event                                | NOT NULL                       |
| description      | TEXT                                                            | Présentation détaillée                        | NOT NULL                       |
| address          | TEXT                                                            | Adresse (rue, numéro)                         | NOT NULL                       |
| postal_code      | TEXT                                                            | Code postal                                   | NOT NULL     |
| city             | TEXT                                                            |nom de la ville                               | NOT NULL                 |
| start_datetime   | TIMESTAMP                                                       | Date/heure de début                           | NOT NULL                       |
| end_datetime     | TIMESTAMP                                                       | Date/heure de fin                             | NOT NULL                       |
| visibility       | ENUM('public','prive')                                          | Visibilité                                    | NOT NULL, default 'public'     |
| max_participants | INTEGER                                                         | Jauge (nb max ≤ 1500)                         | NOT NULL, CHECK 1–1500         |
| illustration_url | TEXT                                                            | URL Image d’illustration                      | NULL                           |
| status           | ENUM('publie','complet','clos')                                 | Statut métier                                 | NOT NULL, default 'publie'     |
| deleted_at         | TIMESTAMP| date et heure de supression                 | NULL                            |

---

### 3.8 Entité `EventInterest` (N–N évènement ↔ intérêt)

| Colonne     | Type      | Description                | Contraintes                                    |
| ----------- | --------- | -------------------------- | ---------------------------------------------- |
| event_id    | UUID      | Référence Event        | PK (Event_id, interest_id), FK → Event     |
| interest_id | UUID      | Référence centre d’intérêt | PK (Event_id, interest_id), FK → Interest |

---


### 3.11 Entité `UserParticipationEvent` (N-N Users ↔ évènement )

| Colonne                   | Type                                                   | Description                                       | Contraintes                    |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------ |
| event_id                  | UUID                                                   | Event                                         |PK(event_id, user_id) FK → Event(id), NOT NULL   |
| particpants                   | UUID                                                   | Participant                                       |PK(event_id, user_id) FK → Users(id), NOT NULL |


### 3.12 Entité `Message` 

| Colonne               | Type      | Description                          | Contraintes                      |
| --------------------- | --------- | ------------------------------------ | -------------------------------- |
| sender_id             | UUID      | Expéditeur                           | PK , FK → User(id), NOT NULL          |
| receiver_id           | UUID      | Destinataire                         | PK , FK → User(id), NOT NULL          |
| content               | TEXT      | Contenu texte du message             | NOT NULL                         |
| sent_at               | TIMESTAMP | Date/heure d’envoi                   | NOT NULL                         |
| deleted_at            | TIMESTAMP | date et heure de supression          | NULL                            |

---


### 3.15 Entité `Role`
| Colonne               | Type  | Description            |  Contraintes            | 
| ----------------------| ------| -----------------------| ------------------------|
| id                    | UUID  | Id                     | PK                      |
| name                  | TEXT  | nom du role            |NOT NULL, default 'user' |