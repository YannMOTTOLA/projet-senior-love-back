import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../../config.js";
import { prisma } from "../models/index.js";
import { UnauthorizedError } from "./errors.js";
export const ACCESS_TOKEN_DURATION_IN_MS = 1 * 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7j
export function decodeJWT(accessToken) {
    try {
        return jwt.verify(accessToken, config.jwtSecret);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError("Provided access token is expired");
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new UnauthorizedError("Provided access token is malformed");
        }
        throw new UnauthorizedError("JWT unknown error");
    }
}
export function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        userRole: user.role.name,
    };
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: ACCESS_TOKEN_DURATION_IN_MS / 1000,
    });
}
// export async function generateRefreshToken(user: User) {
//   const refreshToken = crypto.randomBytes(64).toString("base64");
//   await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
//   await prisma.refreshToken.create({
//     data: {
//       user_id: user.id,
//       token: refreshToken,
//       expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS)
//     }
//   });
export async function generateRefreshToken(user) {
    const refreshToken = crypto.randomBytes(64).toString("base64");
    await prisma.refreshToken.upsert({
        where: { user_id: user.id },
        update: {
            token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS),
        },
        create: {
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS),
        },
    });
    return refreshToken;
}
//   return refreshToken;
// }
export function extractAccessTokenFromRequest(req) {
    const authorizationHeader = req.headers.authorization;
    if (typeof authorizationHeader === "string") {
        return authorizationHeader.substring("Bearer ".length);
    }
    const accessTokenCookie = req.cookies.accessToken;
    if (typeof accessTokenCookie === "string") {
        return accessTokenCookie;
    }
    throw new UnauthorizedError("Access token not provided in Authorization headers nor Cookies");
}
