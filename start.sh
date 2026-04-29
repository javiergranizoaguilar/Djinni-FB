#!/bin/bash

REPO="$(cd "$(dirname "$0")" && pwd)"

echo "[1/5] Node.js (latest via n)..."
if ! command -v n &>/dev/null; then
  sudo npm install -g n
fi
sudo n latest
export PATH="/usr/local/bin:$PATH"
hash -r

echo "[2/5] Docker..."
cd "$REPO/Djinni-B"
sudo docker compose up -d

echo "[3/5] Symfony deps (composer update)..."
composer update

echo "[4/5] Symfony..."
symfony server:start -d

echo "[5/5] Vite deps (npm update) + dev server..."
cd "$REPO/Djinni-F"
npm update
npm run dev
