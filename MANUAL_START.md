# Djinni-FB — Manual Start Guide

Commands to start the project from scratch, terminal by terminal.

---

## Prerequisites — Node.js version

Vite requires Node.js **20.19+** or **22.12+**. The system default (18.x) is too old.

Fix once with nvm:
```bash
nvm install 20
nvm alias default 20   # persists across reboots
```

If nvm is not installed:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# restart terminal, then run the two commands above
```

---

## First time only (setup)

```bash
# Backend — install PHP deps
cd Djinni-B
composer install

# Frontend — install JS deps
cd ../Djinni-F
npm install

# Backend — copy env
cd ../Djinni-B
cp .env .env.local          # edit DATABASE_URL, JWT_PASSPHRASE, APP_SECRET, CORS_ALLOW_ORIGIN

# Frontend — create env
cd ../Djinni-F
cp .env.example .env        # or create manually:
# VITE_API_URL=http://127.0.0.1:8000
# VITE_WS_URL=ws://localhost:8081

# Generate JWT keys (only if config/jwt/private.pem does not exist)
cd ../Djinni-B
php bin/console lexik:jwt:generate-keypair
```

---

## Every time — start services

Open **4 terminals**, one per service.

### Terminal 1 — MariaDB (Docker)
```bash
cd Djinni-B
sudo docker compose up -d
```

### Terminal 2 — Symfony API (port 8000)
```bash
cd Djinni-B
symfony server:start
```
> Runs at `http://127.0.0.1:8000`

### Terminal 3 — Workerman WebSocket (port 8081)
```bash
cd Djinni-B
php bin/console app:chat-server
```
> Runs at `ws://localhost:8081`

### Terminal 4 — Vite frontend (port 5173)
```bash
cd Djinni-F
npm run dev
```
> Runs at `http://localhost:5173`

---

## Run migrations (after entity changes)

```bash
cd Djinni-B
php bin/console doctrine:migrations:diff     # generate migration
php bin/console doctrine:migrations:migrate  # apply
```

## Stop services

```bash
# Symfony
cd Djinni-B && symfony server:stop

# Docker
cd Djinni-B && sudo docker compose down

# Workerman and Vite: Ctrl+C in their terminals
```