FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 보안 강화를 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
    adduser -S signal -u 1001

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY --chown=signal:nodejs . .

# 비루트 사용자로 전환
USER signal

# 포트 노출
EXPOSE 4000

# 헬스체크 설정
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').request('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).end()"

# 시그널 서버 시작
CMD ["npm", "start"]