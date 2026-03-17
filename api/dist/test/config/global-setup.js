// Fichier de configuration globale pour les tests d'intégration
import { execSync } from "node:child_process";
import { before, beforeEach, after } from "node:test";
import { app } from "../../src/app.js";
import { prisma } from "../../src/models/index.js";
let server;
// BEFORE = Se lance 1 fois avant l'ensemble des tests
before(() => {
    // (Hack) S'assurer qu'aucune BDD de test n'est préalablement lancée
    execSync(`docker rm -f seniorLoveTest 2>/dev/null || true`); // Note : '2>/dev/null' permet de ne rien écrire en console.
    // Créer la BDD de test ==> on n'a qu'à lancer un conteneur Postgres:18 avec Docker !
    execSync(`
    docker run \
      --name seniorLoveTest \
      -d \
      -e POSTGRES_USER=seniorLoveTest \
      -e POSTGRES_PASSWORD=seniorLoveTest \
      -e POSTGRES_DB=seniorLoveTest \
      -p 5437:5432 \
    postgres:18
  `);
    // Attendre une petite seconde pour s'assurer qu'elle tourne bien
    execSync(`sleep 1`);
    // Lancer les migrations sur cette BDD (=> objectif : avoir les tables)
    // Comment cette commande sait qu'elle doit écrire dans la BDD oquiztest / oquiztest / oquiztest (et non pas oquiz/oquiz/oquiz)
    // ==> il faut set des variables d'environnement
    // ==> elles sont définies dans le fichier .env.test
    // ==> comment les charger ? ==> --env-file=.env.test
    // ==> elles seront transmise au chil_process (execSync) par héritage directe des variables d'environnement
    execSync(`npx prisma migrate reset --force`);
    // Lancer un serveur HTTP de test
    server = app.listen(process.env.PORT); // 7357 pour les tests
});
// BEFOREEACH = Se lance 1 fois avant CHAQUE test
beforeEach(async (t) => {
    // Désactiver les logs des console.info()
    t.mock.method(console, "info", () => { });
    // Vider les données de la BDD de test (en concervant les tables existantes) => truncate
    await truncateTables();
});
// AFTER = Se lance 1 fois après tous les tests
after(async () => {
    // Eteindre le serveur HTTP
    server.close();
    // Deconnecter Node.js de la BDD
    await prisma.$disconnect();
    // Supprimer la BDD de test
    execSync(`docker rm -f seniorLoveTest`);
});
async function truncateTables() {
    // https://stackoverflow.com/questions/3327312/how-can-i-drop-all-the-tables-in-a-postgresql-database
    await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
}
;
