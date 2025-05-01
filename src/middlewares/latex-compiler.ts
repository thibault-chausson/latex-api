import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const compileLatex = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Vérifier que le répertoire temporaire existe
  if (!req.tempDir) {
    res.status(500).json({ error: 'Configuration incorrecte: répertoire temporaire non défini' });
    return;
  }
  
  const tempDir = req.tempDir;
  const logFile = path.join(tempDir, 'latex_output.log');
  
  try {
    // Exécution de pdflatex avec un timeout
    const latexTimeout = 30000; // 30 secondes max
    const pdflatexProcess = new Promise<{ success: boolean, stdout: string, stderr: string }>(
      (resolve, reject) => {
        const command = `pdflatex --shell-restricted -interaction=nonstopmode -output-directory=${tempDir} document.tex`;
        console.log(`Exécution de la commande: ${command}`);
        
        const process = exec(
          command, 
          { cwd: tempDir, timeout: latexTimeout }, 
          (err, stdout, stderr) => {
            // Écriture des logs
            fs.writeFile(logFile, `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`)
              .catch(console.error);
            
            if (err) {
              console.error('Erreur pdflatex:', err.message);
              resolve({ success: false, stdout, stderr });
            } else {
              resolve({ success: true, stdout, stderr });
            }
          }
        );
      }
    );
    
    const latexResult = await pdflatexProcess;
    
    // Vérification de l'existence du PDF généré
    const pdfPath = path.join(tempDir, 'document.pdf');
    const logPath = path.join(tempDir, 'document.log');
    
    if (!existsSync(pdfPath)) {
      console.error('PDF non généré, vérification des logs');
      
      // Collecte des informations de débogage
      let debugInfo: any = {
        latexOutput: latexResult.stdout,
        latexError: latexResult.stderr
      };
      
      // Vérifier le fichier log de LaTeX
      if (existsSync(logPath)) {
        try {
          const logContent = readFileSync(logPath, 'utf8');
          
          // Extraction des erreurs pertinentes
          const errorLines: string[] = [];
          const lines = logContent.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Error:') || lines[i].includes('!')) {
              // Capturer l'erreur et son contexte
              const contextStart = Math.max(0, i - 2);
              const contextEnd = Math.min(lines.length - 1, i + 5);
              
              for (let j = contextStart; j <= contextEnd; j++) {
                errorLines.push(lines[j]);
              }
              errorLines.push('---');
            }
          }
          
          debugInfo.latexLogErrors = errorLines.join('\n');
        } catch (logErr) {
          debugInfo.logReadError = String(logErr);
        }
      }
      
      // Renvoyer une erreur avec les détails
      res.status(500).json({
        error: 'Échec de la génération du PDF',
        details: 'Le fichier PDF n\'a pas été généré correctement',
        debug: debugInfo
      });
      return;
    }
    
    // Stocker le chemin du PDF dans l'objet request pour le middleware suivant
    req.pdfPath = pdfPath;
    
    // Passer au middleware suivant
    next();
    
  } catch (err) {
    console.error('Erreur lors de la compilation LaTeX:', err);
    
    // Collecte des logs pour le débogage
    let debugLogs = {};
    
    // Vérifier les fichiers logs
    const logPath = path.join(tempDir, 'document.log');
    if (existsSync(logPath)) {
      try {
        const logContent = readFileSync(logPath, 'utf8');
        
        // Chercher les erreurs dans le log LaTeX
        const errorPattern = /(^!.*$|^l\.\d+.*$|^Error:.*$)/gm;
        const errors = logContent.match(errorPattern) || [];
        
        debugLogs = {
          latexErrors: errors,
          latexErrorContext: logContent.split('\n')
            .filter(line => 
              line.includes('Error') || 
              line.includes('!') || 
              line.includes('Undefined control sequence') ||
              line.includes('Missing')
            )
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
          commandOutput: readFileSync(logFile, 'utf8')
        };
      } catch {}
    }
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Échec de la génération', 
        details: err instanceof Error ? err.message : String(err),
        debug: debugLogs
      });
    }
  }
};

// Étendre l'interface Request pour inclure pdfPath
declare global {
  namespace Express {
    interface Request {
      pdfPath?: string;
    }
  }
}