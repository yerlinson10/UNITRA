#!/bin/sh
set -e

# Bind mounts overwrite image ownership; ensure Laravel can write.
mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec php-fpm
