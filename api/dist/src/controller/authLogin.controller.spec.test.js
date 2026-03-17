import { beforeEach, describe, it } from "node:test";
import { generateFakeMember, generateFakeOrganization, httpRequester } from "../../test/index.js";
import { prisma } from "../models/index.js";
import assert from "node:assert";
import argon2 from "argon2";
import jwt, {} from "jsonwebtoken";
describe("[POST] /api/auth/login auth/refresh with role", () => {
    const PASSWORD = "P4$$word";
    let memberUserEmail;
    let organizationUserEmail;
    beforeEach(async () => {
        // Création des rôles dans la BDD de test
        const roleMember = await prisma.role.create({ data: { name: "member" } });
        const roleOrganization = await prisma.role.create({ data: { name: "organization" } });
        const department = await prisma.department.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                code: "01",
                name: "Test Department",
            },
        });
        const city = await prisma.city.upsert({
            where: { id: 100 },
            update: {},
            create: {
                id: 100,
                name: "La Rochelle",
                postal_code: "17000",
                latitude: 46.1603,
                longitude: -1.1511,
                department_id: department.id,
            },
        });
        // Création d'un faux member dans la BDD de test
        const fakeMember = generateFakeMember({ password: PASSWORD });
        memberUserEmail = fakeMember.email;
        await prisma.user.create({
            data: {
                name: fakeMember.name,
                email: fakeMember.email,
                password: await argon2.hash(PASSWORD),
                role_id: roleMember.id,
                city_id: city.id,
                profile_picture: "https://picsum.photos/200",
            },
        });
        // Création d'un faux organization dans la BDD de test
        const fakeOrganization = generateFakeOrganization({ password: PASSWORD });
        organizationUserEmail = fakeOrganization.email;
        await prisma.user.create({
            data: {
                name: fakeOrganization.name,
                email: fakeOrganization.email,
                password: await argon2.hash(PASSWORD),
                role_id: roleOrganization.id,
                city_id: city.id,
                profile_picture: "https://picsum.photos/200",
            },
        });
    });
    it("should return a JWT with a payload containing the userId and userRole MEMBER", async () => {
        //ACT
        //login avec email et MP qui esxiste en BDD
        const { status, data } = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD
        });
        //ASSERT
        //Comparaison du statut http avec celui attendu en cas de succes de la requête => 200
        assert.equal(status, 200);
        // Stock l'accesToken
        const accessToken = data.accessToken;
        // Confirme les données recçues dans le JWT (id et le rôle dans notre cas)
        const decodedToken = jwt.decode(accessToken); // "jwt.decode" renvoie le type suivant : JWTPayload (objet) | string | undefined
        assert.ok(decodedToken.userId);
        assert.equal(decodedToken.userRole, "member");
        assert.ok(decodedToken.iat); // issued at (données renvoyés automatiquement par jwt)
        assert.ok(decodedToken.exp); // expires at (données renvoyés automatiquement par jwt)
    });
    it("should return a JWT with a payload containing the userId and userRole ORGANIZATION", async () => {
        //ACT
        //login avec email et MP qui esxiste en BDD
        const { status, data } = await httpRequester.post("/auth/login", {
            email: organizationUserEmail,
            password: PASSWORD
        });
        //ASSERT
        //Comparaison du statut http avec celui attendu en cas de succes de la requête => 200
        assert.equal(status, 200);
        // Stock l'accesToken
        const accessToken = data.accessToken;
        // Confirme les données recçues dans le JWT (id et le rôle dans notre cas)
        const decodedToken = jwt.decode(accessToken); // "jwt.decode" renvoie le type suivant : JWTPayload (objet) | string | undefined
        assert.ok(decodedToken.userId);
        assert.equal(decodedToken.userRole, "organization");
        assert.ok(decodedToken.iat); // issued at (données renvoyés automatiquement par jwt)
        assert.ok(decodedToken.exp); // expires at (données renvoyés automatiquement par jwt)
    });
    it("should generate an access token and refresh token", async () => {
        // ACT
        const { data } = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD
        });
        // ASSERT
        assert.ok(data.accessToken);
        assert.ok(data.refreshToken);
    });
    it("should reject the request if the user does not exist", async () => {
        // ACT
        // login avec une adresse mail qui n'existe pas en BDD 
        const { status } = await httpRequester.post("/auth/login", {
            email: "unknown@user.io",
            password: "P4$$word"
        });
        // ASSERT
        assert.equal(status, 400);
    });
    it("should reject the request if the password does not match", async () => {
        // ACT
        // login avec un mauvais MP
        const { status } = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: "Mauvais mot de passe"
        });
        // ASSERT
        assert.equal(status, 400);
    });
    it("should save the refresh token in database", async () => {
        // ACT
        // login pour obtenir un refresh token
        const { data } = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD,
        });
        const refreshToken = data.refreshToken;
        assert.ok(refreshToken, "RefreshToken bien retourné par l'API");
        //ASSERT
        // Vérification qu'il est stocker en BDD
        const storedRefreshToken = await prisma.refreshToken.findFirst({
            where: { token: refreshToken },
        });
        assert.ok(storedRefreshToken, "RefreshToken stocké en BDD");
        assert.equal(storedRefreshToken.token, refreshToken);
        assert.ok(storedRefreshToken.user_id);
        assert.ok(storedRefreshToken.issued_at);
        assert.ok(storedRefreshToken.expires_at);
    });
    it("should return the access token in the set-cookie headers", async () => {
        // ACT
        const response = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD
        });
        // ASSERT – vérifier que la réponse contient des cookies
        // vérifie qu'on reçoit bien le tableau "set cookie" dans les headers de la réponse
        const cookies = response.headers["set-cookie"];
        // confirme que les cookies sont dans le header
        assert.ok(cookies, "set-cookie est dans le header ");
        // que c'est bien un tableau
        assert.ok(Array.isArray(cookies), "set-cookie est dans un tableau");
        // qu'il y a au moins 1 cookies => token 
        assert.ok(cookies.length > 1, "il y a au moins un cookies dans les headers");
        // Vérifie que le cookies existe
        const accessCookie = cookies.find((cookie) => cookie.startsWith("accessToken="));
        assert.ok(accessCookie, "accessToken cookie est bien présent");
        // Optionnel : vérifier les attributs du cookie
        assert.ok(accessCookie.includes("HttpOnly"));
    });
    it("should return the refresh token in the set-cookie header on /auth/refresh", async () => {
        //D'abord, login pour obtenir le refresh token
        const loginResponse = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD
        });
        //Simuler un appel à /auth/refresh avec le cookie reçu
        const cookies = loginResponse.headers["set-cookie"];
        // confirme que les cookies sont dans le header
        assert.ok(cookies, "set-cookie est dans le header ");
        const refreshCookie = cookies.find((cookie) => cookie.startsWith("refreshToken="));
        assert.ok(refreshCookie, "refreshToken cookie should exist after login");
        // Extraire le token du cookie pour l'envoyer dans la requête
        const refreshTokenValue = refreshCookie.split(";")[0].split("=")[1];
        const refreshResponse = await httpRequester.post("/auth/refresh", { body: { refreshToken: refreshTokenValue } }, // ou laisser le cookie si le client l’envoie automatiquement
        { headers: { "Content-Type": "application/json", Cookie: `refreshToken=${refreshTokenValue}` } } // nécessaire si ton client ne gère pas les cookies
        );
        // Vérifier que le Set-Cookie est présent pour le nouveau refresh token
        const newCookies = refreshResponse.headers["set-cookie"];
        // confirme que les cookies sont dans le header (que la donnée n'est pas null)
        assert.ok(newCookies, "set-cookie est dans le header ");
        const newRefreshCookie = newCookies.find((c) => c.startsWith("refreshToken="));
        assert.ok(newRefreshCookie, "new refreshToken cookie should be present");
        // Vérifier HttpOnly
        assert.ok(newRefreshCookie.includes("HttpOnly"), "refreshToken cookie should be HttpOnly");
    });
    it("should reject the request if the refresh token does not exist in DB", async () => {
        // On simule un appel à /auth/refresh avec un faux token éronné 
        const fakeToken = "this-token-does-not-exist";
        const response = await httpRequester.post("/auth/refresh", { refreshToken: fakeToken }, { headers: { "Content-Type": "application/json" } });
        // ASSERT
        assert.equal(response.status, 401);
        assert.equal(response.data.error, "refresh token invalide");
    });
    it("should reject the request if the refresh token is expired", async () => {
        // 1. Login pour obtenir un refresh token valide
        const loginResponse = await httpRequester.post("/auth/login", {
            email: memberUserEmail,
            password: PASSWORD,
        });
        // utiliser le refreshToken donné dans le body = token (de la table RefreshToken)
        //ne pas utiliser le refreshToken envoyé dans le cookie car encodage probablement différent
        const refreshTokenValue = loginResponse.data.refreshToken;
        // 2. On force l’expiration du token en BDD
        // token n'est pas un champ unique dans le schéma Prisma généré, on utilise updateMany pour filtrer par token
        const storedRefreshToken = await prisma.refreshToken.findFirst({
            where: { token: refreshTokenValue },
        });
        //avec TS , valide que la donnée n'est pas null
        assert.ok(storedRefreshToken);
        await prisma.refreshToken.update({
            where: { id: storedRefreshToken.id },
            data: { expires_at: new Date(Date.now() - 1000) },
        });
        // 3. Appel à /auth/refresh avec ce token expiré
        const response = await httpRequester.post("/auth/refresh", { refreshToken: refreshTokenValue }, { headers: { "Content-Type": "application/json" } });
        // ASSERT
        assert.equal(response.status, 401);
        assert.equal(response.data.error, "refresh token expiré");
    });
});
