// Liste noire des commandes LaTeX potentiellement dangereuses
export const BLACKLISTED_COMMANDS = [
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
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
