# Node.js 기반 빌드
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# 실행 컨테이너
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install --production
EXPOSE 5173
CMD ["npm", "run", "preview"]
