# Journal de bord Yann SPRINT 1

## 04/12/2025

initialisation de la BDD + installation des dépendance.

Sous avons était confronté à un problème avec schema.prisma, en effet mon VS-code affichait une erreur me demandant de déclarer l'url de datasource dans un autre fichier, ce qui normalement n'est pas demandé en prisma 6.7 comme nous l'utilisons, j'ai donc perdu beaucoup de temps sur cette erreur qui n'en est finalement pas une.

Nous avons également eu un problème avec Docker-compose et le DockerFIle, n'arrivant pas à appliquer le seeding à distance alors que ce dernier s'appliquait en local. Après de longues recherches j'ai finalement réglé le problème en ajoutant l'export d'index.js se trouvant dans la génération de prisma (generated/prisma/index.js) et en modifiant le package.json, le script docker:start

```json
"docker:start": "npx prisma migrate deploy && node ./src/models/seeding.ts && node dist/index.js"
```

afin qu'il lance également le seeding de la base de donné, tout en utilisant cette fois si non pas les variables env locale mais celles initialisé pour le docker-compose

## 05/12/2025

Creation de la route + controller pour gérer la création d'un compte membre. implémentation d'un test.http afin de tester la features, en prenant soins de bien faire appel à chaque table de liaison, afin d'entrer toutes les informations nécéssaire. Modification de schéma afin de gérer les rôles avec un ENUM (il n'y en aura que 4, à savoir membre, association, admin et enfin modérateur).

j'ai également ajouté l'api cloud vision de google afin de filtrer les images que l'utilisateur utilisera pour sa photos de profiles, ou les images rataché à des évènements pour les associations, j'ai du pour cela créer un projet sur cloud vision, générer une clée api que j'ai ajouté aux variables d'environnement en local (il me reste à l'implémenter pour docker).
