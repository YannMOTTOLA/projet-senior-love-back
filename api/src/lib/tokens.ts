import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Request } from "express";
import { config } from "../../config.ts";
import { prisma } from "../models/index.ts";
import type { User, RoleName } from "../models/index.ts";
import { UnauthorizedError } from "./errors.ts";

export const ACCESS_TOKEN_DURATION_IN_MS = 1 * 60 * 60 * 1000; // 1h
export const REFRESH_TOKEN_DURATION_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7j

export interface AccessTokenPayload {
  userId: string;
  userRole: RoleName;
  iat?: number;
  exp?: number;
}

export function decodeJWT(accessToken: string): AccessTokenPayload {
  try {
    return jwt.verify(accessToken, config.jwtSecret) asa AccessTokenPayload;

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Provided access token is expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Provided access token is malformed");
    }

    throw new UnauthorizedError("JWT unknown error");
  }
}

export function generateAccessToken(user: {
  id: string;
  role: { name: RoleName };
}) {
  const payload = {
    userId: user.id,
    userRole: user.role.name,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: ACCESS_TOKEN_DURATION_IN_MS / 1000,
  });
}

export async function generateRefreshToken(user: User) {
  const refreshToken = crypto.randomBytes(64).toString("base64");

  await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS)
    }
  });
  // export async function generateRefreshToken(user: { id: string }) {
  //   const refreshToken = crypto.randomBytes(64).toString("base64");

  //   await prisma.refreshToken.upsert({
  //     where: { user_id: user.id },
  //     update: {
  //       token: refreshToken,
  //       expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS),
  //     },
  //     create: {
  //       user_id: user.id,
  //       token: refreshToken,
  //       expires_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_IN_MS),
  //     },
  //   });

  //   return refreshToken;
  // }

  return refreshToken;
}

export function extractAccessTokenFromRequest(req: Request) {
  const authorizationHeader = req.headers.authorization;

  if (typeof authorizationHeader === "string") {
    return authorizationHeader.substring("Bearer ".length);
  }

  const accessTokenCookie = req.cookies.accessToken;
  if (typeof accessTokenCookie === "string") {
    return accessTokenCookie;
  }

  throw new UnauthorizedError(
    "Access token not provided in Authorization headers nor Cookies"
  );
}
