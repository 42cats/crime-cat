#!/bin/sh
set -e

# Create postfix user if it doesn't exist
if ! id postfix >/dev/null 2>&1; then
    adduser -D -s /bin/false postfix
fi

# Create postdrop group if it doesn't exist
if ! getent group postdrop >/dev/null 2>&1; then
    addgroup postdrop
fi

# Create necessary directories
mkdir -p /var/spool/postfix
mkdir -p /var/lib/postfix
mkdir -p /etc/postfix/sasl

# Set proper permissions
chown -R postfix:postfix /var/spool/postfix
chown -R postfix:postfix /var/lib/postfix

# Create SASL password file for authentication
cat > /etc/postfix/sasl/sasl_passwd << EOF
[smtp.gmail.com]:587 ${SMTP_USERNAME}:${SMTP_PASSWORD}
EOF

# Set permissions for SASL password file
chmod 644 /etc/postfix/sasl/sasl_passwd
chown root:root /etc/postfix/sasl/sasl_passwd

# Hash the SASL password file
postmap /etc/postfix/sasl/sasl_passwd

# Fix permissions for the hashed file
chmod 644 /etc/postfix/sasl/sasl_passwd.lmdb
chown root:root /etc/postfix/sasl/sasl_passwd.lmdb || true

# Create virtual alias file
touch /etc/postfix/virtual
postmap /etc/postfix/virtual

# Update main.cf with environment variables
sed -i "s/myhostname = .*/myhostname = ${MAIL_HOSTNAME}/" /etc/postfix/main.cf
sed -i "s/mydomain = .*/mydomain = ${MAIL_DOMAIN}/" /etc/postfix/main.cf

# Skip SASL local user creation for relay-only setup
# We only need relay authentication to Gmail SMTP
echo "Configuring SMTP relay authentication to Gmail..."

# Create SASL configuration for client authentication (not server)
mkdir -p /etc/sasl2
cat > /etc/sasl2/smtpd.conf << EOF
pwcheck_method: auxprop
auxprop_plugin: sasldb
mech_list: PLAIN LOGIN
EOF

# For relay-only SMTP, we don't need local SASL users
# The authentication happens at Gmail's SMTP server
echo "SMTP relay configuration completed - no local SASL users needed"

# Generate DH parameters in a writable location
if [ ! -f /tmp/dhparam.pem ]; then
    openssl dhparam -out /tmp/dhparam.pem 2048
fi

# Update postfix configuration with DH parameters
echo "smtpd_tls_dh1024_param_file = /tmp/dhparam.pem" >> /etc/postfix/main.cf

# Initialize postfix databases
newaliases
postmap /etc/postfix/virtual

# Start services
exec "$@"