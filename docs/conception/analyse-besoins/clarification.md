## BRAINSTORMING sur les besoins du client

- pas de précisions sur l'aspect technique du client
- prendre le SEO en compte
- RGPD
- Accessibilité

### UTILISATEURS

  - inscription "asso" (creation-association.md)
    - inscription via formulaire : nom de l'asso, SIRET, date de création, justificatif, logo
    - ajout d'un basge asso 

  - inscription "particulier"
    - inscription via facebook
    - formulaire => nom pénom mail téléphone date de naissance ville pseudo photo de profil
    - texte de présentation (bio) ? 
    - mail ou sms de vérification email et récupération
    - demande des centres d'intérêts
    - relations recherchées (amicale, amoureuse)
    - catégorie d'âge recherchée 
    - double authentification ?
    - membre d'une asso (nom) ?

    - profil vérifiés => api de vérification (pièce d'identité, comparaison de visage ...) API smart vérify ??

      - conexion 
        - connexion via facebook 
        - formulaire => pseudo / mail / tel mp
        - possibilité mp temporaire (sms /mail)
        - possibilité de " se souvenir de moi"
        - reconnaissance FaceId 
        - récupération du mot de passe

      - profils
        -  modifier:
          - texte de présentation (bio)
            -  photo de profil
            -  toutes les infos du compte
            - la visibilité de l'âge (date de naissance ou tranche d'âge)
            - centres d'intérêts
            - statut de disponibilitée en ligne
        - supprimer:
            - suppression du compte (enquête au sujet de la raison) 
            - centres d'intérêts
            - présentation (bio)
      
      - Possibilité de signaler un profil

### EVENEMENTS


  - création d'un évènement par un utilisateur ou une asso 
    - nom de l'évènement
    - présentation
    - lieu
    - date
    - visibilité (privé ou public)
    - illustration ?
    - jauge d'inscription ? (max 1500)
    - centres d'intérêts

  - mofification d'un évènement
    - nom de l'évènement
    - présentation
    - lieu
    - date
    - visibilité (privé ou public)
    - illustration ?
    - jauge d'inscription ? (max 1500)
    - centres d'intérêts

  - Ajout de système de note à l'évènement et commentaires
  - Close de l'évènement automatique après dépassement de la date de l'évènement
  - Suppresion complète de l'évènement (création d'un message de prévenance destiné aux personnes ayant rejoint l'évènement)

### MESSAGERIE

  - Creation d'une conversation 
    - Creation de conversations de groupes
    - Suppression des conversations
    - Possibilité de signaler un message avec des catégories (ex : incitation à la haine/ contenu inapproprié)
  - Messages privés
    - Pastille distribué/lu
    - Animation "en cours d'écriture" 
    - Modification des messages pendant un laps de temps avec une indication de modif (pastille)
    - Suppression des messages avec indications de suppression (pastille)
    - Envoi de médias (audio, vidéo, photos, GIF) 
    - call (à voir)
    - Réactions emojis aux messages
    - Faire une recherche à l'intérieur d'une conversation
    - Possibilité de cibler une réponse à un message

  - Conversation groupes
    - Possibilité de mentionner un utilisateur
    - Ajout/suppression d'utilisateur par Admin du groupe
    - Possibilité de quitter un groupe



### BACK-OFFICE DE MODERATION

  - Gestion des profils Utilisateurs/Asso
    - Moderation 
      - Dashboard
        - nombre d’utilisateurs actifs
        - nombre d’assos vérifiées / en attente
        - nombre d'événements créés
        - signalements en attente 
        - messages signalés
        - profils à vérifier (ID / visage)
        - stats journalières
      - Modération utilisateurs / associations
        - Liste utilisateurs
        - fiche utilisateurs
          - infos du compte
          - historiques d'activité 
          - historiques de signalement
          - signalements reçus non consultés
        - actions modérateur 
          - bannir temporairement (24h/7j/30j)
          - bannir définitivement
          - retirer la photo de profil (envoi d'une notification à l'utilisateur)
          - retirer le pseudo (envoi d'une notification à l'utilisateur)
          - supprimer le compte de l'application (pas dans la BDD)
      - Gestion des rôles / permissions
        - admin (création de modérateurs + toutes les permissions)
        - modérateur (messagerie / évenements)