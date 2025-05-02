import type { NextFunction, Request, Response } from "express";
import { API_KEY } from "../config/env";

/**
 * Middleware pour vérifier la présence et la validité d'une clé API dans les en-têtes de la requête.
 * Si la variable d'environnement API_KEY n'est pas définie ou est vide, aucune vérification n'est effectuée.
 */
export const apiKeyValidator = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = API_KEY;

    // Si la clé API n'est pas définie dans .env ou est vide, on ne vérifie pas
    if (!apiKey || apiKey.trim() === "") {
      next();
      return;
    }

    // Récupération de la clé API dans les en-têtes
    const requestApiKey = req.header("X-API-Key") ?? req.header("x-api-key");

    // Vérification de la présence et de la validité de la clé API
    if (!requestApiKey) {
      res.status(401).json({
        error: "Clé API manquante",
        message: "Veuillez fournir une clé API valide dans l'en-tête 'X-API-Key'",
      });
      return;
    }

    // Vérification de la valeur de la clé API
    if (requestApiKey !== apiKey) {
      res.status(403).json({
        error: "Clé API invalide",
        message: "La clé API fournie n'est pas valide",
      });
      return;
    }

    // Si tout est OK, on passe au middleware suivant
    next();
  };
};
