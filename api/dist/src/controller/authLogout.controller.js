import { prisma } from "../models/index.js";
export async function logoutUser(req, res) {
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
