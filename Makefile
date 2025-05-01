APP_NAME=latex-api

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

prod:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

stop:
	docker compose stop

down:
	docker compose down

logs:
	docker compose logs -f $(APP_NAME)

rebuild:
	docker compose down
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

clean:
	docker system prune -af --volumes
