# PHP-FPM 8.4 con todas las extensiones que pide Symfony 8.
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
        bash \
        git \
        unzip \
        icu-dev \
        libzip-dev \
        oniguruma-dev \
        mariadb-client \
        linux-headers \
        $PHPIZE_DEPS \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        intl \
        zip \
        opcache \
        sockets \
        bcmath \
    && pecl install apcu \
    && docker-php-ext-enable apcu \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY docker/php/entrypoint-ws.sh /usr/local/bin/entrypoint-ws.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint-ws.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm", "-F"]
