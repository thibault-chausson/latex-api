import dotenv from "dotenv";

// Charger les variables d'environnement dès l'importation de ce fichier
dotenv.config();

// Fonction pour obtenir une variable d'environnement avec typage
export const getEnv = (key: string, defaultValue = ""): string => {
  return process.env[key] ?? defaultValue;
};

// Variables d'environnement spécifiques typées
export const API_KEY = getEnv("API_KEY");