#!/bin/sh
set -e

# Pastikan file .env tersedia di dalam container
if [ ! -f /var/www/.env ]; then
    if [ -f /var/www/.env.example ]; then
        cp /var/www/.env.example /var/www/.env
    else
        touch /var/www/.env
    fi
    chown www-data:www-data /var/www/.env
fi

# Pastikan folder storage dan cache tersedia dengan permission yang benar
mkdir -p /var/www/storage/framework/cache/data \
         /var/www/storage/framework/sessions \
         /var/www/storage/framework/views \
         /var/www/storage/logs \
         /var/www/storage/app/public \
         /var/www/bootstrap/cache

chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Buat symbolic link storage jika belum ada
if [ ! -L /var/www/public/storage ]; then
    php artisan storage:link --force || true
fi

# Jalankan command utama container (default: php-fpm)
exec "$@"
