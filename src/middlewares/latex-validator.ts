import fs from "node:fs/promises";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { checkForBlacklistedCommands } from "../utils/security";

export const validateLatexContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Vérifier que le répertoire temporaire existe
    if (!req.tempDir) {
      res
        .status(500)
        .json({ error: "Configuration incorrecte: répertoire temporaire non défini" });
      return;
    }

    // Extraire le contenu LaTeX
    const texContent = req.body.tex;

    if (!texContent) {
      res.status(400).json({ error: "Le contenu LaTeX est manquant" });
      return;
    }

    // Vérification de sécurité pour les commandes interdites
    const securityCheck = checkForBlacklistedCommands(texContent);

    if (!securityCheck.safe) {
      res.status(403).json({
        error: "Commandes LaTeX non autorisées détectées",
        details: "Le document contient des commandes potentiellement dangereuses",
        commands: securityCheck.detectedCommands,
      });
      return;
    }

    // Sauvegarder le fichier .tex dans le répertoire temporaire
    await fs.writeFile(path.join(req.tempDir, "document.tex"), texContent);

    // Passer au middleware suivant
    next();
  } catch (err) {
    console.error("Erreur lors de la validation LaTeX:", err);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Erreur lors de la validation LaTeX",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
