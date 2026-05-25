#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/Djinni-B"
FRONTEND="$SCRIPT_DIR/Djinni-F"

VITE_LOG="$FRONTEND/vite.log"
WORKERMAN_LOG="$BACKEND/bin/workerman.log"

VITE_PID=""
WORKERMAN_PID=""

cleanup() {
  echo ""
  echo "Stopping services..."
  (cd "$BACKEND" && symfony server:stop 2>/dev/null || true)
  if [ -n "$WORKERMAN_PID" ] && kill -0 "$WORKERMAN_PID" 2>/dev/null; then
    kill "$WORKERMAN_PID" 2>/dev/null || true
  fi
  if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
    kill "$VITE_PID" 2>/dev/null || true
  fi
  echo "All services stopped."
}


trap cleanup SIGINT SIGTERM

# 1. Start Docker MariaDB if not already running
echo "Starting Docker MariaDB container..."
(cd "$BACKEND" && sudo docker compose up -d)

# 2. Start Symfony dev server in background
echo "Starting Symfony dev server..."
(cd "$BACKEND" && symfony server:start -d)

# 3. Start Workerman WebSocket server in background
echo "Starting Workerman WebSocket server (port 8081)..."
(cd "$BACKEND" && php bin/console app:chat-server start >> "$WORKERMAN_LOG" 2>&1) &
WORKERMAN_PID=$!

# 4. Start Vite dev server in background
echo "Starting Vite dev server..."
(cd "$FRONTEND" && npm run dev >> "$VITE_LOG" 2>&1) &
VITE_PID=$!

# 5. Print service URLs
echo ""
echo "Services started:"
echo "  Symfony API   → http://127.0.0.1:8000"
echo "  Vite frontend → http://localhost:5173"
echo "  WebSocket     → ws://localhost:8081"
echo ""
echo "Logs:"
echo "  Workerman → $WORKERMAN_LOG"
echo "  Vite      → $VITE_LOG"
echo ""
echo "Press Ctrl+C to stop all services."

# 6. Wait for background processes
wait $VITE_PID $WORKERMAN_PID
