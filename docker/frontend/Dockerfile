# docker/frontend/Dockerfile
# 빌드 전용 Docker 이미지
FROM node:20-alpine AS builder

# 빌드에 필요한 도구들 설치
RUN apk add --no-cache \
    file \
    bash \
    grep \
    sed \
    findutils \
    dos2unix \
    coreutils

WORKDIR /app

# 빌드 스크립트들 복사
COPY ./docker/frontend/pre-build-check.sh /pre-build-check.sh
COPY ./docker/frontend/entrypoint.sh /entrypoint.sh

# 실행 권한 부여
RUN chmod +x /pre-build-check.sh /entrypoint.sh

# 빌드 스크립트 실행
ENTRYPOINT ["/entrypoint.sh"]