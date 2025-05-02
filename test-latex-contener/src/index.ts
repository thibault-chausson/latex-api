import { exec } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import express, { type Request, type Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json({ limit: "1mb" })); // Limite la taille des requêtes JSON
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Interface pour le type des fichiers
interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Liste noire des commandes LaTeX potentiellement dangereuses
const BLACKLISTED_COMMANDS = [
  // Accès au système de fichiers
  "\\input",
  "\\include",
  "\\openin",
  "\\openout",
  "\\write18",
  "\\read",
  "\\write",
  "\\csname",

  // Exécution de commandes système
  "\\immediate",
  "\\write18",
  "\\shell",
  "\\ShellEscape",
  "\\pgfsysdriver",
  "\\special",
  "\\@@input",
  "\\@@include",

  // Commandes dangereuses spécifiques
  "\\catcode",
  "\\newwrite",
  "\\newread",

  // Macros potentiellement dangereuses
  "\\pdfmark",
  "\\pdfliteral",
  "\\pdftexcmds",
  "\\pdffilesize",
  "\\starttext",
  "\\directlua",
  "\\latelua",

  // Commandes d'import de packages potentiellement dangereux
  "\\usepackage{shellesc}",
  "\\usepackage{pgf}",
  "\\usepackage{tikz}",
  "\\usepackage{epstopdf}",
  "\\usepackage{minted}",
];

// Extensions de fichiers autorisées (formats d'images sûrs)
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

// Fonction de nettoyage des noms de fichiers pour éviter les attaques de traversée de répertoire
function sanitizeFilename(filename: string): string {
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
function hasAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase().substring(1); // Supprime le point au début
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Vérification du contenu LaTeX pour des commandes interdites
function checkForBlacklistedCommands(texContent: string): {
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

app.post("/generate", async (req: Request, res: Response): Promise<void> => {
  const id = uuidv4();
  const tempDir = path.join("/tmp", `latex-${id}`);

  try {
    // Création du répertoire temporaire
    await fs.mkdir(tempDir, { recursive: true });

    // Configuration de multer pour stocker directement dans le répertoire temporaire
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, tempDir);
      },
      filename: (req, file, cb) => {
        // Nettoie le nom du fichier et vérifie l'extension
        const sanitizedName = sanitizeFilename(file.originalname);

        // Vérifie si l'extension est autorisée
        if (!hasAllowedExtension(sanitizedName)) {
          return cb(
            new Error(
              `Extension de fichier non autorisée: ${path.extname(sanitizedName)}`,
            ),
            "",
          );
        }

        cb(null, sanitizedName);
      },
    });

    // Options de filtrage pour multer
    const fileFilter = (
      req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      // Vérifier directement l'extension du fichier
      if (!hasAllowedExtension(file.originalname)) {
        return cb(
          new Error(
            `Extension de fichier non autorisée: ${path.extname(file.originalname)}`,
          ),
        );
      }
      cb(null, true);
    };

    // Ajout d'un timeout pour éviter les attentes infinies
    const upload = multer({
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB par fichier
      fileFilter,
    }).array("images");

    // Utilisation de multer comme middleware avec un timeout
    let uploadComplete = false;

    // Définition d'un timeout pour l'upload (5 secondes)
    const uploadTimeout = setTimeout(() => {
      if (!uploadComplete) {
        console.log("Timeout d'upload atteint - aucune image n'a été fournie");
        uploadComplete = true;
        // Continue le processus même sans images
        proceedWithLatexGeneration();
      }
    }, 5000);

    // Fonction pour traiter l'upload
    await new Promise<void>((resolve) => {
      upload(req as Request, res as Response, (err) => {
        uploadComplete = true;
        clearTimeout(uploadTimeout);

        if (err) {
          console.warn("Erreur lors de l'upload:", err);
          // Si l'erreur est liée à une extension non autorisée, on renvoie une erreur 400
          if (err.message?.includes("Extension de fichier non autorisée")) {
            res.status(400).json({ error: err.message });
            resolve();
            return;
          }
          // Sinon, on continue malgré l'erreur (peut-être qu'il n'y a pas d'images)
        }
        resolve();
      });
    });

    // Si une réponse a déjà été envoyée (erreur d'extension par exemple), on arrête le traitement
    if (res.headersSent) {
      try {
        if (existsSync(tempDir)) {
          await fs.rm(tempDir, { recursive: true, force: true });
        }
      } catch {}
      return;
    }

    // Si uploadComplete n'est pas encore true (cas très rare), attendre que le timeout se déclenche
    if (!uploadComplete) {
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (uploadComplete) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    // Fonction pour procéder à la génération LaTeX
    async function proceedWithLatexGeneration() {
      // Fichier pour capturer les logs LaTeX
      const logFile = path.join(tempDir, "latex_output.log");

      try {
        // Extraction du contenu LaTeX depuis le corps de la requête
        const texContent = req.body.tex;
        if (!texContent) {
          res.status(400).json({ error: "Le contenu LaTeX est manquant" });
          return;
        }

        // Vérification de sécurité pour les commandes interdites
        const securityCheck = checkForBlacklistedCommands(texContent);
        if (!securityCheck.safe) {
          res.status(403).json({
            error: "Commandes LaTeX non autorisées détectées",
            details: "Le document contient des commandes potentiellement dangereuses",
            commands: securityCheck.detectedCommands,
          });
          return;
        }

        // Sauvegarde du fichier .tex dans le répertoire temporaire
        await fs.writeFile(path.join(tempDir, "document.tex"), texContent);

        // Exécution de pdflatex avec un timeout et redirection des sorties
        // Utilisation du mode --shell-restricted pour une sécurité supplémentaire
        const latexTimeout = 30000; // 30 secondes max pour la compilation
        const pdflatexProcess = new Promise<{
          success: boolean;
          stdout: string;
          stderr: string;
        }>((resolve, reject) => {
          // Utilisation de --shell-restricted pour plus de sécurité
          const command = `pdflatex --shell-restricted -interaction=nonstopmode -output-directory=${tempDir} document.tex`;
          console.log(`Exécution de la commande: ${command}`);

          const process = exec(
            command,
            { cwd: tempDir, timeout: latexTimeout },
            (err, stdout, stderr) => {
              // Écriture des logs dans le fichier
              fs.writeFile(logFile, `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`).catch(
                console.error,
              );

              if (err) {
                console.error("Erreur pdflatex:", err.message);
                resolve({ success: false, stdout, stderr });
              } else {
                resolve({ success: true, stdout, stderr });
              }
            },
          );
        });

        const latexResult = await pdflatexProcess;

        // Vérification de l'existence du PDF généré
        const pdfPath = path.join(tempDir, "document.pdf");
        const logPath = path.join(tempDir, "document.log"); // Fichier de log généré par LaTeX

        if (!existsSync(pdfPath)) {
          console.error("PDF non généré, vérification des logs");

          // Collecte des informations de débogage
          const debugInfo: any = {
            latexOutput: latexResult.stdout,
            latexError: latexResult.stderr,
          };

          // Vérifier si le fichier log de LaTeX existe et le lire
          if (existsSync(logPath)) {
            try {
              const logContent = readFileSync(logPath, "utf8");

              // Extraction des erreurs les plus pertinentes du log LaTeX
              const errorLines: string[] = [];
              const lines = logContent.split("\n");

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes("Error:") || lines[i].includes("!")) {
                  // Capturer l'erreur et quelques lignes de contexte
                  const contextStart = Math.max(0, i - 2);
                  const contextEnd = Math.min(lines.length - 1, i + 5);

                  for (let j = contextStart; j <= contextEnd; j++) {
                    errorLines.push(lines[j]);
                  }
                  errorLines.push("---"); // Séparateur entre les erreurs
                }
              }

              debugInfo.latexLogErrors = errorLines.join("\n");
            } catch (logErr) {
              debugInfo.logReadError = String(logErr);
            }
          }

          // Renvoyer une erreur avec les détails
          res.status(500).json({
            error: "Échec de la génération du PDF",
            details: "Le fichier PDF n'a pas été généré correctement",
            debug: debugInfo,
          });
          return;
        }

        // Lecture du fichier PDF généré
        const pdf = await fs.readFile(pdfPath);

        // Envoi du PDF dans la réponse
        res.setHeader("Content-Type", "application/pdf");
        res.send(pdf);
      } catch (genErr) {
        console.error("Erreur lors de la génération:", genErr);
        const errorMessage = genErr instanceof Error ? genErr.message : String(genErr);

        // Collecte des logs pour le débogage
        let debugLogs = {};

        // Vérifier si le fichier log existe
        const logPath = path.join(tempDir, "document.log");
        if (existsSync(logPath)) {
          try {
            const logContent = readFileSync(logPath, "utf8");

            // Chercher les erreurs dans le log LaTeX
            const errorPattern = /(^!.*$|^l\.\d+.*$|^Error:.*$)/gm;
            const errors = logContent.match(errorPattern) || [];

            debugLogs = {
              latexErrors: errors,
              latexErrorContext: logContent
                .split("\n")
                .filter(
                  (line) =>
                    line.includes("Error") ||
                    line.includes("!") ||
                    line.includes("Undefined control sequence") ||
                    line.includes("Missing"),
                ),
            };
          } catch (logErr) {
            debugLogs = { logReadError: String(logErr) };
          }
        }

        // Vérifier le fichier de logs de sortie personnalisé
        if (existsSync(logFile)) {
          try {
            debugLogs = {
              ...debugLogs,
              commandOutput: readFileSync(logFile, "utf8"),
            };
          } catch {}
        }

        res.status(500).json({
          error: "Échec de la génération",
          details: errorMessage,
          debug: debugLogs,
        });
      } finally {
        try {
          // Suppression du répertoire temporaire et de son contenu
          if (existsSync(tempDir)) {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`Répertoire temporaire supprimé: ${tempDir}`);
          }
        } catch (cleanupErr) {
          console.error("Erreur lors du nettoyage du répertoire temporaire:", cleanupErr);
        }
      }
    }

    // Si cette ligne est atteinte directement (sans timeout), alors l'upload est terminé
    if (uploadComplete && !res.headersSent) {
      await proceedWithLatexGeneration();
    }
  } catch (err) {
    console.error("Erreur générale:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Éviter d'envoyer une réponse si une a déjà été envoyée
    if (!res.headersSent) {
      res.status(500).json({ error: "Erreur inattendue", details: errorMessage });
    }

    // Nettoyage en cas d'erreur
    try {
      if (existsSync(tempDir)) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    } catch {}
  }
});

// Endpoint pour récupérer la liste des commandes interdites (utile pour les frontend)
app.get("/blacklisted-commands", (req: Request, res: Response) => {
  res.json({
    blacklistedCommands: BLACKLISTED_COMMANDS,
  });
});

// Nouvel endpoint pour récupérer les extensions de fichiers autorisées
app.get("/allowed-extensions", (req: Request, res: Response) => {
  res.json({
    allowedExtensions: ALLOWED_EXTENSIONS,
  });
});

app.listen(3000, () => console.log("API LaTeX sécurisée en écoute sur le port 3000"));
