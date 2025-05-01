import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';

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
        console.error('Erreur lors du nettoyage du répertoire temporaire:', err);
      }
    };

    // Intercepter la fin de la requête pour nettoyer
    res.on('finish', cleanup);
    res.on('close', cleanup);
    
    next();
  };
};