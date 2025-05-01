import { Router } from "express";
import { postGenerate } from "../controllers/generate";
import { cleanupMiddleware } from "../middlewares/cleanup-compiler";
import { compileLatex } from "../middlewares/latex-compiler";
import { validateLatexContent } from "../middlewares/latex-validator";
import { setupUploadMiddleware } from "../middlewares/upload";

const router: Router = Router();

// Route pour la génération de PDF à partir de code LaTeX
router.post(
  "/",
  setupUploadMiddleware(), // Gestion des uploads de fichiers
  cleanupMiddleware(), // S'assurer du nettoyage à la fin
  validateLatexContent, // Validation du contenu LaTeX
  compileLatex, // Compilation LaTeX -> PDF
  postGenerate, // Envoi du PDF au client
);

export default router;
