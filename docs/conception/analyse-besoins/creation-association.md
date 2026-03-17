Création de compte association
 
 - **Champs clés**
    - `Nom` (obligatoire, texte court, signaler “Nom requis”).
    - `SIRET` (obligatoire, 14 chiffres, appel API SIRENE = justificatif unique du MVP, erreur “SIRET invalide/déjà
  utilisé” si KO).
    - `Date de création` (obligatoire, calendrier, refuser dates futures).
    - `Logo` (facultatif, image ≤5 Mo avec aperçu).
    - `Badge asso vérifiée` (statut issu du résultat SIRET : gris “en attente” → vert quand l’API confirme).
    - `Mot de passe` (obligatoire, règles fortes, stockage hashé côté back).

  - **UX multi-écrans / retour arrière**
    - Étapes : (1) infos générales → (2) visuels → (3) récap & soumission.
    - Bouton “← Retour” garde les champs préremplis + message “Vos infos sont conservées”.
    - Après soumission, message “Vérification SIRET en cours” avec badge grisé.

  - **Cas d’erreurs à anticiper**
    - Front : champs manquants/formats invalides, SIRET rejeté ou indispo API (toast “Service SIRENE indisponible”),
  fichier logo trop lourd, mot de passe faible.
    - Back : 409 si SIRET existant, 422 si validation Zod échoue, 503 lors d’indisponibilité SIRENE, 500 upload/BDD/
  Argon2 (message générique + log).