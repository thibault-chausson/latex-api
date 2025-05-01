import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";

export const cleanupMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Fonction de nettoyage
    const cleanup = async () => {
      try {
        if (req.tempDir && existsSync(req.tempDir)) {
          await fs.rm(req.tempDir, { recursive: true, force: true });
          console.log(`Répertoire temporaire supprimé: ${req.tempDir}`);
        }
      } catch (err) {
        console.error("Erreur lors du nettoyage du répertoire temporaire:", err);
      }
    };

    // Intercepter la fin de la requête pour nettoyer
    res.on("finish", cleanup);
    res.on("close", cleanup);

    next();
  };
};
