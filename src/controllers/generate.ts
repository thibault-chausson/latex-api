import fs from "node:fs/promises";
import type { Request, Response } from "express";

/**
 * Contrôleur pour la génération de PDF à partir de code LaTeX
 * Ce contrôleur est maintenant beaucoup plus simple car la logique
 * a été déplacée dans des middlewares spécialisés
 */
export const postGenerate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Vérifier que le chemin du PDF est défini (ajouté par le middleware de compilation)
    if (!req.pdfPath) {
      throw new Error("Chemin du PDF non défini");
    }

    // Lecture du fichier PDF généré
    const pdf = await fs.readFile(req.pdfPath);

    // Envoi du PDF dans la réponse
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);
  } catch (err) {
    // Le middleware d'erreur global capturera cette erreur
    if (!res.headersSent) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        error: "Erreur lors de l'envoi du PDF",
        details: errorMessage,
      });
    }
  }
};
