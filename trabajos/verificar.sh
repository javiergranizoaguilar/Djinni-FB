#!/usr/bin/env bash
# Smoke test del despliegue Docker. Ejecutar antes de la entrega.
# Necesita permisos de Docker (estar en el grupo docker o ejecutar con sudo).

set -e
cd "$(dirname "$0")/.."

echo "==> Validando docker-compose.yaml"
docker compose config --quiet

echo "==> Tirando stack anterior si existia"
docker compose down -v 2>/dev/null || true

echo "==> Levantando stack (puede tardar 2-3 minutos en la primera build)"
docker compose up -d --build

echo "==> Esperando a que MariaDB este sana"
for i in $(seq 1 60); do
    state=$(docker inspect --format='{{.State.Health.Status}}' djinni_db 2>/dev/null || echo "n/a")
    if [ "$state" = "healthy" ]; then
        echo "    OK"
        break
    fi
    sleep 2
done

echo "==> Esperando a que el entrypoint de PHP termine composer install + migraciones (max 5 min)"
for i in $(seq 1 60); do
    if docker compose logs php 2>/dev/null | grep -q "ready to handle connections"; then
        echo "    OK php-fpm arrancado tras entrypoint"
        break
    fi
    if docker compose logs php 2>/dev/null | grep -qi "fatal\|error"; then
        echo "    AVISO logs muestran error, sigo intentando"
    fi
    sleep 5
done

echo "==> Probando endpoint de login (con reintentos)"
HTTP_CODE=""
for i in $(seq 1 20); do
    HTTP_CODE=$(curl -s -o /tmp/login_test.json -w "%{http_code}" \
        -X POST http://localhost:8000/api/login_check \
        -H "Content-Type: application/json" \
        -d '{"email":"dm@djinni.local","password":"DungeonMaster1!"}' || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "    OK login devuelve 200"
        if grep -q '"token"' /tmp/login_test.json; then
            echo "    OK respuesta contiene token JWT"
        fi
        break
    fi
    echo "    intento $i/20: codigo $HTTP_CODE, reintentando en 5s"
    sleep 5
done

if [ "$HTTP_CODE" != "200" ]; then
    echo ""
    echo "    FALLO login no respondio 200 tras 100s"
    echo "    Ultimos logs de PHP:"
    docker compose logs --tail=40 php
    echo ""
    echo "    Ultimos logs de Workerman:"
    docker compose logs --tail=20 workerman
    exit 1
fi

echo "==> Probando frontend"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
if [ "$HTTP_CODE" = "200" ]; then
    echo "    OK frontend devuelve 200"
else
    echo "    FALLO frontend devolvio $HTTP_CODE"
    exit 1
fi

echo ""
echo "Stack levantado y verificado."
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:8000"
echo "  WS:       ws://localhost:8081"
echo "  Login DM: dm@djinni.local / DungeonMaster1!"
echo "  Login PJ: jugador@djinni.local / PartyMember1!"
