#!/bin/sh

set -e

exec dumb-init -- php -S adminer:8080 -t /var/lib/adminer/

