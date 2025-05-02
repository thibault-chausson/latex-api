import path from "node:path";

import { ALLOWED_EXTENSIONS, BLACKLISTED_COMMANDS } from "../config/const";

// Fonction de validation des noms de fichiers pour rejeter les fichiers non conformes
export function checkSanitizeFilename(filename: string): string {
  // Extrait juste le nom du fichier sans le chemin
  const baseFilename = path.basename(filename);

  // Vérifie si le nom original a été modifié par path.basename()
  // ce qui indiquerait une tentative de traversée de répertoire
  if (baseFilename !== filename) {
    throw new Error(
      "Nom de fichier non autorisé : tentative de traversée de répertoire détectée",
    );
  }

  // Vérifie les caractères spéciaux
  if (/[^\w\s.-]/g.test(baseFilename)) {
    throw new Error("Nom de fichier non autorisé : caractères spéciaux détectés");
  }

  // Vérifie les séquences de points multiples
  if (/\.{2,}/g.test(baseFilename)) {
    throw new Error(
      "Nom de fichier non autorisé : séquences de points multiples détectées",
    );
  }

  // Vérifie que le fichier a une extension
  const parts = baseFilename.split(".");
  if (parts.length < 2 || parts[parts.length - 1] === "") {
    throw new Error("Nom de fichier non autorisé : extension manquante ou invalide");
  }

  return baseFilename;
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
