#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/Djinni-B"
FRONTEND="$SCRIPT_DIR/Djinni-F"

# 1. Check required tools
for cmd in docker symfony php composer node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is not installed or not in PATH. Aborting."
    exit 1
  fi
done

# 2. Copy backend .env to .env.local only if .env.local does not exist
if [ ! -f "$BACKEND/.env.local" ]; then
  cp "$BACKEND/.env" "$BACKEND/.env.local"
  echo "Created $BACKEND/.env.local from .env"
fi

# 3. Set up frontend .env only if it does not exist
if [ ! -f "$FRONTEND/.env" ]; then
  if [ -f "$FRONTEND/.env.example" ]; then
    cp "$FRONTEND/.env.example" "$FRONTEND/.env"
    echo "Created $FRONTEND/.env from .env.example"
  else
    printf 'VITE_API_URL=http://127.0.0.1:8000\nVITE_WS_URL=ws://localhost:8081\n' > "$FRONTEND/.env"
    echo "Created $FRONTEND/.env with default values"
  fi
fi

# 4. Install PHP dependencies
echo "Installing Composer dependencies..."
(cd "$BACKEND" && composer install)

# 5. Install JS dependencies
echo "Installing npm dependencies..."
(cd "$FRONTEND" && npm install)

# 6. Start Docker MariaDB container
echo "Starting Docker MariaDB container..."
(cd "$BACKEND" && sudo docker compose up -d)

# 7. Wait for MariaDB to accept connections (max 30s)
echo "Waiting for MariaDB on 127.0.0.1:3306..."
MAX_WAIT=30
WAITED=0
until nc -z 127.0.0.1 3306 2>/dev/null; do
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "ERROR: MariaDB did not become ready within ${MAX_WAIT} seconds. Aborting."
    exit 1
  fi
  sleep 1
  WAITED=$((WAITED + 1))
done
echo "MariaDB ready."

# 8. Generate JWT keys only if private.pem does not exist
if [ ! -f "$BACKEND/config/jwt/private.pem" ]; then
  echo "Generating JWT keypair..."
  (cd "$BACKEND" && php bin/console lexik:jwt:generate-keypair)
fi

# 9. Run database migrations
echo "Running database migrations..."
(cd "$BACKEND" && php bin/console doctrine:migrations:migrate --no-interaction)

echo "✅ Setup complete. Run ./start.sh to launch the project."
