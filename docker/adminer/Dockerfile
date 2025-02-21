FROM alpine:latest

ENV ADMINER_URL="https://github.com/vrana/adminer/releases/download/v4.8.1/adminer-4.8.1.php"

RUN apk update && apk add wget && apk add php && apk add php83 && apk add php83-session && apk add php83-mbstring && \
apk add php83-mysqli && apk add php83-pdo_mysql && apk add dumb-init

RUN mkdir -p /var/lib/adminer && wget -qO /var/lib/adminer/index.php ${ADMINER_URL}


COPY docker/adminer/adminer.sh /root/adminer.sh
RUN chmod +rwx /root/adminer.sh
RUN [ ! -e /usr/bin/php ] && ln -s /usr/bin/php83 /usr/bin/php || echo "php already exists"

EXPOSE 8080

ENTRYPOINT ["/root/adminer.sh"]
