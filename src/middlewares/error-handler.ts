import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  details?: string;
  debug?: any;
}

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  // Si les en-têtes ont déjà été envoyés, passer au middleware suivant
  if (res.headersSent) {
    return next(err);
  }
  
  // Définir le code d'état HTTP (par défaut: 500)
  const statusCode = err.statusCode || 500;
  
  // Préparer la réponse d'erreur
  const errorResponse: any = {
    error: err.message || 'Erreur interne du serveur',
  };
  
  // Ajouter des détails si disponibles
  if (err.details) {
    errorResponse.details = err.details;
  }
  
  // Ajouter des informations de débogage si disponibles et en mode développement
  if (err.debug && process.env.NODE_ENV === 'development') {
    errorResponse.debug = err.debug;
  }
  
  // Envoyer la réponse d'erreur
  res.status(statusCode).json(errorResponse);
};