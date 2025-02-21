#!/bin/sh

CERT_PATH="/data/caddy/certificates"  # Caddy가 발급받은 인증서를 저장하는 디렉토리

echo "[ENTRYPOINT] Starting Caddy with DuckDNS..."

if [ -d "$CERT_PATH" ] && [ "$(ls -A "$CERT_PATH" 2>/dev/null)" ]; then
  echo "[ENTRYPOINT] 기존 인증서가 확인되었습니다: $CERT_PATH"
  echo "[ENTRYPOINT] 추가 인증서 발급 과정을 건너뜁니다."
else
  echo "[ENTRYPOINT] 기존 인증서가 없습니다. 새 인증서 발급을 시도합니다."
fi

# 최종적으로 Caddy를 실행
# Dockerfile의 CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"] 와 같은 효과
exec "$@"
