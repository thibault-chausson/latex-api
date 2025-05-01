# Documentation 

## Intallation 

```bash
npm install
```

## Organisation des fichiers et dossiers

```yaml
.
├── dist/                           # Dossier de build
├── node_modules/                   # Modules Node.js
├── src/                            # Dossier source
│   └── config
│       └── const.ts
│   └── controllers
│       └── generate.ts
│       └── informations.ts
│   └── middlewares
│       └── cleanup-complier.ts
│       └── error-handler.ts
│       └── latex-compiler.ts
│       └── latex-validator.ts
│       └── upload.ts
│   └── routes
│       └── generate.ts
│       └── informations.ts
│   └── utils
│       └── security.ts
│   └── server.ts                    # Point d'entrée de l'application
│   └── app.ts
├── .env
├── .env.template
├── .gitignore                      # Fichiers à ignorer par Git
├── docker-compose.dev.yml          # Configuration Docker pour le développement
├── docker-compose.prod.yml         # Configuration Docker pour la production
├── docker-compose.yml              # Configuration Docker de base (peut être utilisée pour les deux environnements)
├── Dockerfile                      # Dockerfile pour la production
├── Dockerfile.dev                  # Dockerfile pour le développement
├── LICENSE                         # Licence du projet
├── Makefile                        # Fichier Makefile pour des commandes pratiques
├── package-lock.json               # Dépendances exactes du projet
├── package.json                    # Fichier des dépendances et des scripts
├── README.md                       # Documentation du projet
├── tsconfig.json                   # Configuration TypeScript
```

## Sign commit

```sh
git commit -S -m "<message>"
```