# ==============================================================================
# Production Dockerfile untuk Laravel (PHP-FPM)
# Versi PHP: 8.3 (sesuai composer.json)
# ==============================================================================
FROM php:8.3-fpm-alpine

# Set working directory
WORKDIR /var/www

# Install dependensi sistem Alpine yang dibutuhkan untuk ekstensi PHP
RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libwebp-dev \
    libzip-dev \
    zip \
    unzip \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    linux-headers

# Konfigurasi & Install ekstensi PHP untuk Laravel
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        zip \
        opcache

# Pasang Composer resmi
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Konfigurasi OPcache untuk performa produksi
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=8'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.revalidate_freq=2'; \
        echo 'opcache.fast_shutdown=1'; \
    } > $PHP_INI_DIR/conf.d/opcache-recommended.ini

# Konfigurasi batas upload dan memory PHP untuk berkas dokumen/lampiran
RUN { \
        echo 'upload_max_filesize=64M'; \
        echo 'post_max_size=64M'; \
        echo 'memory_limit=256M'; \
        echo 'max_execution_time=300'; \
    } > $PHP_INI_DIR/conf.d/custom-php.ini

# Copy composer manifest terlebih dahulu untuk memanfaatkan Docker cache layer
COPY composer.json composer.lock ./

# Install dependensi composer (tanpa dev package untuk produksi)
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --no-autoloader

# Salin seluruh kode proyek Laravel
COPY . .

# Generate optimized class loader
RUN composer dump-autoload --optimize --no-dev

# Siapkan berkas .env awal dari .env.example jika belum ada
RUN if [ -f .env.example ] && [ ! -f .env ]; then cp .env.example .env; fi

# Siapkan direktori storage & bootstrap cache dengan hak akses yang tepat
RUN mkdir -p storage/framework/cache/data \
             storage/framework/sessions \
             storage/framework/views \
             storage/logs \
             storage/app/public \
             bootstrap/cache \
    && chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Pasang entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Gunakan non-root user untuk eksekusi PHP-FPM
USER www-data

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Expose port FastCGI
EXPOSE 9000

CMD ["php-fpm"]
