#!/usr/bin/env bash
# Entrypoint para el contenedor Workerman. NO instala dependencias ni corre
# migraciones (de eso se encarga el contenedor PHP). Solo espera a que
# vendor/, claves JWT y la base de datos esten listos, y arranca el chat.

set -e
cd /var/www/html

echo "[ws-entrypoint] esperando a vendor/ listo"
for i in $(seq 1 120); do
    if [ -f vendor/autoload.php ] && [ -f vendor/doctrine/doctrine-bundle/DoctrineBundle.php ]; then
        break
    fi
    sleep 3
done

echo "[ws-entrypoint] esperando a claves JWT"
for i in $(seq 1 60); do
    if [ -f config/jwt/public.pem ] && [ -f config/jwt/private.pem ]; then
        break
    fi
    sleep 2
done

echo "[ws-entrypoint] esperando a base de datos"
for i in $(seq 1 60); do
    if php -r "new PDO('mysql:host=database;dbname=app', 'app', 'app');" 2>/dev/null; then
        break
    fi
    sleep 2
done

echo "[ws-entrypoint] listo, arrancando chat-server"
exec "$@"
