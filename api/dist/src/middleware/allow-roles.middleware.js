import { RoleName } from "@prisma/client";
import { decodeJWT, extractAccessTokenFromRequest } from "../lib/tokens.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
// Ce middleware est STATELESS => on n'appelle pas la BDD : le rôle est stocké dans le JWT lui même !
// roles est un tableau de RoleName [RoleName.member] [RoleName.member, RoleName.admin]
export function allowRoles(roles) {
    return (req, res, next) => {
        // Extraire l'access token depuis "req" pour tirer le JWT. on, le récup-re via le bearer
        const accessToken = extractAccessTokenFromRequest(req);
        if (!accessToken) {
            throw new UnauthorizedError("Missing access token");
        }
        // Verification du JWT (signature + date expiration) on y récupère le userId et le userRole
        const { userId, userRole } = decodeJWT(accessToken);
        // Vérifier si l'utilisateur a l'un des rôles demandés pour accéder à la route
        if (!roles.includes(userRole)) {
            throw new ForbiddenError(`Access denied for role: ${userRole}`);
        }
        // En général, on accroche également à la request (req) les infos utiles du JWT décodé
        // De sorte à ce que tous les middlewares suivants, puisse accéder facilement à l'utilisateur et son role
        req.userId = userId;
        req.userRole = userRole;
        // Sinon, on laisse passer
        next();
    };
}
