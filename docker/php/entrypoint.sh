#!/usr/bin/env bash
# Entrypoint del contenedor PHP. Garantiza que en el primer arranque
# la app quede en un estado utilizable: dependencias, claves JWT,
# migraciones y datos de prueba. Idempotente; si todo existe, no repite.

set -e

cd /var/www/html

# 0. Cache del host puede traer rutas absolutas obsoletas. Limpieza preventiva.
rm -rf var/cache/* var/log/* 2>/dev/null || true

# 1. composer install si vendor falta o esta incompleto.
#    Detectamos incompletez comprobando un paquete obligatorio: doctrine-bundle.
if [ ! -f vendor/autoload.php ] || [ ! -f vendor/doctrine/doctrine-bundle/DoctrineBundle.php ]; then
    echo "[entrypoint] composer install (vendor ausente o incompleto)"
    rm -rf vendor/* 2>/dev/null || true
    composer install --no-interaction --prefer-dist --no-progress
fi

# 2. Generar claves JWT si no existen.
if [ ! -f config/jwt/private.pem ] || [ ! -f config/jwt/public.pem ]; then
    echo "[entrypoint] generando claves JWT"
    mkdir -p config/jwt
    php bin/console lexik:jwt:generate-keypair --skip-if-exists --no-interaction
fi

# 3. Esperar a MariaDB (depends_on healthcheck cubre la mayoria de casos,
#    pero protegemos contra arranques en frio).
for i in $(seq 1 30); do
    if php -r "new PDO('mysql:host=database;dbname=app', 'app', 'app');" 2>/dev/null; then
        break
    fi
    echo "[entrypoint] esperando a la base de datos ($i/30)"
    sleep 2
done

# 4. Schema. Si la BD esta vacia, generar tablas desde entidades.
#    Las migraciones historicas estan rotas (referencias cruzadas en orden
#    incorrecto), asi que en arranque limpio usamos doctrine:schema:create
#    y marcamos las migraciones como ya ejecutadas para mantener consistencia.
echo "[entrypoint] preparando schema"
php bin/console doctrine:database:create --if-not-exists --no-interaction

HAS_USER=$(php -r "try { \$pdo = new PDO('mysql:host=database;dbname=app', 'app', 'app'); \$pdo->query('SELECT 1 FROM user LIMIT 1'); echo 'yes'; } catch (\Exception \$e) { echo 'no'; }")
if [ "$HAS_USER" = "no" ]; then
    echo "[entrypoint] BD vacia, generando schema desde entidades"
    php bin/console doctrine:schema:create --no-interaction
    php bin/console doctrine:migrations:sync-metadata-storage --no-interaction || true
    php bin/console doctrine:migrations:version --add --all --no-interaction || true
else
    echo "[entrypoint] BD existente ($HAS_USER), aplicando migraciones pendientes"
    php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration || true
fi

# 5. Datos demo: comando idempotente; si los usuarios ya existen, no hace nada.
echo "[entrypoint] datos de demo"
php bin/console app:load-demo --no-interaction || true

# 6. Limpiar cache de Symfony para evitar referencias a paths del host.
php bin/console cache:clear --no-interaction || true

# 7. Permisos en var/ y public/uploads.
mkdir -p var/cache var/log public/uploads/avatars public/uploads/game_images \
         public/uploads/character_images public/uploads/scene-images
chmod -R 0777 var public/uploads || true

echo "[entrypoint] listo, arrancando comando principal"
exec "$@"
