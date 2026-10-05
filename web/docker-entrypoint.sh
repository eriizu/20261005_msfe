#!/bin/sh
# Writes the runtime config from $API_URL, then hands over to darkhttpd.
set -eu
if [ -n "${API_URL:-}" ]; then
  escaped=$(printf '%s' "$API_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf 'window.MORNINGSTAR_CONFIG = { apiUrl: "%s" }\n' "$escaped" \
    > /var/www/localhost/htdocs/config.js
fi
exec darkhttpd /var/www/localhost/htdocs --no-server-id --no-listing "$@"
