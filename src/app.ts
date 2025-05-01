import express, { type Application } from "express";

import imformationsRouter from "./routes/informations"
import generateRouter from "./routes/generate"

const app: Application = express();

app.use(express.json({ limit: '1mb' })); // Limite la taille des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use("/informations", imformationsRouter);
app.use("/generate", generateRouter);

export default app;