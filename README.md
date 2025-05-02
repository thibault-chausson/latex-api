# Documentation

## Installation

Install the project dependencies:

```bash
npm install
```

## File Organization

```yml
.
├── dist/                           # Compiled files (final build)
├── node_modules/                   # Dependencies installed by npm
├── src/                            # Source code of the application
│   ├── config/                     # Static project configuration
│   │   └── const.ts                # Global constants used throughout the project
│   ├── controllers/               # Business logic associated with routes
│   │   ├── generate.ts             # Controller for document generation
│   │   └── informations.ts         # Controller for informational routes (disallowed commands, allowed extensions, etc.)
│   ├── middlewares/              # Custom Express middlewares
│   │   ├── cleanup-complier.ts     # Deletes temporary files after compilation
│   │   ├── error-handler.ts        # Centralized error handling
│   │   ├── latex-compiler.ts       # Compiles LaTeX documents into PDF
│   │   ├── latex-validator.ts      # Validates the received LaTeX code
│   │   └── upload.ts               # Handles file uploads (images, .tex files, etc.)
│   ├── routes/                   # Definition of API routes
│   │   ├── generate.ts             # POST route /generate for PDF generation
│   │   └── informations.ts         # GET route /informations/... for system info
│   ├── utils/                    # Reusable utility functions
│   │   └── security.ts             # Security checks (e.g., LaTeX command blacklist)
│   ├── app.ts                      # Configuration and initialization of the Express app
│   └── server.ts                   # Main entry point of the application (port listener)
├── .env                            # Environment variables file (not versioned)
├── .env.template                   # Example .env file to complete
├── .gitignore                      # Files/directories to ignore by Git
├── docker-compose.dev.yml         # Docker configuration for the development environment
├── docker-compose.prod.yml        # Docker configuration for production
├── docker-compose.yml             # Main Docker Compose file (may include or replace others)
├── Dockerfile                     # Dockerfile for building a production image
├── Dockerfile.dev                 # Dockerfile dedicated to the development environment
├── LICENSE                         # Project license (e.g., MIT, Apache 2.0)
├── Makefile                        # Automated commands (build, dev, test, etc.)
├── package-lock.json               # Lock file for npm dependency versions
├── package.json                    # List of dependencies, npm scripts, and project metadata
├── README.md                       # Main project documentation
├── tsconfig.json                   # TypeScript compiler configuration
```

## Development

Ensure Docker is installed.

To start the development environment on Linux:

```bash
make dev
```

## Deployment

To deploy in production:

```bash
make prod
```

## Usage

### Generating a LaTeX document

Document generation works with or without images.

```bash
curl -X POST http://<your-ip>:3000/generate \
     -F "tex=@<your-latex-code.txt>" \
     -F "images=@<image-test1.png>" \
     -F "images=@<image-test2.png>"
```

Example of the `your-latex-code.txt` file:

```tex
\documentclass{article}
\usepackage{graphicx}
\begin{document}
    \title{Test PDF Generation with Image}
    \author{Your Name}
    \date{\today}
    \maketitle
    \section{Introduction}
    This is a test with an image.
    \begin{figure}[h]
        \centering
        \includegraphics[width=0.5\textwidth]{image-test1.png}
        \caption{Here is an image}
        \includegraphics[width=0.5\textwidth]{image-test2.png}
        \caption{Here is another image}
    \end{figure}
\end{document}
```

#### Security

Commands that could allow arbitrary code execution are excluded. To retrieve the list, refer to the section: [See disallowed commands](#retrieving-disallowed-commands).

To find the allowed image file extensions, refer to the section: [See allowed extensions](#retrieving-allowed-file-extensions).

To enable API keys, add `API_KEY=<your_key>` to your `.env` file, and include it in the request header when generating a PDF as: `X-API-Key: <your_key>`.

### Retrieving disallowed commands

```bash
curl -X GET http://<your-ip>:3000/informations/blacklisted-commands
```

### Retrieving allowed file extensions

```bash
curl -X GET http://<your-ip>:3000/informations/allowed-extensions
```

## Miscellaneous

### Signed commits

```bash
git commit -S -m "<message>"
```

### Remarks

- The current size of the Docker image is about **1.8 GB**.
- There is consideration to externalize document generation into an **ephemeral container**, to avoid using the API container.