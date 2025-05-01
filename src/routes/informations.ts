import { Router } from "express";
import {
  getAllowedExtensions,
  getBlacklistedCommands,
} from "../controllers/informations";

const router: Router = Router();

// Endpoint pour récupérer la liste des commandes interdites (utile pour les frontend)
router.get("/blacklisted-commands", getBlacklistedCommands);
// Nouvel endpoint pour récupérer les extensions de fichiers autorisées
router.get("/allowed-extensions", getAllowedExtensions);

export default router;
