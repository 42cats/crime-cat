# Signal Server - 경량 WebRTC 전용 이미지 (opus 제외)
FROM node:18-alpine3.18

WORKDIR /app

# 기본 도구만 설치 (네이티브 모듈 빌드 도구 제외)
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# 보안: 비루트 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S signalserver -u 1001 -G nodejs

# 의존성 파일 복사 및 설치
COPY --chown=signalserver:nodejs package*.json ./
RUN npm install --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 소스 코드 복사
COPY --chown=signalserver:nodejs index.js ./
COPY --chown=signalserver:nodejs services ./services/
COPY --chown=signalserver:nodejs test-server.js ./

# 비루트 사용자로 전환
USER signalserver

# 포트 노출
EXPOSE 4000

# 헬스체크 (실제 서버로 전환 시 수정 필요)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Signal Server 시작
CMD ["npm", "start"]