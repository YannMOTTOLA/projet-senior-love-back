# FEATURE : LOGIN 

**Objectif** : implémenter la foncitonnalité de ocnexion à son compte pour un User (membre + association)

**Support d'aide**:
- convention de nommage
- endpoint
- [projet oquiz d'Enzo](https://github.com/O-clock-Copenhague/SC01234-oquiz/blob/main/api/src/controllers/auth.controller.ts)

## Etapes

### 05/12/2025

1. création du router `authLogin.router.ts` + conexion à `index.router.ts`
2. création du controller ` authLogin.controller.ts`
3. vérifictaion que la route `/auth/login` fonctionne => `test.http`
4. créer une BDD en local : `sudo -i -u postgres psql`=> `CREATE ROLE seniorlove WITH LOGIN PASSWORD 'seniorlove';`=> `CREATE DATABASE seniorlove OWNER seniorlove;` => `GRANT ALL PRIVILEGES ON DATABASE seniorlove TO seniorlove;`
5. lancement de docker compose :
   - nettoyage de docker : supression de toutes les images et containers
   - beugue docker

### 08/12/2025

6. Beugue docker : (capture d'écran "Capture d'écran 2025-12-08-beugue-docker.png + Capture d'écran 2025-12-08-beugue-docker-suite.png ) => problème dans l'import du client prisma 
(avec pnpm le laisser en global, sans output : changement manuel d'où le client prisma est généré, plus simple sans input cra pas de gestion de chemin d'import et pas besoin de s'assurer que le PrismaClient est b ien copié dans mon build => /dist)

       - images + containers : ok
       - migrations BDD : ok
       - débeugage en cours : recherche avec l'ia
       - beugue résolu =>
         - retirer `output   = "./generated/prisma" `de api/prisma/shema.prisma`
         - modifier api/models/index.ts : ` import {PrismaClient}  from "@prisma/client";`
                                          `export const prisma = new PrismaClient(); `
                                          `export * from "@prisma/client"; `
        - commande dans le terminal : dans api ` pnpm run db:generate ` => génération du prisma client
        - relancer docker compose : ` docker compose -v ` `docker compose up --build `

- suite code feature login => finie test manuels ok , manque tests automatiques

## 09/12/2025

7. tests automatisés : 
   - lancer un container avec Docker pour la BDD  de test : BDD de test qui se lance et supprime automatiquement ls données de tests sur docker grâce au `test/config/global-setp.ts`+ `.env.test`
   - création d'une fonction pour générer un fausse organization => `test/index.ts`
   - tests fait jusqu'a => `it."should return the refresh token in the set-cookie header on /auth/refresh"`

## 10/12/2025

8.  finir tests automatisés : 
    - route auth/refresh
    - tests finis 

9.  intégration front du formulaire de conexion
    - début création composant `LoginFom` + intégration de la route dans  `App.tsx ` + `useNavigate` dans `Onboarding.tsx`
  
## 11/12/2025

    - Suite intégration (call API + css)
      - mise en place de axiosInstance => Plus d’appel direct à axios = c’est axiosInstance qui gère les cookies, les tokens, le refresh automatique.
      - mise en place d'un hook (useeffect) `useAuth.tsx` => centralise toute la logique d’auth => login => refresh => logout => état utilisateur
      - LoginForm => plus simple et propre, ne gère que la validation des données et l'UI

   - Côté back : autoriser les requêtes du front
     - ajout dans `App.tsx ` => `app.use(helmet({ crossOriginResourcePolicy: false })); `
                             => `app.use(cors({ origin: "http://localhost:5173" ou true, credentials: true }));`

    - modifictaion dans authLogin.controller.ts => `const rawToken = req.body?.refreshToken || req.cookies?.refreshToken`cra en front la vérifictaion du refreshToken est automatique mais à la première connexion (en front) le token n'existe pas, cela permet donc de renvoyer une erreur 401 "Unauthorized" visible uniquement depuis la console , silencieuse pour le user, il peut accéder au formulaire de conexion.
  
   Résumé pour la première connexion :
| Étape | Action | Résultat |
|-------|--------|----------|
| 1 | useAuth monte → appelle `refresh()` | - |
| 2 | `refresh()` appelle `/auth/refresh` | - |
| 3 | Backend renvoie 401 (pas de token) | - |
| 4 | Intercepteur voit 401 + URL=/auth/refresh | Rejette l'erreur ✅ |
| 5 | `catch` dans `refresh()` attrape l'erreur | `setUser(null)` ✅ |
| 6 | `finally` set `isLoading = false` | Page prête ✅ |

   L'utilisateur est pas connecté, et il peut accéder au formulaire de login. Pas d'erreur en console (ou juste un 401 normal).
   
**A PENSER :**
un AuthProvider pour partager l’état dans toute l’app ?
un PrivateRoute pour protéger les pages ?
une redirection automatique après login ?
un système de rôles (admin, user…),
ajouter commande dans docker pour relancer `pnpm run db:generate` a chaque build ou up

**Notes :**
`ẁithCredentials`: boolean qui dit " ok vanigateur tu peux me renvoyé :"
   Les cookies associés au domaine:
      Exemples :
         refresh token HTTPOnly
         session ID
         cookies de sécurité
         cookies SameSite / Secure

## 12/12/2025

- sépartion du handleSubmit => handlers/authHandler.tsx
- import de authHandler.tsx dans LoginForm.tsx
- tentative mettre la connexion automatique à la création du compte => fail **(A REVOIR)**
- mise à jour de develop (FRONT) => mise à jour de login-form (FRONT)
- beugue en FRONT => quand je test l'inscription j'ai une erreur 500 , puis une 204 et mon user et bien enregistrer dans ma BDD .... je ne omprends pas 
  - résolution du conflit => j'avais une ancienne version d'une migration prisma dans le cache prisma qui était prise en compte à la création du user (voir capture d'écran) => reset la migration => reset la BDD => tests ok 🥳

**A PENSER**
- modifier test retour user dans la route auth/refresh

## 15/12/2025

- côté FRONT : gestion autorisation roles sur les routes 
  - code beugué => recherche pendant toute la journée (confusion entre hook, context, useEffect etc ) 
    - débuegué grâce à l'IA
    - code revu, commenté et expliqué => FONCTIONNE 
  - ajout du style CSS
  
**A PENSER** 

**En sprint 3 :** HTTPonly : normalement assez sécurisé , mais ils ne doivent s'afficher dans la console => stockage => url : http://localhost.... => aceesTokens + refreshToken affichés ici ( A REVOIR en SPRINT 3 ) => VU OK

## 16/12/2025

- côté front : finir de revoir le code de l'IA (commenté et expliqué)
- correction de la focntionnalité rememberMe => ok 
- logout => ok coté front et back => revoir le CSS du button

## 17/12/2025

- faire GIT PULL back et front !!!!
- Logout : 
  - revoir style css du button (front)
  - faire test logout (back)

**A PENSER**
- affichage compte perso association


## 18/12/2025

commandes pour reset migration prisma :`npx prisma migrate reset` =>`y` => `npx prisma migrate dev`=> `pnpm db:reset` (peut être un peu long car gros seeding avec es communes de France)

pour tester httpOnly (cookie) => dans la console navigateur => `console.log(document.cookie)`

- revoir button css => pas encore fait
- continuer createEvent-feature (back) => finit et tests manuels ok

**A penser avant PROD**
- dans authLogin.controller.ts =>  `setTokensInCookies()` : 
  - `secure : true`au lieu de false 
  - `sameSite: "strict"`au lieu de lax
- vérifier que logout supprime bine le refreshToken de la BDD
- HTTPS obligatoire pour la prod


## 19/12/2025

- faire formulaire et page de création d'Event => ok finit : revoir CSS + gestion d'erreur
- revoir style button logout => pas fait 


**A penser avant PROD**
- dans authLogin.controller.ts =>  `setTokensInCookies()` : 
  - `secure : true`au lieu de false 
  - `sameSite: "strict"`au lieu de lax
- vérifier que logout supprime bine le refreshToken de la BDD
- HTTPS obligatoire pour la prod

## 22/12/2025

- style button CSS => fait par Yann
- 