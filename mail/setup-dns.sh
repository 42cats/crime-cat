#!/bin/bash

# AI 전용 Cloudflare DNS 레코드 자동 등록 스크립트
# Domain: crimecat.org (Dev 환경)

set -euo pipefail

# 환경변수 설정
DOMAIN="crimecat.org"
DKIM_SEL="202406"
HOSTNAME="mail.${DOMAIN}"
IP="14.36.34.122"

# Cloudflare API 설정 (환경변수에서 가져오기)
CF_TOKEN="${CF_TOKEN:-t8gmA2eacyz0sSF6QhQ0tJw_GlL7JC2-ov7WyC7X}"
CF_ZONE_ID="${CF_ZONE_ID:-3d5cb8acf04e398ddb399bd051b25ba3}"

# DKIM Public Key 읽기
PUB=$(cat dkim/crimecat.org/202406.txt)

echo "🔧 Cloudflare DNS 레코드 등록 시작..."
echo "도메인: $DOMAIN"
echo "호스트명: $HOSTNAME"
echo "서버 IP: $IP"
echo "DKIM 셀렉터: $DKIM_SEL"

# Cloudflare API 헤더
hdr=(-H "Authorization: Bearer ${CF_TOKEN}" -H "Content-Type: application/json")

# DNS 레코드 추가 함수
add_record() {
    local response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
        "${hdr[@]}" --data "$1")
    
    local success=$(echo "$response" | jq -r '.success')
    local result_id=$(echo "$response" | jq -r '.result.id // empty')
    local errors=$(echo "$response" | jq -r '.errors[]?.message // empty')
    
    if [ "$success" = "true" ]; then
        echo "✅ 레코드 추가 성공: $result_id"
        return 0
    else
        echo "❌ 레코드 추가 실패: $errors"
        return 1
    fi
}

# 1. A 레코드 (mail.crimecat.org)
echo "📍 A 레코드 추가: $HOSTNAME → $IP"
add_record '{
    "type":"A",
    "name":"'"${HOSTNAME}"'",
    "content":"'"${IP}"'",
    "ttl":300,
    "proxied":false
}'

# 2. SPF 레코드
echo "🛡️ SPF 레코드 추가"
add_record '{
    "type":"TXT",
    "name":"'"${DOMAIN}"'",
    "content":"v=spf1 ip4:'"${IP}"' include:_spf.mx.cloudflare.net ~all",
    "ttl":300,
    "proxied":false
}'

# 3. DKIM 레코드
echo "🔐 DKIM 레코드 추가: ${DKIM_SEL}._domainkey"
add_record '{
    "type":"TXT",
    "name":"'"${DKIM_SEL}._domainkey"'",
    "content":"v=DKIM1; k=rsa; p='"${PUB}"'",
    "ttl":300,
    "proxied":false
}'

# 4. DMARC 레코드
echo "📊 DMARC 레코드 추가"
add_record '{
    "type":"TXT",
    "name":"_dmarc",
    "content":"v=DMARC1; p=quarantine; rua=mailto:dmarc@'"${DOMAIN}"'; aspf=r; adkim=r",
    "ttl":300,
    "proxied":false
}'

echo ""
echo "🎉 DNS 레코드 등록 완료!"
echo ""
echo "📋 등록된 레코드:"
echo "   A:     $HOSTNAME → $IP"
echo "   TXT:   $DOMAIN → SPF 정책"
echo "   TXT:   ${DKIM_SEL}._domainkey.${DOMAIN} → DKIM 공개키"
echo "   TXT:   _dmarc.${DOMAIN} → DMARC 정책"
echo ""
echo "⏰ DNS 전파 시간: 5-10분 예상"
echo "🔍 확인 명령어:"
echo "   dig TXT ${DKIM_SEL}._domainkey.${DOMAIN}"
echo "   dig TXT ${DOMAIN}"
echo "   dig A ${HOSTNAME}"