# Journal de bord SeniorLove SPRINT 2

## 11/12/12/2025

9h15 - 12h30

- Thomas : continuer fichier tests feature register oraganization
- Madouss : finir revue CSS, feature homePage (page d'accueil après conexion) (back)
- Saoussane : finir mon composant LoginForm => appel API + CSS
- Yann : commencer back office (back) 

13h30 - 17h30

- Madouss : revue css + back => affichage des profils match
- Yann : back => back office : ok
- Saoussane : front => avancement sur la partie loginForm (handler, axiosIntsance, useEffect)finir partie conexion 
- Thomas : fichier test en cours 


## 12/12/2025

9h15 - 

- Saoussane : font finir => (handler global) + style css
- Madouss : finir la revue css + continuer sur le back
- Yann : front  back office
- Thomas : fichier test terminés feature créaton asso => back terminé


## 15/12/2025

9h15 - 12h30

- Thomas : début front feature création asso 
- Madouss : fichier tests feature add profile matching endpoints
- Saoussane : autorisation role route FRONT + CSS feature login-form
- Yann : débeuguage Madouss => conflit entre la disposition des routes et des autorisations role => route /backoffice placé avant une autre qui à attribuer d'office les autorisation de roles au suivantes

10h15 => RDV avec Caroline : 
- Saoussane => questions : 
  - HTTPonly : normalement assez sécurisé , mais ils ne doivent s'afficher dans la console => stockage => url : http://localhost.... => aceesTokens + refreshToken affichés ici ( A REVOIR en SPRINT 3 )
  - connexion à la  création du compte automatique => A FAIRE par la suite
  - déconnexion => supression des cookies : pas necessaire car normalement ils ne sont pas visibles
  - pas réussi tests vers le container API docker => fair eune issue très détaillée 

- Yan : fait un point sur le back office
- Thomas : fait un point sur la feature create organization
- Madous : fait un point sur l'affichage des profils compatibles et les roles 

Prioriser nos tâches dans notre plannig : 
  - affichage du profil
  - gestion des messages 
  - navbar 
  - création d'évènement
  - affichage des évènements
  - affichage d'un évènement
  - back offiche => association

Partie association moins importante ... Se focaliser sur la partie interactions entre les users menbres et la création d'évènements

13h30 - 16h30
- Thomas : form organization (front: avec le style )
- Madouss : amélioration des cirières de filtres pour l'affichages des profils compatibles
- Saoussane : débueguage FRONT login-form + style css du formulaire
- Yann : affichage profil individuel (back) , aide (Madous + Saoussane), finit tests feature backOffice ?

## 16/12/2025

9h30 - 12h30

- Thomas : travailler sur la conexion front et back feature create organization
- Madouss : création composant profil card (front)
- Saoussane : finir revue de code feature login form + revoir mémorisation des indentifiants
- Yann : affichage profil individuel (front) + update profil , feature profil d'un autre user membre avc le shortId

13h15 - 

- Saoussane : test communication front et back pour présentation, feature logout
- Thomas : diapo présentation SPRINT 2
- Madouss: présentation , faire fonctionner back et front : feature profils compatibles
- Yann : débuegue CORS front et back , tests 

**A PENSER**
- présentation diapo du 17/12/2025

### 17/12/2025

9h15 - 12h15

Réunion BBB avec Caroline 

- faire une présentation finale travaillée => 20 min / groupe (12 à 15 min + 5 min de questions)
- pas de RDV le lundi avc Caroline 

- test d'intégration ?
- mettre une autorisation inverser pour les pages où le role n'est pas necessaire , dès que tu as rôle tu n'as plus accès à ses pages là => faire "se déconnecter"

- Yann : feature message (back)

13h30 - 16h

- Saoussane : finir le style css button Logout (pas fait), commencer CRUD évènement (createEvent)
- Thomas : commencer CRUD évènement (getAllEvents)
- Yann : avancer feature message (front)
- Madouss : avancer sur feature profils compatibles (front et back) => finit (améliorer css)
  
Fin SPRINT 2