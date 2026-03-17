import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { HttpError } from "../lib/errors.ts";

// Un error middleware prend 4 paramètres: error, req, res, next

export async function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  console.log("Global error handler triggered:", error.message);
  // Si l'erreur de validation Zod 
  if (error instanceof z.ZodError) {
    console.info(error); // console.info = type de logs
    // 422 = erreurs sémentiques
    res.status(422).json({ error: z.prettifyError(error) });
    return;
  }

  // Si l'erreur est de type HttpError
  if (error instanceof HttpError) {
    console.info(error);
    res.status(error.status).json({ error: error.message });
    return;
  }

  // Si c'est un autre type d'erreur que l'on ne maitrise pas (ex: la BDD plante)
  // Remplace ici tous les try-catch 500 sur tous les controlleurs
  console.error(error);
  res.status(500).json({ error: "Unexpected server error" });
}