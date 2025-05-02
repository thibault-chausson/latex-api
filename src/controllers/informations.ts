import type { Request, Response } from "express";
import { ALLOWED_EXTENSIONS, BLACKLISTED_COMMANDS } from "../config/const";

export const getBlacklistedCommands = (req: Request, res: Response) => {
  res.json({
    blacklistedCommands: BLACKLISTED_COMMANDS,
  });
};

export const getAllowedExtensions = (req: Request, res: Response) => {
  res.json({
    allowedExtensions: ALLOWED_EXTENSIONS,
  });
};

export const getFileFormatRequirements = (req: Request, res: Response) => {
  res.json({
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxFileSize: "10MB",
    filenameRequirements: {
      allowedCharacters:
        "Lettres, chiffres, espaces, tirets, points et underscores uniquement",
      forbiddenPatterns: [
        "Chemins de répertoire (/, \\, etc.)",
        "Séquences de points multiples (..)",
        "Noms sans extension",
      ],
      examples: {
        valid: ["document.tex", "image_01.jpg", "figure-2.png"],
        invalid: ["../script.tex", "file\\name.jpg", "image..png", "noextension"],
      },
    },
    uploadInstructions:
      "Tous les fichiers doivent respecter ces critères pour être acceptés. " +
      "Les noms de fichiers non conformes seront rejetés et le processus de génération PDF sera arrêté.",
  });
};