import argon2 from "argon2";
import z from "zod";
import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import { BadRequestError, UnauthorizedError } from "../lib/errors.ts";
import {
  ACCESS_TOKEN_DURATION_IN_MS,
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_DURATION_IN_MS,
} from "../lib/tokens.ts";
//import { log } from "node:console";

export async function loginUser(req: Request, res: Response) {

  // Schéma de validation pour le login (email, password) envoyés par le user via le formulaire
  const loginBodySchema = z.object({
    email: z.email(),
    password: z.string() // cette validation suffit ici car on va de toute manière comparer les hash ensuite
  });

  // Récupération de l'email et le mot de passe depuis le body => validation avec le schéma
  const { email, password } = await loginBodySchema.parseAsync(req.body);

  // Récupération de l'utilisateur qui correspont dans la BDD 
  // inclure la relation `role` car `generateAccessToken` a besoin de `user.role.name`
  const user = await prisma.user.findUnique({
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      role_id: true,
      city: {
        select: {
          id: true,
          name: true,
          postal_code: true,
          latitude: true,
          longitude: true,
        },
      },
      profile_picture: true,
      verified: true,
      bio: true,
      active: true,
      banned_until: false,
      deleted_at: true,
      created_at: true,
      updated_at: true,
      role: true
    },
    where: { email },
  });

  // Gestion de l'erreur dans le cas où l'utilisateur n'est pas trouvé dans la BDD (surment parcequ'il n'existe pas) , message vague
  if (!user) { throw new BadRequestError("L'email et le mot de passe ne correspondent pas"); }

  // vérifier que le mot de passe entré par le user correspond au MP hashé dans la BDD
  const matchingPassword = await argon2.verify(user.password, password);

  // Gestion de l'erreur : si no match, message vague pour ne pas aiguiller le user (sécurité)
  if (!matchingPassword) { throw new BadRequestError("L'email et le mot de passe ne correspondent pas") }

  // Générer le JWT unique pour chaque User
  const accessToken = generateAccessToken(user);

  // Générer le refresh JWT
  const refreshToken = await generateRefreshToken(user);

  // Envoyer les tokens dans des cookies HTTP
  setTokensInCookies(res, accessToken, refreshToken);

  const { password: _password, ...userWithoutPassword } = user

  // Renvoyer l'access token (JWT) + refresh token (opaque) dans le body + le user sans son password
  res.json({ accessToken, refreshToken, user: userWithoutPassword });
}

export async function refreshAccessToken(req: Request, res: Response) {
  // objectif : 
  // - vérifier que le refresh token est toujours valide 
  // - générer un nouvel accesToken et un nouveau refresh token

  //Récupérer le JWT depuis req
  // ces deux alternatives permettent à l'API de récupérer le refresh token quelle que soit la méthode choisie par le client:
  //- avec REACT , dans le body : corps de la requête (ex: POST /refresh avec {refersjToken:"..."}) => HTTPS obligatoire
  //- avec cookie HTTP-only : cookies non accessible via JavaScript (protection contre les failles XXS), 
  // le navigateur l'envoie automatiquementavec chaque requête à l'API,
  // plus sécurisé => configuration côté serveur (cookies sécurisés, ...)

  const rawToken = req.body?.refreshToken || req.cookies?.refreshToken

  if (!rawToken) {
    return res.status(401).json({
      message: "Aucun refresh token fourni"
    });
  }

  // Valider le token reçu pour s'assurer qu'il s'agisse d'une string
  const token = await z.string().parseAsync(rawToken);
  // Renvoie une 422 (zod error) si le refresh token n'est pas fourni via notre global-error-handler

  // Recherche du token en BDD
  const refreshToken = await prisma.refreshToken.findFirst({
    where: { token },
    include: { user: { include: { role: true, city: true } } }
  });

  // Gestion de l'erreur : token introuvable en BDD ==> 401
  if (!refreshToken) { throw new UnauthorizedError("refresh token invalide"); }

  // Gestion de l'erreur : si le token trouvé en BDD est expiré ==> 401
  if (refreshToken.expires_at < new Date()) { throw new UnauthorizedError("refresh token expiré"); }

  // Générer le JWT
  const accessToken = generateAccessToken(refreshToken.user);

  // Générer le refresh token
  const newRefreshToken = await generateRefreshToken(refreshToken.user);

  // Envoyer les tokens dans des cookies
  setTokensInCookies(res, accessToken, newRefreshToken);

  // Retirer le password avant de renvoyer l'utilisateur
  const { password: _password, ...userWithoutPassword } = refreshToken.user;

  // Renvoyer l'access token (JWT) + refresh token (opaque) + user dans le body
  res.json({
    accessToken,
    refreshToken: newRefreshToken,
    user: userWithoutPassword
  });

}

function setTokensInCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true, // empêche la lecture/manipulation du cookie par du code JS front
    maxAge: ACCESS_TOKEN_DURATION_IN_MS, // 1H - durée de vie du cookie, ensuite il se supprime automatiquement du navigateur de l'utilisateur
    sameSite: "lax", // protection CSRF
    secure: true, // à enlever au déploiment 
  });
  res.cookie("refreshToken", refreshToken, {
    path: "/api", // les cookies s'envoient automatiquement du client vers le server qui les a généré. Avec l'option path, on choisit les routes exactes pour lesquel le cookie sera envoyé ==> autrement dit ici, notre refresh token s'enverra sur toute les routes /api
    httpOnly: true,
    maxAge: REFRESH_TOKEN_DURATION_IN_MS, // 7J
    sameSite: "lax", // protection CSRF
    secure: true, // à enlever au déploiment 
  });
}
