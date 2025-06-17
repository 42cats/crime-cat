# Discord Bot - opus 및 음성 기능 포함 이미지
FROM node:18-alpine3.18

# 필수 패키지 설치 (opus 빌드 포함)
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    libstdc++ \
    curl \
    build-base \
    make \
    g++ \
    opus-dev \
    opus-tools && \
    ln -sf python3 /usr/bin/python

# yt-dlp 설치
RUN python3 -m pip install --no-cache-dir --break-system-packages yt-dlp

# 작업 디렉토리 설정
WORKDIR /root/bot

# 권한 설정
RUN chmod 755 /root/bot

# 엔트리포인트 스크립트 설정
COPY docker/discord/entrypoint.sh /root/
RUN chmod +x /root/entrypoint.sh

# 포트 노출
EXPOSE 3000

# Discord Bot 시작
ENTRYPOINT ["/root/entrypoint.sh"]
