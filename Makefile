.PHONY: dev up down backend frontend tidy

up:
	docker compose up --build

down:
	docker compose down

backend:
	cd backend && go run ./cmd/server

frontend:
	cd frontend && npm run dev

tidy:
	cd backend && go mod tidy
