#!/bin/sh

set -e

mkdir -p /etc/nginx/ssl

if [ ! -f "/etc/nginx/ssl/server.crt" ] || [ ! -f "/etc/nginx/ssl/server.key" ]; then
	openssl req -newkey rsa:4096 -days 365 -nodes -x509 -subj "/C=KR/ST=Seoul/L=Seoul/O=sabyun/OU=sabyun/CN=KR" -keyout /etc/nginx/ssl/server.key -out /etc/nginx/ssl/server.crt ||
	{
	  echo "OpenSSL 명령어가 실패했습니다."
           exit 1
  }

  chmod 400 /etc/nginx/ssl/server.key
  chmod 444 /etc/nginx/ssl/server.crt
fi

nginx -g "daemon off;"
