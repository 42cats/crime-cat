# 통합 배포 가이드

## 🚀 배포 전략 개요

### 서비스별 배포 방식
- **백엔드**: IntelliJ 직접 실행 (개발) → Docker (배포)
- **프론트엔드**: npm run dev (개발) → Docker + Nginx (배포)  
- **Discord 봇**: npm start (개발) → Docker + PM2 (배포)
- **인프라**: Docker Compose 통합 관리

## 🐳 Docker Compose 구조

### 개발 환경
```yaml
# docker-compose.yaml
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=local
    depends_on:
      - mariadb
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  discord-bot:
    build: ./bot
    environment:
      - NODE_ENV=development
    depends_on:
      - backend
      - redis

  mariadb:
    image: mariadb:10.6
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=discord

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx:/etc/nginx/conf.d
    depends_on:
      - frontend
      - backend
```

## 🛠️ 서비스별 배포 설정

### 백엔드 배포
```dockerfile
# backend/Dockerfile
FROM openjdk:21-jdk-slim
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
# 배포 명령어
cd backend/backend
./gradlew clean build
docker build -t crime-cat-backend .
```

### 프론트엔드 배포
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

```bash
# 배포 명령어
cd frontend
npm run build
docker build -t crime-cat-frontend .
```

### Discord 봇 배포
```dockerfile
# bot/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```javascript
// bot/ecosystem.config.js (PM2 설정)
module.exports = {
  apps: [{
    name: 'crime-cat-bot',
    script: 'main.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## 🔧 환경 설정

### 환경 변수 관리
```bash
# .env.production
# 백엔드
SPRING_PROFILES_ACTIVE=prod
DB_HOST=mariadb
DB_PORT=3306
REDIS_HOST=redis
REDIS_PORT=6379

# Discord 봇  
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_SECRET=your_client_secret
API_BASE_URL=http://backend:8080

# 프론트엔드
VITE_API_BASE_URL=https://api.crimecat.org
VITE_ENVIRONMENT=production
```

### 설정 파일 위치
```
config/
├── application-prod.yml     # 백엔드 프로덕션 설정
├── nginx/
│   ├── prod.nginx.conf     # Nginx 프로덕션 설정
│   └── local.nginx.conf    # Nginx 로컬 설정
└── dockercompose/
    ├── docker-compose.prod.yaml
    ├── docker-compose.dev.yaml
    └── docker-compose.local.yaml
```

## 🚀 배포 프로세스

### 전체 시스템 배포
```bash
# 1. 저장소 업데이트
git pull origin main

# 2. 백엔드 빌드
cd backend/backend
./gradlew clean build

# 3. 프론트엔드 빌드  
cd ../../frontend
npm run build

# 4. Docker 이미지 빌드 및 배포
cd ..
docker-compose -f config/dockercompose/docker-compose.prod.yaml up -d --build

# 5. 배포 확인
docker-compose ps
curl http://localhost/api/health
```

### 개별 서비스 재배포
```bash
# 백엔드만 재배포
docker-compose restart backend

# 프론트엔드만 재배포
docker-compose restart frontend nginx

# Discord 봇만 재배포
docker-compose restart discord-bot
```

## 🔍 헬스 체크

### 서비스 상태 확인
```bash
# 전체 서비스 상태
docker-compose ps

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f discord-bot

# 개별 서비스 헬스체크
curl http://localhost:8080/actuator/health  # 백엔드
curl http://localhost:5173                  # 프론트엔드  
redis-cli ping                              # Redis
mysql -h localhost -u root -p -e "SELECT 1" # MariaDB
```

### 모니터링 엔드포인트
```yaml
# 백엔드 Spring Actuator
/actuator/health     # 헬스 체크
/actuator/info       # 서비스 정보
/actuator/metrics    # 메트릭

# 프론트엔드
/                    # 메인 페이지 로드 확인

# Discord 봇
# 봇 상태는 Discord 서버에서 온라인 여부로 확인
```

## 🔒 보안 설정

### SSL/TLS 설정
```nginx
# nginx SSL 설정
server {
    listen 443 ssl http2;
    server_name api.crimecat.org;
    
    ssl_certificate /etc/ssl/certs/crimecat.org.crt;
    ssl_certificate_key /etc/ssl/private/crimecat.org.key;
    
    location /api/ {
        proxy_pass http://backend:8080/;
    }
}
```

### 방화벽 설정
```bash
# 필요한 포트만 개방
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS  
ufw allow 22/tcp      # SSH
ufw deny 3306/tcp     # MariaDB (내부 접근만)
ufw deny 6379/tcp     # Redis (내부 접근만)
```

## 📊 성능 최적화

### 리소스 제한
```yaml
# docker-compose에서 리소스 제한
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          memory: 1G
          
  discord-bot:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 캐시 전략
- **Redis**: 캐시 + Pub/Sub (메모리 제한: 1GB)
- **Nginx**: 정적 파일 캐시 (1일)
- **CDN**: 이미지/에셋 배포 (선택사항)

## 🔧 문제 해결

### 일반적인 배포 문제
```bash
# 포트 충돌 해결
sudo lsof -i :8080
sudo kill -9 <PID>

# Docker 이미지 정리
docker system prune -a
docker volume prune

# 로그 파일 용량 관리  
docker-compose logs --tail=100 backend
docker system df

# 디스크 공간 확인
df -h
du -sh /var/lib/docker
```

### 서비스별 트러블슈팅
- **백엔드**: [백엔드 문제 해결](../backend/troubleshooting/common-errors.md)
- **프론트엔드**: [프론트엔드 최적화](../frontend/optimization/performance.md)
- **Discord 봇**: [봇 배포 가이드](../discord-bot/deployment/production-deploy.md)

## 🔄 롤백 전략

### 빠른 롤백
```bash
# 이전 버전으로 롤백
git log --oneline -10  # 이전 커밋 확인
git checkout <previous-commit-hash>
docker-compose up -d --build

# 특정 서비스만 롤백
docker-compose stop backend
docker run -d --name backend-rollback <previous-image>
```

## 🔗 관련 문서
- [백엔드 인프라 설정](../backend/infrastructure/redis-cache.md)
- [프론트엔드 빌드 최적화](../frontend/optimization/bundle-optimization.md)
- [Discord 봇 프로덕션 배포](../discord-bot/deployment/production-deploy.md)
- [프로젝트 개요](project-overview.md)