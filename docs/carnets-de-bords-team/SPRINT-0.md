# Journal de bord SeniorLove SPRINT 0

## 26/11/2025

Toute l'équipe

- 13h00 - 16h30
    1. Discussion/Intro + Revu du cahier des charge
    2. Brainstorming + User stories
    3. Planning du lendemain : 
       - choix stacks techniques
       - créer notre git project
       - route 
       - arborescence du projet (modele de conception du projet front et back)
       - MCD / MPD => BDD
       - dictionnaire de données / receuil de données

## 27/11/2025

Toute l'équipe

- 9h00 - 12h30 (pause 15min)
    1. mise en place des dossiers de conception dans le projet    
    2. choix stacks techniques
    3. endpoints
    4. wireframes

- 13h30 - 16h30
    1. MVP + Wireframes

- Planning du lendemain : 
      - justifier le stacks techniques
       - créer notre git project
       - arborescence du projet (modele de conception du projet front et back) A VERIFIER
       - MCD / MPD => BDD
       - dictionnaire de données / receuil de données
       - maquette
       - charte graphique

## 28/11/2025

Toute l'équipe

9h - 12h30

1. RDV avec Caroline (1h) => présentation du projet, MVP, wireframe, user-stories

MCD très important 

arborescence du site côté front => depuis la page d'accueil je peux aller où ? (pop ne compte pas dans l'arbo , seules les routes comptes côté front (route en react))

uses cases => évelopper les user-stories comme au début (metre son nom , prenom etc pour créer so profil)

analyse des rsiques => moyens humains , risques techniques (failles sécu, injection XXS etc ....)

pensée la BDD (scalable)

2. Correction après le RDV
   - 2 teams : 
     - Yann et Madouss => Wireframes
     - Thomas et Saoussane => présentation projet, MVP / user stories, évolutions possibles

- 13h30 - 16h 
   - 2 teams : 
     - Yann et Madouss => charte graphique (couleur, police)
     - Thomas et Saoussane => endpoints , dictionnaires de données
     - Yann : arborescence + Role-Based Acces Control
     - Madouss : Maquette

## 01/12/2025

9h - 12h

Partage des tâches:
- Thomas , Saoussane : dictionnaire de données + dictionnairs de données facultatives
- Madouss : maquette
- Yann : analyse des risques + USES CASES

13h - 16h30
RDV avec  Caroline à 13h15
notes: penser à revoir ces documents à chaque modification
- présentation : ok
- définition des besoins et objectifs : ok
- MVP : ok => ajouter dans un autre fichier avec les evolutions possibles (par rapport au user stories evolutions)
- stack techniques : ok + justifier archi de projet
- wireframe : ok => retravailler le partie centre d'intérêts (en afficher 2 ou 1 si mot long sur mobile)
  - UX : faire une barre de recherche des centre d'intérêts a la création (profil / évènement / associations)
- arborescence : ok (revue => final-arborescence)
- userstories : ok 
- analyse des risques
- uses cases : ok

Présentation : présenter l'application 15 min
maquette , MCD ou ERD , fonctionnalités principales

- Madouss : maquette
- Yann et Saoussane : MCD + revue dictionnaires de données

Reste à faire : 
- finir maquette / charte graphique
- diagramme ERD :  MPD (BDD)
- organisation des sprints (git hub project)
- architecture de projet en interne + convention de nommage 
- diagramme architecture
- diagramme d'activité 
  
Pour Thomas : faire un nouveau PDF dictionnaire de données car modif apportés STP + ajouter au drive => ok 


## 02/12/2025

9h15 - 12h

- Madouss : maquette
- - Yann : convention de nommage 
- Thomas, Saoussane, Yann : MLD 


13h15 - 16h 

RDV avec Caroline 13h30:
- MERISE = MCD , MLD , MPD (fichier qui ressemble beaucoup à un script SQL)
- faire un ERD (sens des cardinalité inversés du MCD)
- -charte hraphique : ok

- Madouss : charte graphique : ok, maquette : en cours
- Yann : MCD, MLD
- Saoussane : dictionnaires de données + présentation
- Thomas : ERD, MPD


## 03/12/2025

9h - 12h30

Point avec l'équipe sur la présentation du SPRINT 0 

9h15 : réunion BDD avec Caroline et les collègues de formation

**Sprint 1 => objectifs :**
- mettre en place le projet
- install config (vs code git hub )
- serveur, BDD, front end 
- intégration (front)
- CRUD ,API
- avoir une fonctionnalité qui marche 
- déployer avant le sprint 2 (pas obligatoire mais à garder ne tête pour le début du sprint 2, déploiement libre : VM kourou , Vercel/supabase)
 
 - repsonsive : mobile first
 - sécurité
 - RGPD
 - sémantique ( balises HTML, stattus HTTP)
 - acecssibilité
 - UX

- Commits très réguliers , détaillé et en anglais
- faire une branche "dév" , puis d'autres branches pour chaque fonctionnalité => pull request vers dev => puis pull request de dev vers main (branche de déploiement) (possibilité de mettre des contraibtes sur git hub sur la branche main et dev pour toujours passer dans des pull request avant de push )
- possibilité de faire aussi un merge de la branche développe sur sa branche de travail (foncitonnnalité) pour gérer les conflits puis => pull request sur la branche développe = évite les conlits.

Dans le code : 
- faire des commentaires détaillés
- faire le README (installation , déploiement) => compréhensible par un novice (toutes les commandes et procdures d'install et de déploiement)
- tests unitaires 

En cas de problème : 
- en parler en ésuipe
- issues (suivre le template pour bien le documenter)

**Présentation du projet des collègues**

Super présentation de Madouss et Thomas 🎊 🎉

Notes présentation : 
- penser à mettre les couleurs de notre appli dans notre présentation
- Supabase (stockage de médias gratuit avec limite )


13h45 - 16h

Toute l'équipe : 
- git hub project


Fin SPRINT 1



