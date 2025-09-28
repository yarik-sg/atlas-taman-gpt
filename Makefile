# Atlas Taman GPT - Makefile

.PHONY: help install dev build test clean docker-up docker-down setup

help:
	@echo "🚀 Atlas Taman GPT - Commandes disponibles:"
	@echo ""
	@echo "  make setup       - Configuration complète"
	@echo "  make install     - Installe les dépendances"
	@echo "  make dev         - Lance en développement"
	@echo "  make build       - Build production"
	@echo "  make test        - Lance les tests"
	@echo "  make docker-up   - Démarre Docker"
	@echo "  make docker-down - Arrête Docker"
	@echo "  make clean       - Nettoie"

setup:
	@echo "🔧 Configuration d'Atlas Taman GPT..."
	npm install
	cd frontend && npm install
	cd backend && npm install
	docker-compose up -d
	@echo "✅ Configuration terminée!"

install:
	npm run install:all

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

docker-up:
	npm run docker:up

docker-down:
	npm run docker:down

clean:
	npm run clean
