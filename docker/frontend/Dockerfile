# Node.js 기반 빌드
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# 실행 단계 (개발용)
FROM node:18-alpine
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Vite 전역 설치 (해결 핵심)
RUN npm install -g vite

COPY frontend ./

EXPOSE 5173
CMD ["vite"]



## Prod type
# # 실행 단계
# FROM node:18-alpine
# WORKDIR /app

# # 빌드 결과물만 복사
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/package.json ./

# # vite가 devDependencies에 있으면 직접 설치 필요
# RUN npm install -g serve

# # 포트 노출 (vite preview 기본 4173 or serve는 3000)
# EXPOSE 3000

# # 정적 서버 실행
# CMD ["serve", "-s", "dist", "-l", "3000"]
