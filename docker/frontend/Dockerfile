# docker/frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY ./docker/frontend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]





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
