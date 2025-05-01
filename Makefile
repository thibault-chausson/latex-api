.PHONY: build-compiler build-dev start-dev build-prod start-prod clean

# Construire l'image du compilateur LaTeX
build-compiler:
	docker compose build latex-compiler

# Construire et démarrer l'environnement de développement
build-dev: build-compiler
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build latex-api

start-dev: build-dev
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up latex-api

# Construire et démarrer l'environnement de production
build-prod: build-compiler
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build latex-api

start-prod: build-prod
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d latex-api

# Nettoyage
clean:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down
	docker system prune -f