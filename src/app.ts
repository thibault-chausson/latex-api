import express, { type Application } from "express";

import { errorHandler } from "./middlewares/error-handler";
import generateRouter from "./routes/generate";
import imformationsRouter from "./routes/informations";

const app: Application = express();

app.use(express.json({ limit: "1mb" })); // Limite la taille des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/informations", imformationsRouter);
app.use("/generate", generateRouter);

// Middleware de gestion des erreurs (doit être après toutes les routes)
app.use(errorHandler);

// Route 404 pour les chemins non définis
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

export default app;
