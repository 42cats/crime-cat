FROM alpine:latest

# Install required packages
RUN apk add --no-cache \
    postfix \
    postfix-policyd-spf-perl \
    opendkim \
    opendkim-utils \
    supervisor \
    rsyslog \
    cyrus-sasl \
    cyrus-sasl-digestmd5 \
    cyrus-sasl-crammd5 \
    cyrus-sasl-login \
    openssl \
    ca-certificates

# Copy configuration files
COPY docker/smtp/main.cf /etc/postfix/main.cf
COPY docker/smtp/master.cf /etc/postfix/master.cf
COPY docker/smtp/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/smtp/rsyslog.conf /etc/rsyslog.conf
COPY docker/smtp/entrypoint.sh /entrypoint.sh
COPY docker/smtp/generate-dkim.sh /generate-dkim.sh

# Create necessary directories and set permissions
RUN mkdir -p /var/log/supervisor \
    && mkdir -p /var/spool/rsyslog \
    && mkdir -p /var/spool/postfix \
    && mkdir -p /var/lib/postfix \
    && mkdir -p /etc/postfix/sasl \
    && mkdir -p /etc/opendkim/keys \
    && chmod +x /entrypoint.sh \
    && chmod +x /generate-dkim.sh \
    && chown -R postfix:postfix /var/spool/postfix \
    && chown -R postfix:postfix /var/lib/postfix

# Expose SMTP ports
EXPOSE 25 587

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]