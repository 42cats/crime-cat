FROM node:18-alpine3.18

# 애플리케이션 디렉토리 생성
RUN mkdir -p /root/bot

# 필수 패키지 설치
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    libstdc++ \
    curl \
    build-base

# yt-dlp 설치
RUN python3 -m pip install --no-cache-dir yt-dlp
RUN pip install -U yt-dlp
# 소스 코드 복사
COPY .env /root/bot
COPY bot /root/bot

VOLUME ["/root/bot"]
# 엔트리포인트 스크립트 설정
COPY docker/discord/entrypoint.sh /root/
RUN chmod +x /root/entrypoint.sh

# 작업 디렉토리 설정
WORKDIR /root/bot

# Node.js 의존성 설치
# RUN npm install -g nodemon && npm install

# 포트 노출
EXPOSE 3000

# 전체 경로를 사용하여 엔트리포인트 지정
ENTRYPOINT ["/root/entrypoint.sh"]
