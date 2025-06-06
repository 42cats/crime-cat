#!/bin/sh

# DKIM 키 생성 스크립트
DOMAIN="mystery-place.com"
SELECTOR="default"
KEY_DIR="/etc/opendkim/keys"

echo "Generating DKIM keys for $DOMAIN..."

# 키 디렉토리 생성
mkdir -p $KEY_DIR/$DOMAIN

# DKIM 키 생성 (2048bit RSA)
opendkim-genkey -t -s $SELECTOR -d $DOMAIN -D $KEY_DIR/$DOMAIN

# 파일 권한 설정
chmod 600 $KEY_DIR/$DOMAIN/$SELECTOR.private
chmod 644 $KEY_DIR/$DOMAIN/$SELECTOR.txt

echo "✅ DKIM keys generated!"
echo ""
echo "📋 DNS 설정용 public key:"
echo "================================"
cat $KEY_DIR/$DOMAIN/$SELECTOR.txt
echo "================================"
echo ""
echo "🔑 Private key location: $KEY_DIR/$DOMAIN/$SELECTOR.private"