export class HttpError extends Error {
    // Attribut
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
export class BadRequestError extends HttpError {
    constructor(message) {
        super(message, 400);
    }
}
// Tu n'es pas authentifié
export class UnauthorizedError extends HttpError {
    constructor(message) {
        super(message, 401);
    }
}
// Tu es authentifié mais tu n'as pas les droits
export class ForbiddenError extends HttpError {
    constructor(message) {
        super(message, 403);
    }
}
export class NotFoundError extends HttpError {
    constructor(message) {
        super(message, 404);
    }
}
export class ConflictError extends HttpError {
    constructor(message) {
        super(message, 409);
    }
}
// Ecrire ça : new NotFoundError("ca n'existe pas"); 
//    Va automatiquement créer ça sous le capot :  new HttpError("ca n'existe pas", 404)
