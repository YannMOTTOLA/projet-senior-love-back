import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";

export async function logoutUser(req: Request, res: Response) {
    // Pour déconnecter l'utilisateur, il suffit de RETIRER l'accessToken + refreshToken côté client
    // -> si cookie, le backend peut renvoyer un autre cookie pour écraser celui existant

    //supression du refreshToken en BDD 
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(204).end(); // On termine la requête par une réponse
}