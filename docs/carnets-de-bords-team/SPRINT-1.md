# Journal de bord SeniorLove SPRINT 1

## 04/12/2025

9h15 - 12h

- Toute l’équipe : 
  - finir le git hub project => ok
  - architecture de projet => en cours
  - initialisation du projet back et front => en cours


- Saoussane : fichier évolutions possibles

13h15 - 17h
- Yann , Madouss et Saoussane : 
  - architecture de projet => en cours
  - initailisation du projet front => ok

- Madouss : branche "global style "
  - ajout reset.css
  - ajout index.css 
  - branche : "onboarding" => onborarding.tsx : structure général de l'app + onboarding.css

- Yann et Saoussane : branche " prisma-schema-initialization"
  - dockerfile api
  - docker compose
  - schema prisma

- Thomas : refaire un PDF du dictionniare de données et le mettre sur google drive STP  : 
    - changements => entité Event => "user_id " 
                  => entité UserParticipationEvent => "particpants"

## 05/12/2025

9h15 - 

Daily => attribution des features - fin estimé => mardi 9/12/2025

- Madouss : finir la page "onboarding" + la page "inscription" (choix association / membre) + la page "help" ?
- Yann : features "creation de compte membre" (back et front) + seeding BDD
- Thomas : features "creation compte association" (back et front)
- Saoussane : features "conexion à son compte" (back et front)

## 08/12/2025

9h15 - 12h40 

Daily => point sur l'avancement des features

- Madouss : finir la page pop up "etes-bous une asso?" + la page d'aide + mise en place du back.
- Yann : faire les tests : fait + le front 
- Thomas : module "vérification siret"
- Saoussane : débeuguage Docker + faire les tests et tout véirifer côté back

!!! CRéer une branche développe => puis faire ses branche d efeatures à partir de là

`git fetch`
`git fetch origin develop`
vérifier que vous avez bien toutes les branchses : `git branch -a`
`git checkout -b develop ` (créer la branche develop en local => en miroir de celle sur git )
créer sa branche à partir de "develop" (vérifier que vous ếtes bien sur la branche "develop" => `git checkout -b nom-feature develop`
faire un premier commit pour la voir apparaitre sur git hub) 
Pour les pull request => !!!! VERIFIER que vous le faite bien vers DEVELOP !!!!
` git log --oneline --decorate --graph -n 10`

14h - 17h

- Madouss : mise en place sur son poste
- Yann : début intégration feature register member
- Thomas : suite suite feature register organization
- Saoussane suite feature login user (finie , test manuels ok , manque tests automatisés)


## 09/12/2025

9h15 - 12h40
- Madouss : faire tourner son api avec Docker + aide Thomas + correction erreur CSS + présentation 
- Thomas : débeugue ton code feature register association+ api SIREN
- Yann : intégration front formulaire d'inscription membre
- Saoussane : faire tests automatisés feature login + intégration front du formulaire de conexion (pas fait)

14h - 16h

- Madouss : débeuguage Docker : ok , présentation SPRINT1 ,
- Thomas : débueguage code feature register association => ok , code lien avec API
- Yann : code feature register member (côté back)
- Saoussane : finir tests automatisés 

## 10/12/2025

9h15 - 12h

Rénion BBB avec Caroline : 
- objectifs sprint 2
  
- Thomas : débeuguage appel API SIRENE + tests manuels => ok
- Yann : Finit feature register member (front et back) UI + sécu => ok
- Madouss : revue CSS + débeugue VM (écran)
- Saoussane : tests unitaires feature login finis + auth/refresh 

13h15 - 16h45

13h30 Présentation (Yann et Saoussane) du SPRINT 1 avec SkillFusion
déploiement back : "render" ?
déploiement front : vercel ? (rendu payant sur un repo privé)

- Thomas : test automatisés
- Madouss et Yann : revue css
- Saoussane : intégration front feature login => manque call API + CSS

