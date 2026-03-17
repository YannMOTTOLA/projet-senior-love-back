## Dictionnaire de données

### 3.0 Conventions générales

* Toutes les entités ont par défaut :

  * `id` : `UUID`, **PK**
  * `created_at` : `TIMESTAMP`, NOT NULL, défaut = now()
  * `updated_at` : `TIMESTAMP`, NOT NULL, défaut = now()
* Les entités sensibles côté RGPD :

  * `Utilisateur` a aussi `deleted_at` pour la **suppression logique**.

Les types sont donnés à titre indicatif (PostgreSQL par ex.).

---

### 3.1 Entité `Utilisateur`

Compte unique pour **particulier**, **association**, **admin**, **modérateur**.

| Colonne                      | Type                                              | Description                                     | Contraintes                           |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| created_via                  | ENUM('form','facebook')                           | Origine du compte                               | NOT NULL, default 'form'              |
| verification_status          | BOOLEAN                                           | Statut vérification identité                    | NULL                                  |
| is_2fa_enabled               | BOOLEAN                                           | Double authentification activée                 | default FALSE                         |
| two_fa_method                | ENUM('sms','email')                               | Méthode 2FA                                     | NULL si désactivé                     |
| banned_until                 | TIMESTAMP                                         | Date/heure jusqu’à laquelle le compte est banni | NULL si non banni                     |
| last_login_at                | TIMESTAMP                                         | Dernière connexion réussie                      | NULL si jamais                        |


### 3.2 Entité `CompteExterne` (auth social, p.ex. Facebook)

| Colonne          | Type                       | Description                     | Contraintes                    |
| ---------------- | -------------------------- | ------------------------------- | ------------------------------ |
| id               | UUID                       | Id                              | PK                             |
| user_id          | UUID                       | Utilisateur lié                 | FK → Utilisateur(id), NOT NULL |
| provider         | ENUM('facebook', 'google') | Fournisseur d’identité          | NOT NULL                       |
| provider_user_id | TEXT                       | Id utilisateur chez le provider | NOT NULL, UNIQUE               | 


### 3.8 Entité `ParticipationEvenement` (N-N utilisateur ↔ évènement )

| Colonne                   | Type                                                   | Description                                       | Contraintes                    |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------ |
| has_liked                 | BOOLEAN                                                | L’utilisateur a mis un “like” sur l’événement     | default FALSE                  |
| comment                   | TEXT                                                   | Commentaire sur l’événement (après participation) | NULL                           |

### 3.9 Entité `Conversation`

| Colonne            | Type                    | Description                | Contraintes          |
| ------------------ | ----------------------- | -------------------------- | -------------------- |
| id                 | UUID                    | Id conversation            | PK                   |
| type               | ENUM('privee','groupe') | Type de conversation       | NOT NULL             |
| created_by_user_id | UUID                    | Créateur                   | FK → Utilisateur(id) |
| title              | TEXT                    | Titre (groupes uniquement) | NULL pour privé      |
| last_message_at    | TIMESTAMP               | Date du dernier message    | NULL                 |

### 3.10 Entité `ConversationParticipant`

| Colonne         | Type                   | Description                           | Contraintes                      |
| --------------- | ---------------------- | ------------------------------------- | -------------------------------- |
| conversation_id | UUID                   | Référence conversation                | PK (conversation_id,user_id), FK |
| user_id         | UUID                   | Participant                           | PK (conversation_id,user_id), FK |
| role            | ENUM('membre','admin') | Rôle dans le groupe                   | NOT NULL, default 'membre'       |
| joined_at       | TIMESTAMP              | Date d’entrée dans la conversation    | NOT NULL                         |
| left_at         | TIMESTAMP              | Date de sortie (si quitté)            | NULL                             |
| is_muted        | BOOLEAN                | Conversation silencieuse pour ce user | default FALSE                    |

### 3.11 Entité `Message` (1-N conversation ↔ messages )

| Colonne               | Type                   | Description                                        | Contraintes                      |
| --------------------- | ---------              | ------------------------------------               | -------------------------------- |
| conversation_id       | UUID                   | Conversation                                       | FK → Conversation(id), NOT NULL  |
| replied_to_message_id | UUID      | Message auquel on répond             | NULL, FK → Message(id)           |
| edited_at             | TIMESTAMP | Date/heure de dernière édition       | NULL                             |

### 3.12 Entité `MessageMedia`

| Colonne       | Type                                        | Description             | Contraintes                |
| ------------- | ------------------------------------------- | ----------------------- | -------------------------- |
| id            | UUID                                        | Id média                | PK                         |
| message_id    | UUID                                        | Message parent          | FK → Message(id), NOT NULL |
| media_type    | ENUM('image','video','audio','gif','autre') | Type de média           | NOT NULL                   |
| url           | TEXT                                        | URL du fichier stocké   | NOT NULL                   |
| thumbnail_url | TEXT                                        | Miniature (optionnelle) | NULL                       |
| file_size     | INTEGER                                     | Taille en octets        | NULL                       |

---

### 3.13 Entité `MessageReaction`

| Colonne                                 | Type        | Description                       | Contraintes                    |
| --------------------------------------- | ----------- | --------------------------------- | ------------------------------ |
| id                                      | UUID        | Id                                | PK                             |
| message_id                              | UUID        | Message concerné                  | FK → Message(id), NOT NULL     |
| user_id                                 | UUID        | Utilisateur qui réagit            | FK → Utilisateur(id), NOT NULL |
| emoji_code                              | TEXT32) | Emoji utilisé (caractère ou code) | NOT NULL                       |
| created_at                              | TIMESTAMP   | Date de réaction                  | NOT NULL                       |
| UNIQUE(message_id, user_id, emoji_code) |             | Empêche doublons                  |                                |

---

### 3.14 Entité `MessageStatutUtilisateur` (distribué / lu)

| Colonne                     | Type                          | Description                        | Contraintes                    |
| --------------------------- | ----------------------------- | ---------------------------------- | ------------------------------ |
| status_at                   | TIMESTAMP                     | Date/heure du dernier changement   | NOT NULL                       |

### 3.15 Entité `SignalementMessage`

| Colonne                 | Type                                                                       | Description                     | Contraintes                    |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------- | ------------------------------ |
| id                      | UUID                                                                       | Id signalement                  | PK                             |
| message_id              | UUID                                                                       | Message signalé                 | FK → Message(id), NOT NULL     |
| reporter_id             | UUID                                                                       | User qui signale                | FK → Utilisateur(id), NOT NULL |
| reason_type             | ENUM('contenu_inapproprie','harcelement','haine','arnaque','spam','autre') | Type de motif                   | NOT NULL                       |
| description             | TEXT                                                                       | Détail libre                    | NULL                           |
| status                  | ENUM('ouvert','en_cours','clos')                                           | Statut de traitement            | NOT NULL, default 'ouvert'     |
| handled_by_moderator_id | UUID                                                                       | Modérateur ayant traité         | FK → Utilisateur(id), NULL     |
| handled_at              | TIMESTAMP                                                                  | Date de résolution              | NULL                           |
| created_at              | TIMESTAMP                                                                  | Date de création du signalement | NOT NULL                       |

---

### 3.16 Entité `SignalementProfil`

| Colonne                 | Type                                                                       | Description          | Contraintes                    |
| ----------------------- | -------------------------------------------------------------------------- | -------------------- | ------------------------------ |
| id                      | UUID                                                                       | Id signalement       | PK                             |
| reported_user_id        | UUID                                                                       | Profil signalé       | FK → Utilisateur(id), NOT NULL |
| reporter_id             | UUID                                                                       | User qui signale     | FK → Utilisateur(id), NOT NULL |
| reason_type             | ENUM('contenu_inapproprie','harcelement','haine','arnaque','spam','autre') | Motif                | NOT NULL                       |
| description             | TEXT                                                                       | Commentaire libre    | NULL                           |
| status                  | ENUM('ouvert','en_cours','clos')                                           | Statut de traitement | NOT NULL, default 'ouvert'     |
| handled_by_moderator_id | UUID                                                                       | Modérateur traitant  | FK → Utilisateur(id), NULL     |
| handled_at              | TIMESTAMP                                                                  | Date de résolution   | NULL                           |
| created_at              | TIMESTAMP                                                                  | Date de création     | NOT NULL                       |

---

### 3.17 Entité `EnqueteClotureCompte`

| Colonne      | Type                                                                                                      | Description          | Contraintes                  |
| ------------ | --------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------- |
| id           | UUID                                                                                                      | Id                   | PK                           |
| user_id      | UUID                                                                                                      | Utilisateur concerné | FK → Utilisateur(id), UNIQUE |
| reason_type  | ENUM('trouve_un_partenaire','pas_assez_dutilisateurs','problemes_techniques','probleme_securite','autre') | Catégorie            | NOT NULL                     |
| comment      | TEXT                                                                                                      | Raison détaillée     | NULL                         |
| submitted_at | TIMESTAMP                                                                                                 | Date de soumission   | NOT NULL                     |

> La suppression de compte côté métier = remplissage éventuel de cette enquête + `deleted_at` sur `Utilisateur`.
