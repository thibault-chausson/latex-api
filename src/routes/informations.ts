import { Router } from "express";
import {
  getAllowedExtensions,
  getBlacklistedCommands,
  getFileFormatRequirements,
} from "../controllers/informations";

const router: Router = Router();

// Endpoint pour récupérer la liste des commandes interdites (utile pour les frontend)
router.get("/blacklisted-commands", getBlacklistedCommands);
// Nouvel endpoint pour récupérer les extensions de fichiers autorisées
router.get("/allowed-extensions", getAllowedExtensions);
// Nouvel endpoint pour récupérer toutes les exigences de format de fichier
router.get("/file-format-requirements", getFileFormatRequirements);

export default router;
