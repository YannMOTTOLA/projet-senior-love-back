# SeniorLove - Backend

Ce dépôt contient la partie backend de l'application web **SeniorLove**, développée avec **Node.js**, **Express**, **TypeScript**, **Prisma** et **PostgreSQL**.

L'API permet de gérer l'authentification, les utilisateurs, les profils, les rôles, les conversations, les messages, les événements et le back-office d'administration.

---

## Démarrer le projet

### Installation

Clonez le dépôt et installez les dépendances :

```bash
git clone git@github.com:YannMOTTOLA/projet-senior-love-back.git
cd projet-senior-love-back/api
pnpm install
````

### Variables d'environnement

Créez un fichier `.env` dans le dossier `api` en vous basant sur le fichier `.env.example` :

```bash
cp .env.example .env
```

Puis renseignez les variables nécessaires :

```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=
GOOGLE_APPLICATION_CREDENTIALS=
DATABASE_URL=
SIRENE_API_TOKEN=
```

Exemple de `DATABASE_URL` en local :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/seniorlove
```

---

## Base de données

### Générer le client Prisma

```bash
pnpm run db:generate
```

### Lancer les migrations

```bash
pnpm run db:migrate:dev
```

### Remplir la base avec les données de départ

```bash
pnpm run db:seed
```

### Réinitialiser la base de données

```bash
pnpm run db:reset
```

---

## Lancer le serveur

### En développement

```bash
pnpm run dev
```

L'API sera disponible sur :

```txt
http://localhost:3001/api
```

### En production locale

```bash
pnpm run build
pnpm run start
```

---

## Lancer le projet avec Docker

Depuis la racine du projet :

```bash
docker compose up --build
```

Le `docker-compose` lance :

* une API Node.js/Express
* une base de données PostgreSQL
* Adminer pour consulter la base de données

Adminer est disponible sur :

```txt
http://localhost:8081
```

---

## Scripts disponibles

| Commande                      | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `pnpm run dev`                | Lance le serveur en développement                  |
| `pnpm run build`              | Compile le projet TypeScript                       |
| `pnpm run start`              | Lance la version compilée depuis le dossier `dist` |
| `pnpm run docker:start`       | Lance l'API dans le conteneur Docker avec Prisma   |
| `pnpm run db:generate`        | Génère le client Prisma                            |
| `pnpm run db:migrate:dev`     | Lance les migrations en développement              |
| `pnpm run db:migrate:deploy`  | Applique les migrations en production              |
| `pnpm run db:migrate:reset`   | Réinitialise la base de données                    |
| `pnpm run db:seed`            | Insère les données de départ                       |
| `pnpm run db:reset`           | Réinitialise la base et relance le seed            |
| `pnpm run db:studio`          | Ouvre Prisma Studio                                |
| `pnpm run test:unit`          | Lance les tests unitaires                          |
| `pnpm run test:spec`          | Lance les tests d'intégration                      |
| `pnpm run test:spec:coverage` | Lance les tests avec rapport de couverture         |

---

## Fonctionnalités principales

* Inscription et connexion utilisateur
* Authentification avec JWT
* Hash des mots de passe avec Argon2
* Gestion des rôles : membre, organisation, modérateur et administrateur
* Gestion des profils utilisateurs
* Recherche de profils compatibles
* Gestion des conversations
* Gestion des messages
* Création et consultation d'événements
* Recherche de villes
* Vérification de SIRET pour les organisations
* Back-office pour la gestion des membres
* Protection des routes selon les rôles
* Validation des données avec Zod
* Sécurisation de l'API avec Helmet, CORS et rate limiting

---

## Structure du projet

```txt
projet-senior-love-back/
├── api/
│   ├── src/
│   │   ├── controller/    # Logique des routes et traitement des requêtes
│   │   ├── router/        # Définition des routes de l'API
│   │   ├── middleware/    # Middlewares Express
│   │   ├── models/        # Modèles et scripts liés aux données
│   │   ├── services/      # Services métier
│   │   └── lib/           # Fonctions utilitaires
│   ├── prisma/            # Schéma Prisma, migrations et seed
│   ├── test/              # Tests du projet
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Technologies utilisées

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* Docker
* JWT
* Argon2
* Zod
* Helmet
* CORS
* Express Rate Limit
* Biome

---

## Routes principales

L'API expose notamment les routes suivantes :

```txt
/api/auth/register
/api/auth/register/organization
/api/auth/login
/api/auth/logout
/api/auth/refresh
/api/profile/me
/api/profile/:shortId
/api/profiles/alike/:id
/api/conversations
/api/conversations/:shortId/messages
/api/events
/api/cities/search
/api/backOffice/members
```

---

## Projet associé

Ce backend fonctionne avec le frontend disponible ici :

```txt
https://github.com/YannMOTTOLA/projet-senior-love-front
```
