import path from "node:path";

import { ALLOWED_EXTENSIONS, BLACKLISTED_COMMANDS } from "../config/const";

// Fonction de nettoyage des noms de fichiers pour éviter les attaques de traversée de répertoire
export function sanitizeFilename(filename: string): string {
  // Supprime les caractères spéciaux et les chemins
  const sanitized = path
    .basename(filename)
    .replace(/[^\w\s.-]/g, "_") // Remplace les caractères non alphanumériques par des underscores
    .replace(/\.{2,}/g, "."); // Empêche les séquences de points multiples (comme '..')

  // Vérifie que le fichier a toujours une extension après le nettoyage
  const parts = sanitized.split(".");
  if (parts.length < 2) {
    return `${sanitized}.txt`; // Ajoute une extension par défaut si nécessaire
  }

  return sanitized;
}

// Fonction pour vérifier l'extension d'un fichier
export function hasAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().substring(1); // Supprime le point au début
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Vérification du contenu LaTeX pour des commandes interdites
export function checkForBlacklistedCommands(texContent: string): {
  safe: boolean;
  detectedCommands: string[];
} {
  const detectedCommands: string[] = [];

  // Recherche des commandes de la liste noire
  for (const command of BLACKLISTED_COMMANDS) {
    // Expression régulière pour détecter les commandes
    // Nous recherchons la commande comme un mot complet ou suivi d'accolades/crochets/espaces
    const regex = new RegExp(
      `${command.replace(/\\/g, "\\\\").replace(/\{/g, "\\{")}\\s*[\\{\\[\\s]|${command.replace(/\\/g, "\\\\").replace(/\{/g, "\\{")}$`,
      "gm",
    );

    if (regex.test(texContent)) {
      detectedCommands.push(command);
    }
  }

  return {
    safe: detectedCommands.length === 0,
    detectedCommands,
  };
}
