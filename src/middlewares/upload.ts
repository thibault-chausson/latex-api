import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { checkSanitizeFilename, hasAllowedExtension } from "../utils/security";

// Interface pour étendre l'objet Request avec nos propriétés
declare global {
  namespace Express {
    interface Request {
      tempDir?: string;
      processingId?: string;
    }
  }
}

export const setupUploadMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Générer un ID unique pour ce traitement
    const id = uuidv4();
    // Créer un répertoire temporaire
    const tempDir = path.join("/tmp", `latex-${id}`);

    // Ajouter ces informations à l'objet req pour les utiliser dans d'autres middlewares
    req.processingId = id;
    req.tempDir = tempDir;

    try {
      // Création du répertoire temporaire
      await fs.mkdir(tempDir, { recursive: true });

      // Configuration de multer
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          try {
            // Utilise la nouvelle logique de sanitizeFilename qui peut lancer des erreurs
            const sanitizedName = checkSanitizeFilename(file.originalname);

            // Vérifie l'extension après sanitization
            if (!hasAllowedExtension(sanitizedName)) {
              return cb(
                new Error(
                  `Extension de fichier non autorisée: ${path.extname(sanitizedName)}`,
                ),
                "",
              );
            }

            cb(null, sanitizedName);
          } catch (error) {
            // Capture les erreurs lancées par sanitizeFilename
            cb(error instanceof Error ? error : new Error(String(error)), "");
          }
        },
      });

      // Options de filtrage
      const fileFilter = (
        req: Request,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback,
      ) => {
        try {
          // Vérifie d'abord si le nom de fichier est valide
          checkSanitizeFilename(file.originalname);

          // Puis vérifie l'extension
          if (!hasAllowedExtension(file.originalname)) {
            return cb(
              new Error(
                `Extension de fichier non autorisée: ${path.extname(file.originalname)}`,
              ),
            );
          }

          cb(null, true);
        } catch (error) {
          // Capture les erreurs de sanitizeFilename
          cb(error instanceof Error ? error : new Error(String(error)));
        }
      };

      // Création de l'uploader
      const upload = multer({
        storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
        fileFilter,
      }).array("images");

      // Gérer l'upload avec timeout
      let uploadComplete = false;

      // Définir un timeout (5 secondes)
      const uploadTimeout = setTimeout(() => {
        if (!uploadComplete) {
          console.log("Timeout d'upload atteint - aucune image n'a été fournie");
          uploadComplete = true;
          next();
        }
      }, 5000);

      // Traiter l'upload
      await new Promise<void>((resolve) => {
        upload(req, res, (err) => {
          uploadComplete = true;
          clearTimeout(uploadTimeout);

          if (err) {
            console.warn("Erreur lors de l'upload:", err);
            // Envoie une réponse d'erreur pour tout type d'erreur
            res.status(400).json({ error: err.message });
            resolve();
            return;
          }
          resolve();
        });
      });

      // Si une réponse a déjà été envoyée, ne pas continuer
      if (res.headersSent) {
        try {
          if (existsSync(tempDir)) {
            await fs.rm(tempDir, { recursive: true, force: true });
          }
        } catch (err) {
          console.error("Erreur lors du nettoyage du répertoire:", err);
        }
        return;
      }

      // Si uploadComplete n'est pas encore true, attendre
      if (!uploadComplete) {
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (uploadComplete) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }

      // Continuer vers le middleware suivant
      next();
    } catch (err) {
      console.error("Erreur dans le middleware d'upload:", err);

      // Nettoyage en cas d'erreur
      try {
        if (existsSync(tempDir)) {
          await fs.rm(tempDir, { recursive: true, force: true });
        }
      } catch {}

      if (!res.headersSent) {
        res.status(500).json({
          error: "Erreur lors de l'upload",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }
  };
};
